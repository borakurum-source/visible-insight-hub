import { createFileRoute } from "@tanstack/react-router";
import { apiError, assertApiBrandAccess, requireApiAuth } from "@/lib/api-auth.server";
import { enqueueResearchRun } from "@/lib/orchestrator.server";

export const Route = createFileRoute("/api/v1/tasks/$taskId/remeasure")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          const auth = await requireApiAuth(request);
          const { data: task } = await auth.supabase
            .from("geo_tasks")
            .select("*")
            .eq("id", params.taskId)
            .maybeSingle();
          if (!task) return Response.json({ error: "Not found" }, { status: 404 });
          await assertApiBrandAccess(auth.supabase, task.brand_id);
          const findingId = (task as unknown as { finding_id?: string | null }).finding_id;
          const { data: finding } = findingId
            ? await auth.supabase
                .from("findings" as never)
                .select("affected_entities" as never)
                .eq("id" as never, findingId)
                .maybeSingle()
            : { data: null };
          const batchId = String(
            (
              finding as unknown as {
                affected_entities?: { batch_id?: string };
              } | null
            )?.affected_entities?.batch_id ?? "",
          );
          const { data: originalRuns } = batchId
            ? await auth.supabase
                .from("prompt_runs")
                .select("prompt_id")
                .eq("batch_id" as never, batchId as never)
            : { data: [] };
          const promptIds = [...new Set((originalRuns ?? []).map((run) => run.prompt_id))];
          const result = await enqueueResearchRun({
            brandId: task.brand_id,
            kind: "visibility",
            measurementMode: "remeasure",
            trigger: "api",
            idempotencyKey: request.headers.get("idempotency-key") ?? `remeasure:${params.taskId}`,
            manifest: { taskId: params.taskId, expectedOutcome: task.title, promptIds },
            createdBy: auth.userId,
          });
          const { data: before } = await auth.supabase
            .from("research_runs" as never)
            .select("id" as never)
            .eq("brand_id" as never, task.brand_id)
            .eq("kind" as never, "visibility")
            .eq("status" as never, "completed")
            .order("created_at" as never, { ascending: false })
            .limit(1)
            .maybeSingle();
          await auth.supabase
            .from("geo_tasks")
            .update({
              remeasure_status: "queued",
              before_snapshot_id: (before as unknown as { id?: string } | null)?.id ?? null,
            } as never)
            .eq("id", params.taskId);
          return Response.json(result, { status: 202 });
        } catch (error) {
          return apiError(error);
        }
      },
    },
  },
});
