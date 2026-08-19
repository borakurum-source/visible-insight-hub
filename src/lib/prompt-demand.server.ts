// AI Talep Kesfi saglayici katmani: prompt genisletme + olculen kaynak gosterim verisi.
import type { SupabaseClient } from "@supabase/supabase-js";
import { similarity } from "./prompt-demand/engine";
import type { CitationStatus, Intent, Level, PromptCandidate, PromptShape } from "./prompt-demand/types";

const INTENTS: Intent[] = [
  "informational",
  "commercial",
  "commercial_investigation",
  "transactional",
  "comparison",
  "navigational",
  "brand",
];
const SHAPES: PromptShape[] = ["keyword", "question", "recommendation", "comparison", "research", "navigational"];

type RawPrompt = {
  text?: string;
  intent?: string;
  shape?: string;
  semanticConfidence?: number;
  monthlyVolume?: number;
  relatedVolume?: number;
  autocompleteStrength?: number;
  trend?: number;
  evidenceGapType?: string;
};

/**
 * Prompt genisletme saglayicisi.
 * Not: arama hacimleri su an dil modeli tarafindan modellenen tahminlerdir
 * (kaynak sinifi: estimated). Gercek anahtar kelime API'si baglandiginda
 * yalnizca bu fonksiyonun icerigi degisir.
 */
