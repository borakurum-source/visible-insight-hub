import { sendLovableEmail, EmailAPIError } from "@lovable.dev/email-js";
import { fillPlaceholders } from "./email-templates/send-email";
import { TEMPLATE_DEF_MAP } from "./admin-email-defs";
import { recordEmailLog } from "./observability.server";

const SENDER_DOMAIN = "notify.1cite.com";
const FROM = "OneCite <noreply@notify.1cite.com>";

/** Duz HTML e-posta gonderir (yonetim paneli ve toplu bildirimler icin). */
export async function sendRawEmail(
  to: string,
  subject: string,
  html: string,
  data: Record<string, unknown> = {},
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("LOVABLE_API_KEY tanımlı değil");
  const finalSubject = fillPlaceholders(subject, data);
  const finalHtml = fillPlaceholders(html, data);
  try {
    await sendLovableEmail(
      {
        to,
        from: FROM,
        sender_domain: SENDER_DOMAIN,
        subject: finalSubject,
        html: finalHtml,
        text: finalHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
        purpose: "transactional",
        label: "admin",
        idempotency_key: crypto.randomUUID(),
      },
      { apiKey, sendUrl: process.env["LOVABLE_SEND_URL"] },
    );
  } catch (error) {
    const reason = (error instanceof EmailAPIError ? error.code : String(error)) ?? "unknown_error";
    recordEmailLog({ toEmail: to, subject: finalSubject, templateKey: "admin", status: error instanceof EmailAPIError && error.code === "recipient_suppressed" ? "suppressed" : "failed", error: reason });
    if (error instanceof EmailAPIError && error.code === "recipient_suppressed") return { sent: false, reason: "recipient_suppressed" };
    return { sent: false, reason };
  }
  recordEmailLog({ toEmail: to, subject: finalSubject, templateKey: "admin", status: "sent" });
  return { sent: true };
}

/** Yonetilen sablonu (varsa DB override'i ile) gonderir. */
export async function sendManagedEmail(key: string, to: string, data: Record<string, unknown> = {}) {
  const def = TEMPLATE_DEF_MAP[key];
  if (!def) throw new Error(`Bilinmeyen şablon: ${key}`);
  let subject = def.subject;
  let body = def.body;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("email_templates").select("subject, body").eq("key", key).maybeSingle();
    if (row?.body) {
      subject = row.subject;
      body = row.body;
    }
  } catch {
    // override okunamazsa varsayilan sablon kullanilir
  }
  return sendRawEmail(to, subject, body, data);
}
