import { createFileRoute } from "@tanstack/react-router";
import { apiError, assertApiBrandAccess, requireApiAuth } from "@/lib/api-auth.server";

export const Route = createFileRoute("/api/v1/projects/$brandId/visibility")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const auth = await requireApiAuth(request);
          await assertApiBrandAccess(auth.supabase, params.brandId);
          const [{ data: prompts }, { data: batches }] = await Promise.all([
            auth.supabase
              .from("prompts")
              .select(
                "id,text,status,prompt_runs(id,visibility,brand_mentioned,position,created_at,engine)",
              )
              .eq("brand_id", params.brandId),
            auth.supabase
              .from("measurement_batches")
              .select("id,score,components,created_at,finished_at,status")
              .eq("brand_id", params.brandId)
              .eq("measurement_mode" as never, "full" as never)
              .order("created_at", { ascending: false })
              .limit(24),
          ]);
          return Response.json({
            measurementSurface: "agent_web_grounded",
            prompts: prompts ?? [],
            fullRounds: batches ?? [],
          });
        } catch (error) {
          return apiError(error);
        }
      },
    },
  },
});
