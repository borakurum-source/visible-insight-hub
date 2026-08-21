import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type ResearchKind =
  "visibility" | "demand_discovery" | "competitor" | "brand_memory" | "report" | "onboarding";
export type RunTrigger = "user" | "cron" | "onboarding" | "api";

export async function enqueueResearchRun(input: {
  brandId: string;
  kind: ResearchKind;
  measurementMode: "full" | "single" | "discovery" | "onboarding" | "remeasure";
  trigger: RunTrigger;
  idempotencyKey: string;
  manifest: Record<string, unknown>;
  createdBy?: string;
}) {
  const { data, error } = await supabaseAdmin.rpc(
    "enqueue_orchestrator_run" as never,
    {
      _brand_id: input.brandId,
      _kind: input.kind,
      _measurement_mode: input.measurementMode,
      _trigger: input.trigger,
      _idempotency_key: input.idempotencyKey,
      _manifest: input.manifest,
      _created_by: input.createdBy ?? null,
    } as never,
  );
  if (error) throw new Error(error.message);
  const row = (Array.isArray(data) ? data[0] : data) as unknown as {
    run_id?: string;
    job_id?: string;
  } | null;
  if (!row?.run_id || !row.job_id) throw new Error("Orchestrator run could not be enqueued");
  return { runId: row.run_id, jobId: row.job_id };
}

export async function getResearchRun(runId: string) {
  const [{ data: run, error }, { data: stages }] = await Promise.all([
    supabaseAdmin
      .from("research_runs" as never)
      .select("*" as never)
      .eq("id" as never, runId)
      .maybeSingle(),
    supabaseAdmin
      .from("research_run_stages" as never)
      .select("*" as never)
      .eq("run_id" as never, runId)
      .order("ordinal" as never),
  ]);
  if (error) throw new Error(error.message);
  return { run, stages: stages ?? [] };
}
