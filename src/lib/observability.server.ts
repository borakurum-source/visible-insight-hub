// Sunucu tarafi gozlemlenebilirlik: hata ve API kullanim kayitlari.
// Yalnizca sunucuda calisir; yonetim paneli bu tablolari okur.

type Sb = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

async function admin(): Promise<Sb | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return supabaseAdmin;
  } catch {
    return null;
  }
}

export type ApiProvider = "perplexity" | "deepseek" | "lovable-ai" | "firecrawl" | "google" | "bing" | "paddle";

// 1M token basina yaklasik USD maliyet (tahmini; panelde "tahmini" olarak gosterilir).
const TOKEN_PRICING: Record<string, { input: number; output: number }> = {
  perplexity: { input: 1, output: 1 },
  deepseek: { input: 0.27, output: 1.1 },
  "lovable-ai": { input: 0.15, output: 0.6 },
};

// Token bazli olmayan sagalayicilar icin cagri basina yaklasik maliyet.
const CALL_PRICING: Record<string, number> = {
  firecrawl: 0.002,
  google: 0,
  bing: 0,
  paddle: 0,
};

export function estimateCost(provider: string, inputTokens: number, outputTokens: number): number {
  const tokens = TOKEN_PRICING[provider];
  if (tokens) return (inputTokens / 1_000_000) * tokens.input + (outputTokens / 1_000_000) * tokens.output;
  return CALL_PRICING[provider] ?? 0;
}

export interface ApiUsageEntry {
  provider: ApiProvider | string;
  operation: string;
  model?: string | null;
  userId?: string | null;
  brandId?: string | null;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  cached?: boolean;
  status?: "ok" | "error" | "rate_limited";
  error?: string | null;
}

/** Ates-ve-unut: kayit hatasi asla cagriyi bozmaz. */
export function recordApiUsage(entry: ApiUsageEntry): void {
  void (async () => {
    const sb = await admin();
    if (!sb) return;
    const inputTokens = Math.max(0, Math.round(entry.inputTokens ?? 0));
    const outputTokens = Math.max(0, Math.round(entry.outputTokens ?? 0));
    try {
      await sb.from("api_usage_log").insert({
        provider: entry.provider,
        operation: entry.operation,
        model: entry.model ?? null,
        user_id: entry.userId ?? null,
        brand_id: entry.brandId ?? null,
        duration_ms: Math.max(0, Math.round(entry.durationMs ?? 0)),
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: entry.cached ? 0 : estimateCost(entry.provider, inputTokens, outputTokens),
        cached: entry.cached ?? false,
        status: entry.status ?? "ok",
        error: entry.error ? String(entry.error).slice(0, 2000) : null,
      });
    } catch {
      /* yoksay */
    }
  })();
}

export interface ErrorLogEntry {
  level?: "error" | "warn" | "info";
  source?: "server" | "client" | "job" | "api";
  message: string;
  stack?: string | null;
  path?: string | null;
  userId?: string | null;
  brandId?: string | null;
  context?: Record<string, unknown>;
}

function fingerprintOf(message: string, path?: string | null) {
  return `${(path ?? "").slice(0, 80)}|${message.replace(/[0-9a-f-]{16,}/gi, "*").slice(0, 160)}`;
}

export function recordError(entry: ErrorLogEntry): void {
  void (async () => {
    const sb = await admin();
    if (!sb) return;
    try {
      await sb.from("error_logs").insert({
        level: entry.level ?? "error",
        source: entry.source ?? "server",
        message: entry.message.slice(0, 2000),
        stack: entry.stack ? entry.stack.slice(0, 8000) : null,
        path: entry.path ?? null,
        user_id: entry.userId ?? null,
        brand_id: entry.brandId ?? null,
        context: (entry.context ?? {}) as never,
        fingerprint: fingerprintOf(entry.message, entry.path),
      });
    } catch {
      /* yoksay */
    }
  })();
}

export function recordEmailLog(entry: {
  toEmail: string;
  subject: string;
  templateKey?: string | null;
  status?: "sent" | "failed" | "suppressed";
  error?: string | null;
  userId?: string | null;
  payload?: Record<string, unknown>;
}): void {
  void (async () => {
    const sb = await admin();
    if (!sb) return;
    try {
      await sb.from("email_logs").insert({
        to_email: entry.toEmail,
        subject: entry.subject.slice(0, 300),
        template_key: entry.templateKey ?? null,
        status: entry.status ?? "sent",
        error: entry.error ? String(entry.error).slice(0, 2000) : null,
        user_id: entry.userId ?? null,
        payload: (entry.payload ?? {}) as never,
      });
    } catch {
      /* yoksay */
    }
  })();
}
