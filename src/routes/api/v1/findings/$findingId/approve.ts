import { createFileRoute } from "@tanstack/react-router";
import { apiError, requireApiAuth } from "@/lib/api-auth.server";

export const Route = createFileRoute("/api/v1/findings/$findingId/approve")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          const auth = await requireApiAuth(request);
          const { data, error } = await auth.supabase.rpc(
            "approve_finding_to_task" as never,
            { _finding_id: params.findingId } as never,
          );
          if (error) throw new Error(error.message);
          return Response.json({ taskId: data });
        } catch (error) {
          return apiError(error);
        }
      },
    },
  },
});