export async function expandPrompts(params: {
  topic: string;
  country: string;
  language: string;
  brandName: string;
  brandDomain: string;
  context: string;
}): Promise<{ canonicalCluster: string; candidates: PromptCandidate[] }> {
  const { aiJson } = await import("./ai.server");
  const result = await aiJson<{ canonicalCluster?: string; prompts?: RawPrompt[] }>(
    [
      {
        role: "system",
        content: [
          "Yapay zeka gorunurlugu icin talep kesfi analisti olarak calisiyorsun.",
          "Verilen konu icin gercek kullanicilarin AI asistanlarina soracagi 24-32 farkli prompt uret.",
          "Her prompt icin JSON alanlari: text, intent (informational|commercial|commercial_investigation|transactional|comparison|navigational|brand),",
          "shape (keyword|question|recommendation|comparison|research|navigational), semanticConfidence (0-1),",
          "monthlyVolume (ulke ve dil icin tahmini aylik arama hacmi), relatedVolume (ilgili sorular hacmi),",
          "autocompleteStrength (0-1), trend (0.7-1.4 yillik degisim carpani),",
          "evidenceGapType (Karsilastirma icerigi|Bagimsiz kanit|Urun tanimi|Veri ve arastirma|Vaka calismasi|Dokumantasyon|Yok).",
          "Yanit tam olarak su sekilde tek bir JSON nesnesi olsun:",
          '{"canonicalCluster": "kume adi", "prompts": [{"text": "...", "intent": "...", "shape": "...", "semanticConfidence": 0.8, "monthlyVolume": 100, "relatedVolume": 40, "autocompleteStrength": 0.5, "trend": 1.1, "evidenceGapType": "..."}]}',
          "En az 20 prompt uret. Hacimleri abartma; kucuk pazarlarda dusuk sayilar ver.",
        ].join(" "),
      },
      {
        role: "user",
        content: `Konu: ${params.topic}\nUlke: ${params.country}\nDil: ${params.language}\nMarka: ${params.brandName} (${params.brandDomain})\nMarka baglami: ${params.context}`,
      },
    ],
    { canonicalCluster: params.topic, prompts: [] },
    { maxTokens: 8000 },
  );

  const candidates = (result.prompts ?? [])
    .map((raw): PromptCandidate | null => {
      const text = String(raw.text ?? "").trim();
      if (text.length < 5) return null;
      const intent = (INTENTS as string[]).includes(String(raw.intent)) ? (raw.intent as Intent) : "informational";
      const shape = (SHAPES as string[]).includes(String(raw.shape)) ? (raw.shape as PromptShape) : "question";
      return {
        text,
        intent,
        shape,
        semanticConfidence: clamp(Number(raw.semanticConfidence) || 0.7, 0, 1),
        signal: {
          directVolume: Math.max(0, Number(raw.monthlyVolume) || 0),
          relatedVolume: Math.max(0, Number(raw.relatedVolume) || 0),
          autocompleteStrength: clamp(Number(raw.autocompleteStrength) || 0.5, 0, 1),
          historicalTrend: clamp(Number(raw.trend) || 1, 0.5, 1.6),
        },
        source: "estimated",
        citationStatus: "not_cited",
        competitorPresence: "medium",
        evidenceGapType: String(raw.evidenceGapType ?? "Yok"),
      };
    })
    .filter((row): row is PromptCandidate => row !== null);

  return { canonicalCluster: String(result.canonicalCluster ?? params.topic), candidates };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Olculen kaynak gosterim verisi: markanin gercek prompt olcumlerinden gelir.
 * Benzer prompt bulunursa kaynak sinifi "measured" olur; aksi halde tahmindir.
 */
export async function attachCitationData(
  supabase: SupabaseClient,
  brandId: string,
  candidates: PromptCandidate[],
): Promise<{
  candidates: PromptCandidate[];
  citationShare: number;
  citationShareSource: "measured" | "estimated";
  competitors: Array<{ name: string; share: number; promptsCited: number; topEvidenceType: string }>;
}> {
  const [{ data: prompts }, { data: runs }, { data: citations }] = await Promise.all([
    supabase.from("prompts").select("id, text").eq("brand_id", brandId).limit(300),
    supabase.from("prompt_runs").select("prompt_id, brand_mentioned").eq("brand_id", brandId).limit(1000),
    supabase.from("citations").select("domain, is_own_domain").eq("brand_id", brandId).limit(1000),
  ]);

  const runByPrompt = new Map<string, boolean>();
  (runs ?? []).forEach((run) => {
    const previous = runByPrompt.get(run.prompt_id as string) ?? false;
    runByPrompt.set(run.prompt_id as string, previous || Boolean(run.brand_mentioned));
  });

  const measuredPrompts = (prompts ?? [])
    .filter((prompt) => runByPrompt.has(prompt.id as string))
    .map((prompt) => ({ text: String(prompt.text), cited: runByPrompt.get(prompt.id as string) === true }));

  const totalRuns = measuredPrompts.length;
  const measuredShare = totalRuns > 0 ? measuredPrompts.filter((p) => p.cited).length / totalRuns : 0;

  const enriched = candidates.map((candidate) => {
    let best: { cited: boolean; score: number } | null = null;
    for (const prompt of measuredPrompts) {
      const score = similarity(prompt.text, candidate.text);
      if (!best || score > best.score) best = { cited: prompt.cited, score };
    }
    if (best && best.score >= 0.55) {
      const status: CitationStatus = best.cited ? "cited" : "competitor_cited";
      return { ...candidate, source: "measured" as const, citationStatus: status };
    }
    // Olculmemis promptlarda durum cikarimdir.
    const inferredStatus: CitationStatus = measuredShare > 0.6 ? "cited" : "not_cited";
    const presence: Level = measuredShare < 0.25 ? "high" : measuredShare < 0.6 ? "medium" : "low";
    return { ...candidate, citationStatus: inferredStatus, competitorPresence: presence };
  });

  const domainCounts = new Map<string, number>();
  (citations ?? [])
    .filter((row) => !row.is_own_domain && row.domain)
    .forEach((row) => {
      const domain = String(row.domain);
      domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
    });
  const totalCompetitorCitations = [...domainCounts.values()].reduce((s, n) => s + n, 0);
  const competitors = [...domainCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([domain, count]) => ({
      name: domain,
      share: totalCompetitorCitations > 0 ? Number((count / totalCompetitorCitations).toFixed(2)) : 0,
      promptsCited: count,
      topEvidenceType: "Bağımsız kanıt",
    }));

  return {
    candidates: enriched,
    citationShare: Number(measuredShare.toFixed(2)),
    citationShareSource: totalRuns > 0 ? "measured" : "estimated",
    competitors,
  };
}