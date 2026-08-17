import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AnalysisResult, CitationCheck, ReportFinding } from "./public-report.server";

export type PublicReport = AnalysisResult & { token: string; createdAt: string };

const startSchema = z.object({
  domain: z.string().min(3).max(255),
  email: z.string().email().max(200).optional(),
});

function randomToken() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Verilen alan adını canlı olarak tarar, sonucu kaydeder ve paylaşım anahtarını döner. */
export const startPublicReport = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => startSchema.parse(input))
  .handler(async ({ data }) => {
    const { analyzeDomain, normalizeDomain, isValidDomain } = await import("./public-report.server");
    const domain = normalizeDomain(data.domain);
    if (!isValidDomain(domain)) throw new Error("Geçerli bir alan adı girin (örnek: ornek.com).");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Ayni alan adi icin son 6 saatteki taramayi yeniden kullan (kotu niyetli tekrarlari onler).
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await supabaseAdmin
      .from("public_reports")
      .select("token")
      .eq("domain", domain)
      .gte("created_at", sixHoursAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent?.token) {
      if (data.email) {
        await supabaseAdmin.from("public_reports").update({ email: data.email }).eq("token", recent.token);
      }
      return { token: recent.token as string, domain };
    }

    const analysis = await analyzeDomain(domain);
    const token = randomToken();
    const { error } = await supabaseAdmin.from("public_reports").insert({
      token,
      domain: analysis.domain,
      email: data.email ?? null,
      score: analysis.score,
      category_scores: analysis.categoryScores,
      findings: analysis.findings,
      citation: analysis.citation,
    });
    if (error) throw new Error(`Rapor kaydedilemedi: ${error.message}`);
    return { token, domain: analysis.domain };
  });

/** Paylaşım anahtarıyla kayıtlı raporu getirir. */
export const getPublicReport = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ token: z.string().min(8).max(64) }).parse(input))
  .handler(async ({ data }): Promise<PublicReport | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("public_reports")
      .select("token, domain, score, category_scores, findings, citation, created_at")
      .eq("token", data.token)
      .maybeSingle();
    if (!row) return null;
    return {
      token: row.token as string,
      domain: row.domain as string,
      score: Number(row.score ?? 0),
      categoryScores: (row.category_scores ?? {}) as Record<string, number>,
      findings: (row.findings ?? []) as ReportFinding[],
      citation: (row.citation ?? { checked: false, cited: false, question: "", citedDomains: [] }) as CitationCheck,
      createdAt: String(row.created_at),
    };
  });