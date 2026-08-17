// Yonetim paneli sunucu yardimcilari. Her yonetim fonksiyonu once assertAdmin
// cagirir: arayuz kontrolu tek basina guvenlik degildir.
import { recordError } from "./observability.server";

type AuthedContext = {
  supabase: { from: (table: string) => any };
  userId: string;
  claims?: Record<string, unknown> | null;
};

export type AdminSession = {
  supabaseAdmin: Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];
  adminId: string;
  adminEmail: string | null;
};

export async function assertAdmin(context: AuthedContext): Promise<AdminSession> {
  const { data: roleRow, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !roleRow) throw new Error("Bu işlem için yönetici yetkisi gerekiyor");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const email = (context.claims?.["email"] as string | undefined) ?? null;
  return { supabaseAdmin, adminId: context.userId, adminEmail: email };
}

export async function audit(
  session: AdminSession,
  action: string,
  target: { type?: string; id?: string | null } = {},
  detail: Record<string, unknown> = {},
) {
  try {
    await session.supabaseAdmin.from("admin_audit_log").insert({
      admin_id: session.adminId,
      admin_email: session.adminEmail,
      action,
      target_type: target.type ?? null,
      target_id: target.id ?? null,
      detail: detail as never,
    });
  } catch (error) {
    recordError({ message: `audit log failed: ${String(error)}`, source: "server", path: action });
  }
}
