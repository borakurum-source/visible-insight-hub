import { createFileRoute } from "@tanstack/react-router";
import { apiError, assertApiBrandAccess, requireApiAuth } from "@/lib/api-auth.server";
import { enqueueResearchRun } from "@/lib/orchestrator.server";

export const Route = createFileRoute("/api/v1/prompts/$promptId/measure")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          const auth = await requireApiAuth(request);
          const { data: prompt } = await auth.supabase
            .from("prompts")
            .select("brand_id,text")
            .eq("id", params.promptId)
            .maybeSingle();
          if (!prompt) return Response.json({ error: "Not found" }, { status: 404 });
          await assertApiBrandAccess(auth.supabase, prompt.brand_id);
          const idempotencyKey =
            request.headers.get("idempotency-key") ??
            `single:${params.promptId}:${new Date().toISOString().slice(0, 16)}`;
          const result = await enqueueResearchRun({
            brandId: prompt.brand_id,
            kind: "visibility",
            measurementMode: "single",
            trigger: "api",
            idempotencyKey,
            manifest: { promptIds: [params.promptId], prompt: prompt.text },
            createdBy: auth.userId,
          });
          return Response.json(result, { status: 202 });
        } catch (error) {
          return apiError(error);
        }
      },
    },
  },
});
