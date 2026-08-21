import { createFileRoute } from "@tanstack/react-router";
import { apiError } from "@/lib/api-auth.server";

export const Route = createFileRoute("/api/v1/reports/$token")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin
            .from("reports")
            .select("title,payload,created_at,updated_at")
            .eq("token", params.token)
            .eq("is_public" as never, true as never)
            .maybeSingle();
          if (error) throw new Error(error.message);
          if (!data) return Response.json({ error: "Not found" }, { status: 404 });
          return Response.json(data);
        } catch (error) {
          return apiError(error);
        }
      },
    },
  },
});
