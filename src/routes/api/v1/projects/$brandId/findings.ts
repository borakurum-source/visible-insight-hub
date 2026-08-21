import { createFileRoute } from "@tanstack/react-router";
import { apiError, assertApiBrandAccess, requireApiAuth } from "@/lib/api-auth.server";

export const Route = createFileRoute("/api/v1/projects/$brandId/findings")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const auth = await requireApiAuth(request);
          await assertApiBrandAccess(auth.supabase, params.brandId);
          const { data, error } = await auth.supabase
            .from("findings" as never)
            .select("*" as never)
            .eq("brand_id" as never, params.brandId)
            .order("created_at" as never, { ascending: false });
          if (error) throw new Error(error.message);
          return Response.json({ findings: data ?? [] });
        } catch (error) {
          return apiError(error);
        }
      },
    },
  },
});
