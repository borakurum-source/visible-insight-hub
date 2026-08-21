import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { apiError, assertApiBrandAccess, requireApiAuth } from "@/lib/api-auth.server";

const schema = z.object({
  brandId: z.string().uuid(),
  title: z.string().min(3).max(200),
  payload: z.record(z.string(), z.unknown()),
  isPublic: z.boolean().default(false),
});

export const Route = createFileRoute("/api/v1/reports")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireApiAuth(request);
          const input = schema.parse(await request.json());
          await assertApiBrandAccess(auth.supabase, input.brandId);
          const token = crypto.randomUUID().replaceAll("-", "");
          const { data, error } = await auth.supabase
            .from("reports")
            .insert({
              brand_id: input.brandId,
              token,
              title: input.title,
              payload: input.payload as never,
              is_public: input.isPublic,
            } as never)
            .select("id,token")
            .single();
          if (error) throw new Error(error.message);
          return Response.json(data, { status: 201 });
        } catch (error) {
          return apiError(error);
        }
      },
    },
  },
});
