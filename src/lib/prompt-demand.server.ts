// AI Talep Kesfi saglayici katmani: prompt genisletme + olculen kaynak gosterim verisi.
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  calibrationRatio,
  ga4ClickSignal,
  impressionsToDemand,
  promptDemand,
  similarity,
} from "./prompt-demand/engine";
import { GA4_MIN_SESSIONS, MATCHING } from "./prompt-demand/config";
import type { CitationStatus, Intent, Level, PromptCandidate, PromptShape } from "./prompt-demand/types";
import type { CalibrationInfo, Ga4Signal, SignalSources } from "./prompt-demand/types";

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
          "Yapay zeka görünürlüğü için talep keşfi analisti olarak çalışıyorsun.",
          "Verilen konu için gerçek kullanıcıların AI asistanlarına soracağı 24-32 farklı prompt üret.",
          "Tüm metinleri hedef dilde, eksiksiz Türkçe karakterlerle (ç, ğ, ı, İ, ö, ş, ü) yaz; ASCII sadeleştirme yapma.",
          "Her prompt için JSON alanları: text, intent (informational|commercial|commercial_investigation|transactional|comparison|navigational|brand),",
          "shape (keyword|question|recommendation|comparison|research|navigational), semanticConfidence (0-1),",
          "monthlyVolume (ülke ve dil için tahmini aylık arama hacmi), relatedVolume (ilgili sorular hacmi),",
          "autocompleteStrength (0-1), trend (0.7-1.4 yıllık değişim çarpanı),",
          "evidenceGapType yalnızca şu değerlerden biri olsun (aynen bu yazımla):",
          "Karşılaştırma içeriği | Bağımsız kanıt | Ürün tanımı | Veri ve araştırma | Vaka çalışması | Dokümantasyon | Yok.",
          "Yanıt tam olarak şu şekilde tek bir JSON nesnesi olsun:",
          '{"canonicalCluster": "küme adı", "prompts": [{"text": "...", "intent": "...", "shape": "...", "semanticConfidence": 0.8, "monthlyVolume": 100, "relatedVolume": 40, "autocompleteStrength": 0.5, "trend": 1.1, "evidenceGapType": "..."}]}',
          "En az 20 prompt üret. Hacimleri abartma; küçük pazarlarda düşük sayılar ver.",
        ].join(" "),
      },
      {
        role: "user",
        content: `Konu: ${params.topic}\nÜlke: ${params.country}\nDil: ${params.language}\nMarka: ${params.brandName} (${params.brandDomain})\nMarka bağlamı: ${params.context}`,
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
        origin: "model",
        source: "estimated",
        citationStatus: "not_cited",
        competitorPresence: "medium",
        evidenceGapType: normalizeGapType(raw.evidenceGapType),
      };
    })
    .filter((row): row is PromptCandidate => row !== null);

  return { canonicalCluster: String(result.canonicalCluster ?? params.topic), candidates };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Model ASCII yazsa bile kanit boslugu tipini kanonik Turkce yazimina eslestirir. */
function normalizeGapType(value: unknown): string {
  const canonical = ["Karşılaştırma içeriği", "Bağımsız kanıt", "Ürün tanımı", "Veri ve araştırma", "Vaka çalışması", "Dokümantasyon", "Yok"];
  const input = fold(String(value ?? ""));
  return canonical.find((item) => fold(item) === input) ?? "Yok";
}

