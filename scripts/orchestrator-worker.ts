import { supabaseAdmin } from "../src/integrations/supabase/client.server";
import { executeResearchStage } from "../src/lib/research-stage-executor.server";
import { runStagePipeline, type ClaimedJob } from "../src/lib/orchestrator-worker.server";

const workerId = process.env["ONECITE_WORKER_ID"] ?? `worker-${process.pid}`;
const once = process.env["ORCHESTRATOR_ONCE"] === "true";
let stopping = false;
process.on("SIGTERM", () => {
  stopping = true;
});
process.on("SIGINT", () => {
  stopping = true;
});

async function rpcBoolean(name: string, args: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin.rpc(name as never, args as never);
  if (error) throw new Error(error.message);
  return data === true;
}

async function claim(): Promise<(ClaimedJob & { attempts: number; maxAttempts: number }) | null> {
  const { data, error } = await supabaseAdmin.rpc(
    "claim_orchestrator_job" as never,
    { _worker_id: workerId, _lease_seconds: 180 } as never,
  );
  if (error) throw new Error(error.message);
  const row = (Array.isArray(data) ? data[0] : data) as unknown as
    Record<string, unknown> | undefined;
  if (!row?.id || !row.run_id || !row.claim_token) return null;
  return {
    id: String(row.id),
    runId: String(row.run_id),
    claimToken: String(row.claim_token),
    stage: String(row.stage ?? "project_definition"),
    attempts: Number(row.attempt_count ?? 1),
    maxAttempts: Number(row.max_attempts ?? 3),
  };
}

async function updateRemeasureTask(runId: string, status: "completed" | "failed") {
  const { data } = await supabaseAdmin
    .from("orchestrator_jobs" as never)
    .select("payload" as never)
    .eq("run_id" as never, runId)
    .maybeSingle();
  const taskId = String(
    (data as unknown as { payload?: { taskId?: string } } | null)?.payload?.taskId ?? "",
  );
  if (!taskId) return;
  await supabaseAdmin
    .from("geo_tasks")
    .update({
      remeasure_status: status,
      ...(status === "completed" ? { after_snapshot_id: runId } : {}),
    } as never)
    .eq("id", taskId);
}

while (!stopping) {
  const job = await claim();
  if (!job) {
    if (once) break;
    await new Promise((resolve) => setTimeout(resolve, 2000));
    continue;
  }
  try {
    await supabaseAdmin
      .from("research_runs" as never)
      .update({ status: "running", started_at: new Date().toISOString() } as never)
      .eq("id" as never, job.runId);
    await runStagePipeline(job, {
      heartbeat: (current) =>
        rpcBoolean("heartbeat_orchestrator_job", {
          _job_id: current.id,
          _claim_token: current.claimToken,
          _lease_seconds: 180,
        }),
      execute: executeResearchStage,
      advance: (current, stage) =>
        rpcBoolean("advance_orchestrator_job", {
          _job_id: current.id,
          _claim_token: current.claimToken,
          _stage: stage,
        }),
      complete: async (current) => {
        const ok = await rpcBoolean("finish_orchestrator_job", {
          _job_id: current.id,
          _claim_token: current.claimToken,
          _status: "completed",
          _stage: "monitoring",
          _metrics: {},
          _error: null,
        });
        if (ok) {
          await supabaseAdmin
            .from("research_runs" as never)
            .update({ status: "completed", finished_at: new Date().toISOString() } as never)
            .eq("id" as never, current.runId);
          await updateRemeasureTask(current.runId, "completed");
        }
        return ok;
      },
      fail: async (current, error) => {
        const terminal = job.attempts >= job.maxAttempts;
        const ok = await rpcBoolean("finish_orchestrator_job", {
          _job_id: current.id,
          _claim_token: current.claimToken,
          _status: terminal ? "failed" : "retry",
          _stage: current.stage,
          _metrics: {},
          _error: { message: error instanceof Error ? error.message : String(error) },
        });
        if (ok && terminal) {
          await supabaseAdmin
            .from("research_runs" as never)
            .update({ status: "failed", finished_at: new Date().toISOString() } as never)
            .eq("id" as never, current.runId);
          await updateRemeasureTask(current.runId, "failed");
        }
        return ok;
      },
    });
  } catch (error) {
    console.error(`[orchestrator] ${job.id} failed`, error);
  }
  if (once) break;
}
