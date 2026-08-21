export const RESEARCH_STAGES = [
  "project_definition",
  "query_expansion",
  "discovery",
  "url_selection",
  "evidence_fetch",
  "normalization",
  "citation_analysis",
  "signal_generation",
  "researched_generation",
  "content_generation",
  "final_report",
  "monitoring",
] as const;

export type ResearchStage = (typeof RESEARCH_STAGES)[number];
export type ClaimedJob = { id: string; runId: string; claimToken: string; stage: string };
export type WorkerAdapter = {
  heartbeat: (job: ClaimedJob) => Promise<boolean>;
  execute: (stage: ResearchStage, job: ClaimedJob) => Promise<void>;
  advance: (job: ClaimedJob, nextStage: ResearchStage) => Promise<boolean>;
  complete: (job: ClaimedJob) => Promise<boolean>;
  fail: (job: ClaimedJob, error: unknown) => Promise<boolean>;
};

export async function runStagePipeline(job: ClaimedJob, adapter: WorkerAdapter): Promise<void> {
  const start = Math.max(0, RESEARCH_STAGES.indexOf(job.stage as ResearchStage));
  try {
    for (let index = start; index < RESEARCH_STAGES.length; index += 1) {
      const stage = RESEARCH_STAGES[index]!;
      if (!(await adapter.heartbeat(job))) throw new Error("orchestrator lease lost");
      let heartbeatFailure: Error | null = null;
      const heartbeatTimer = setInterval(() => {
        void adapter
          .heartbeat(job)
          .then((active) => {
            if (!active) heartbeatFailure = new Error("orchestrator lease lost");
          })
          .catch(() => {
            heartbeatFailure = new Error("orchestrator heartbeat failed");
          });
      }, 45_000);
      heartbeatTimer.unref?.();
      try {
        await adapter.execute(stage, job);
      } finally {
        clearInterval(heartbeatTimer);
      }
      if (heartbeatFailure || !(await adapter.heartbeat(job)))
        throw heartbeatFailure ?? new Error("orchestrator lease lost");
      const next = RESEARCH_STAGES[index + 1];
      if (next && !(await adapter.advance(job, next))) throw new Error("orchestrator lease lost");
      job.stage = next ?? stage;
    }
    if (!(await adapter.complete(job)))
      throw new Error("orchestrator lease lost before completion");
  } catch (error) {
    await adapter.fail(job, error);
    throw error;
  }
}