function fold(value: string): string {
  return value
    .toLocaleLowerCase("tr")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/[ıî]/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/[üû]/g, "u")
    .replace(/â/g, "a")
    .trim();
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

  // Takibe alinmis ama henuz olcumu gelmemis promptlar: "ilk olcum bekleniyor" durumu.
  const pendingPrompts = (prompts ?? [])
    .filter((prompt) => !runByPrompt.has(prompt.id as string))
    .map((prompt) => String(prompt.text));

  const totalRuns = measuredPrompts.length;
  const measuredShare = totalRuns > 0 ? measuredPrompts.filter((p) => p.cited).length / totalRuns : 0;

  const { bestMatch, embedAll, thresholdsFor } = await import("./prompt-demand/matching.server");
  const thresholds = thresholdsFor();
  const measuredTexts = measuredPrompts.map((p) => p.text);
  const vectors =
    measuredTexts.length > 0
      ? await embedAll([...candidates.map((c) => c.text), ...measuredTexts, ...pendingPrompts])
      : null;

  const enriched = candidates.map((candidate) => {
    const best = measuredTexts.length
      ? bestMatch(candidate.text, measuredTexts, vectors, thresholds.measuredPromptMatch, 0.55)
      : null;
    if (best) {
      const cited = measuredPrompts[best.index]?.cited === true;
      const status: CitationStatus = cited ? "cited" : "competitor_cited";
      return { ...candidate, origin: "onecite" as const, source: "measured" as const, citationStatus: status };
    }
    const pending =
      pendingPrompts.length > 0 &&
      bestMatch(candidate.text, pendingPrompts, vectors, thresholds.measuredPromptMatch, 0.55) !== null;
    // Olculmemis promptlarda durum cikarimdir.
    const inferredStatus: CitationStatus = measuredShare > 0.6 ? "cited" : "not_cited";
    const presence: Level = measuredShare < 0.25 ? "high" : measuredShare < 0.6 ? "medium" : "low";
    return {
      ...candidate,
      citationStatus: inferredStatus,
      competitorPresence: presence,
      ...(pending ? { pendingMeasurement: true } : {}),
    };
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

type GscSnapshot = {
  queries?: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
};
type Ga4Snapshot = { ai?: { sessions?: number; platforms?: Record<string, number> } };

/**
 * ADIM 3.5: Search Console sorgu verisini adaylara baglar.
 * Eslesen promptlarda hacim artik tahmin degil olculen veridir (impressions/30 gun).
 * GA4 yapay zeka referans oturumlari kume duzeyinde dogrulama sinyali olarak tasinir.
 */
export async function attachSearchSignals(
  supabase: SupabaseClient,
  brandId: string,
  candidates: PromptCandidate[],
  measuredPrompts: number,
  language?: string,
): Promise<{
  candidates: PromptCandidate[];
  signalSources: SignalSources;
  calibration: CalibrationInfo;
  ga4Signal: Ga4Signal;
}> {
  const { data: snapshots } = await supabase
    .from("analytics_snapshots")
    .select("provider, snapshot_date, payload")
    .eq("brand_id", brandId)
    .in("provider", ["gsc", "ga4"])
    .order("snapshot_date", { ascending: false })
    .limit(20);

  const gscRow = (snapshots ?? []).find((row) => row.provider === "gsc");
  const ga4Row = (snapshots ?? []).find((row) => row.provider === "ga4");
  const gscQueries = ((gscRow?.payload as GscSnapshot | null)?.queries ?? []).filter((q) => q.query);
  const ga4AiSessions = Number((ga4Row?.payload as Ga4Snapshot | null)?.ai?.sessions ?? 0);

  const { bestMatch, embedAll, thresholdsFor } = await import("./prompt-demand/matching.server");
  const thresholds = thresholdsFor(language);
  const queryTexts = gscQueries.map((row) => row.query);
  const vectors = queryTexts.length
    ? await embedAll([...candidates.map((c) => c.text), ...queryTexts])
    : null;
  const matchMethod: "vector" | "jaccard" = vectors && vectors.size > 0 ? "vector" : "jaccard";

  let matched = 0;
  const usedQueryIndexes = new Set<number>();
  const calibrationPairs: Array<{ actual: number; predicted: number }> = [];

  const enriched: PromptCandidate[] = candidates.map((candidate) => {
    const best = queryTexts.length
      ? bestMatch(
          candidate.text,
          queryTexts,
          vectors,
          thresholds.gscMatch,
          MATCHING.jaccardFallback.gscMatch,
        )
      : null;
    if (!best) return candidate;
    const row = gscQueries[best.index];
    if (!row) return candidate;
    matched += 1;
    usedQueryIndexes.add(best.index);

    const position = Number(row.position ?? 0);
    const impressions = Math.round(row.impressions ?? 0);
    // Gosterim -> toplam talep: CTR egrisi ile modellenir. Bu bir OLCUM DEGIL,
    // olculen gosterim uzerine kurulmus tahmindir; bu yuzden source "modeled".
    const modeled = impressionsToDemand(impressions, position);
    // Kalibrasyon icin model tahmini ile gercek gosterim karsilastirilir.
    calibrationPairs.push({ actual: impressions, predicted: Math.max(1, candidate.signal.directVolume) });

    return {
      ...candidate,
      origin: "gsc" as const,
      source: "modeled" as const,
      semanticConfidence: Math.max(candidate.semanticConfidence, 0.9),
      signal: {
        ...candidate.signal,
        // GSC verisi model tahminini EZER; tahmin yalnizca taban gorevi gorur.
        directVolume: modeled.demand,
        autocompleteStrength: Math.max(candidate.signal.autocompleteStrength, Math.min(1, best.score + 0.2)),
      },
      gsc: {
        query: row.query,
        impressions,
        clicks: Math.round(row.clicks ?? 0),
        position,
        matchScore: Number(best.score.toFixed(3)),
        modeledDemand: modeled.demand,
        ctrUsed: modeled.ctr,
        method: best.method,
        borderline: best.borderline,
      },
    };
  });

  // Hicbir adayla eslesmeyen yuksek gosterimli GSC sorgulari gercek taleptir;
  // model onlari uretmediyse eksik kalirlar. En guclu olanlari kumeye ekleriz.
  const unmatched = gscQueries
    .map((row, index) => ({ row, index }))
    .filter(({ index }) => !usedQueryIndexes.has(index))
    .filter(({ row }) => (row.impressions ?? 0) >= GSC_ADD_MIN_IMPRESSIONS)
    .sort((a, b) => (b.row.impressions ?? 0) - (a.row.impressions ?? 0))
    .slice(0, GSC_ADD_LIMIT);

  unmatched.forEach(({ row }) => {
    const position = Number(row.position ?? 0);
    const impressions = Math.round(row.impressions ?? 0);
    const modeled = impressionsToDemand(impressions, position);
    enriched.push({
      text: row.query,
      intent: "informational",
      shape: "keyword",
      semanticConfidence: 0.95,
      signal: {
        directVolume: modeled.demand,
        relatedVolume: 0,
        autocompleteStrength: 0.6,
        historicalTrend: 1,
      },
      origin: "gsc",
      source: "modeled",
      citationStatus: "not_cited",
      competitorPresence: "medium",
      evidenceGapType: "Yok",
      gsc: {
        query: row.query,
        impressions,
        clicks: Math.round(row.clicks ?? 0),
        position,
        matchScore: 1,
        modeledDemand: modeled.demand,
        ctrUsed: modeled.ctr,
        method: matchMethod,
        borderline: false,
      },
    });
  });

  const calibration = calibrationRatio(calibrationPairs);
  const ga4Platforms = (ga4Row?.payload as Ga4Snapshot | null)?.ai?.platforms;
  const predictedTotal = enriched.reduce((sum, row) => sum + promptDemand(row).demand, 0);
  const ga4Signal = ga4ClickSignal({
    connected: Boolean(ga4Row),
    referralSessions: ga4AiSessions,
    predictedDemand: predictedTotal,
    ...(ga4Platforms && ga4AiSessions >= GA4_MIN_SESSIONS ? { platformMix: ga4Platforms } : {}),
  });

  return {
    candidates: enriched,
    calibration,
    ga4Signal,
    signalSources: {
      gscConnected: Boolean(gscRow),
      ga4Connected: Boolean(ga4Row),
      gscMatchedPrompts: matched,
      gscQueryCount: gscQueries.length,
      gscImpressions: gscQueries.reduce((sum, q) => sum + (q.impressions ?? 0), 0),
      ga4AiSessions,
      measuredPrompts,
      matchMethod,
      gscAddedPrompts: unmatched.length,
      snapshotDate: (gscRow?.snapshot_date as string | undefined) ?? (ga4Row?.snapshot_date as string | undefined) ?? null,
    },
  };
}