import { createFileRoute } from "@tanstack/react-router";
import { apiError, assertApiBrandAccess, requireApiAuth } from "@/lib/api-auth.server";
import { getResearchRun } from "@/lib/orchestrator.server";

export const Route = createFileRoute("/api/v1/runs/$runId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const auth = await requireApiAuth(request);
          const result = await getResearchRun(params.runId);
          const run = result.run as unknown as { brand_id?: string } | null;
          if (!run?.brand_id) return Response.json({ error: "Not found" }, { status: 404 });
          await assertApiBrandAccess(auth.supabase, run.brand_id);
          return Response.json(result);
        } catch (error) {
          return apiError(error);
        }
      },
    },
  },
});
