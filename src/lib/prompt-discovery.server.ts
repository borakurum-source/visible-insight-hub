// Prompt Discovery server mantığı.
// Aday üret → skorla (mevcut talep hattını yeniden kullan) → DB'ye yaz.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { normalizePromptText } from "./prompt-normalize";
import type { PromptDemandRow } from "./prompt-demand/types";

type OneCiteClient = SupabaseClient<Database, "onecite">;

export type DiscoveryCandidate = {
  text: string;
  cluster: string;
  intent: string | null;
  shape: string | null;
  rationale: string;
  evidenceGapType: string;
};

/**
 * Aday üret: brand_intelligence + claims + site_health + mevcut promptlar → LLM
 *
 * Sistem talimatı: marka adı geçmeyen adaylar zorunlu, talep/hacim tahmini yasak.
 */
export async function generateCandidates(
  supabase: OneCiteClient,
  brandId: string,
): Promise<DiscoveryCandidate[]> {
  const { aiJson } = await import("./ai.server");
  const { resolveSystemPrompt } = await import("./system-prompts.server");

  // Beslenecek veriler: marka zekası + claims + site health başlıkları + mevcut promptlar
  const [{ data: brand }, { data: intel }, { data: claims }, { data: pages }, { data: prompts }] =
    await Promise.all([
      supabase.from("brands" as never).select("name, domain" as never).eq("id", brandId).single(),
      supabase
        .from("brand_intelligence" as never)
        .select("summary, products, audiences, competitors, expertise, voice, experience" as never)
        .eq("brand_id" as never, brandId)
        .maybeSingle(),
      supabase
        .from("claims" as never)
        .select("claim_text")
        .eq("brand_id" as never, brandId)
        .limit(20),
      supabase
        .from("site_health_pages" as never)
        .select("url")
        .eq("brand_id" as never, brandId)
        .limit(10),
      supabase
        .from("prompts" as never)
        .select("text" as never)
        .eq("brand_id" as never, brandId)
        .limit(100),
    ]);

  if (!brand) throw new Error("Marka bulunamadı");

  const systemPrompt = await resolveSystemPrompt(supabase, "prompt_discovery");
  const existingTexts = (prompts ?? []).map((p) => String(p.text)).join(" | ");
  const claimsText = (claims ?? [])
    .map((c) => `- ${c.claim_text}`)
    .join("\n");
  const pagesText = (pages ?? [])
    .map((p) => String(p.url))
    .join(", ");

  const result = await aiJson<{
    candidates?: Array<{
      text?: string;
      cluster?: string;
      intent?: string;
      shape?: string;
      rationale?: string;
      evidenceGapType?: string;
    }>;
  }>(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          `Marka: ${brand.name} (${brand.domain})`,
          `Özet: ${intel?.summary ?? ""}`,
          `Ürünler: ${JSON.stringify(intel?.products ?? [])}`,
          `Kitle: ${JSON.stringify(intel?.audiences ?? [])}`,
          `Rakipler: ${JSON.stringify(intel?.competitors ?? [])}`,
          `E-E-A-T: Uzmanlık=${intel?.expertise ?? ""}, Ses=${intel?.voice ?? ""}, Deneyim=${intel?.experience ?? ""}`,
          `Onaylı gerçekler:\n${claimsText || "(yok)"}`,
          `Site sayfaları: ${pagesText || "(taranmadı)"}`,
          `Mevcut adaylar (tekrar etme): ${existingTexts || "(yok)"}`,
          `Çıktı: JSON array, her nesne text/cluster/intent/shape/rationale/evidenceGapType içersin.`,
        ].join("\n"),
      },
    ],
    { candidates: [] },
    { role: "structured_strong", maxTokens: 6000 },
  );

  return (result.candidates ?? [])
    .map((raw) => ({
      text: String(raw.text ?? "").trim(),
      cluster: String(raw.cluster ?? "genel").trim(),
      intent: raw.intent ? String(raw.intent).trim() : null,
      shape: raw.shape ? String(raw.shape).trim() : null,
      rationale: String(raw.rationale ?? "").trim(),
      evidenceGapType: String(raw.evidenceGapType ?? "Yok").trim(),
    }))
    .filter((c) => c.text.length > 4 && c.text.length < 200);
}

/**
 * Adayları skorla: mevcut talep hattını yeniden kullan (attachCitationData → attachSearchSignals → buildCluster).
 *
 * Sonuç: prompt-demand'in PromptDemandRow[], talep + kaynak + güven + kanıt boşluğu + aksiyon.
 */
export async function scoreCandidates(
  supabase: OneCiteClient,
  brandId: string,
  candidates: DiscoveryCandidate[],
): Promise<
  Array<{
    text: string;
    cluster: string;
    intent: string | null;
    shape: string | null;
    rationale: string;
    evidenceGapType: string;
    observedDemand: number | null;
    demandSource: string;
    demandOrigin: string;
    confidence: string;
    recommendedAction: string;
  }>
