import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { apiError, assertApiBrandAccess, requireApiAuth } from "@/lib/api-auth.server";
import { enqueueResearchRun } from "@/lib/orchestrator.server";

const inputSchema = z.object({
  kind: z
    .enum(["visibility", "demand_discovery", "competitor", "brand_memory", "report", "onboarding"])
    .default("visibility"),
  measurementMode: z
    .enum(["full", "single", "discovery", "onboarding", "remeasure"])
    .default("full"),
  manifest: z.record(z.string(), z.unknown()).default({}),
  idempotencyKey: z.string().min(8).max(200),
});

export const Route = createFileRoute("/api/v1/projects/$brandId/runs")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          const auth = await requireApiAuth(request);
          await assertApiBrandAccess(auth.supabase, params.brandId);
          const input = inputSchema.parse(await request.json());
          const result = await enqueueResearchRun({
            brandId: params.brandId,
            ...input,
            trigger: "api",
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
