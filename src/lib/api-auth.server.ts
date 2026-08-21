import { createClient } from "@supabase/supabase-js";
import { createAuthClientOptions } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export async function requireApiAuth(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token || token.split(".").length !== 3) throw new Response("Unauthorized", { status: 401 });
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Supabase API configuration missing");
  const supabase = createClient<Database, "onecite">(url, key, createAuthClientOptions(key, token));
  const { data, error } = await supabase.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (error || !userId) throw new Response("Unauthorized", { status: 401 });
  return { supabase, userId };
}

export async function assertApiBrandAccess(
  supabase: Awaited<ReturnType<typeof requireApiAuth>>["supabase"],
  brandId: string,
) {
  const { data } = await supabase
    .from("brand_members")
    .select("brand_id")
    .eq("brand_id", brandId)
    .maybeSingle();
  if (!data) throw new Response("Forbidden", { status: 403 });
}

export function apiError(error: unknown): Response {
  if (error instanceof Response) return error;
  return Response.json(
    { error: error instanceof Error ? error.message : String(error) },
    { status: 500 },
  );
}