> {
  const { attachCitationData, attachSearchSignals } = await import("./prompt-demand.server");
  const { buildCluster } = await import("./prompt-demand/engine");

  // Mevcut talep hattını çalıştır: adayları PromptDemandRow[]'a çevir
  const candidates_ = candidates.map((c) => ({
    text: c.text,
    intent: (c.intent as any) || "informational",
    shape: (c.shape as any) || "question",
    semanticConfidence: 0.8,
    signal: { directVolume: 0, relatedVolume: 0, autocompleteStrength: 0.5, historicalTrend: 1 },
    origin: "model" as const,
    source: "estimated" as const,
    citationStatus: "not_cited" as const,
    competitorPresence: "medium" as const,
    evidenceGapType: c.evidenceGapType,
  }));

  const enriched = await attachCitationData(supabase, brandId, candidates_);
  const withSearch = await attachSearchSignals(
    supabase,
    brandId,
    enriched.candidates,
    0,
    "tr",
  );

  const analysis = buildCluster({
    topic: "Marka geneli keşif",
    canonicalCluster: "Keşif",
    country: "TR",
    language: "tr",
    candidates: withSearch.candidates,
    citationShare: enriched.citationShare,
    citationShareSource: enriched.citationShareSource,
    competitors: enriched.competitors,
    signalSources: withSearch.signalSources,
    calibration: withSearch.calibration,
    ga4Signal: withSearch.ga4Signal,
  });

  // analysis.prompts (PromptDemandRow[]) döner; adaylar ile join
  const result = candidates.map((candidate) => {
    const demandRow = analysis.prompts.find(
      (r) => normalizePromptText(r.text) === normalizePromptText(candidate.text),
    );
    return {
      text: candidate.text,
      cluster: candidate.cluster,
      intent: candidate.intent,
      shape: candidate.shape,
      rationale: candidate.rationale,
      evidenceGapType: candidate.evidenceGapType,
      observedDemand: demandRow?.demand ?? null,
      demandSource: demandRow?.source ?? "estimated",
      demandOrigin: demandRow?.origin ?? "model",
      confidence: demandRow?.confidence ?? "low",
      recommendedAction: demandRow?.recommendedAction ?? "",
    };
  });

  return result;
}

/**
 * Adayı ölçün: mevcut measurePrompt() N tekrar (varsayılan 2).
 *
 * Döner: ölçüm sonuçları + panel (gözlemler).
 */
export async function measureCandidate(input: {
  brandName: string;
  brandDomain: string;
  competitors: string[];
  promptText: string;
  repeatCount?: number;
  model?: string;
}): Promise<{
  panel: Array<{ model: string | null; brandMentioned: boolean; position: number | null }>;
  ownDomainCited: boolean;
  brandMentioned: boolean;
  visibility: number | null;
}> {
  const { measurePrompt } = await import("./measurement.server");

  const repeatCount = input.repeatCount ?? 2;
  const observations: Array<{ model: string | null; brandMentioned: boolean; position: number | null }> = [];
  let cumulativeBrandMentioned = false;
  let cumulativeOwnDomain = false;

  for (let i = 0; i < repeatCount; i++) {
    try {
      const measured = await measurePrompt({
        brandName: input.brandName,
        brandDomain: input.brandDomain,
        competitors: input.competitors,
        promptText: input.promptText,
        model: input.model,
      });

      observations.push({
        model: measured.model,
        brandMentioned: measured.brandMentioned,
        position: measured.position,
      });

      cumulativeBrandMentioned ||= measured.brandMentioned;
      // "Kendi domain'den kaynak" → sources içinde domain'i bul
      cumulativeOwnDomain ||= measured.sources.some((s) =>
        s.domain
          .toLowerCase()
          .includes(input.brandDomain.split(".")[0]?.toLowerCase() ?? ""),
      );
    } catch (err) {
      console.error(`Measurement repeat ${i + 1}/${repeatCount} failed`, err);
    }
  }

  // Panel görünürlüğü (ragsignalgeo'daki `panelVisibility`'nin muadili)
  const { panelVisibility } = await import("./prompt-opportunity");
  const visibility = panelVisibility(
    observations.map((o) => ({
      model: o.model ?? "unknown",
      measured: true,
      ownDomainCited: cumulativeOwnDomain,
      brandMentioned: o.brandMentioned ?? false,
      position: o.position ?? null,
    })),
  );

  return {
    panel: observations,
    ownDomainCited: cumulativeOwnDomain,
    brandMentioned: cumulativeBrandMentioned,
    visibility,
  };
}
