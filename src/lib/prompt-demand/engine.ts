// AI Talep tahmin motoru: saf hesaplama katmani.
// Tum katsayilar config.ts icinde; burada yalnizca formuller vardir.
import {
  AI_USAGE_FACTORS,
  CALIBRATION_CLAMP,
  CALIBRATION_MIN_MATCHES,
  COMPETITOR_PRESSURE,
  CONFIDENCE_ADJUSTMENT,
  CONFIDENCE_THRESHOLDS,
  CONFIDENCE_WEIGHTS,
  CTR_CURVE,
  CTR_MAX_MULTIPLIER,
  DEDUPLICATION,
  DEMAND_BAND,
  EVIDENCE_GAP_SEVERITY,
  GA4_MIN_SESSIONS,
  INTENT_VALUES,
  OPPORTUNITY_THRESHOLDS,
  OPPORTUNITY_WEIGHTS,
  PROMPT_SUITABILITY,
  TOTAL_AI_USAGE_FACTOR,
} from "./config";
import type {
  ActionRow,
  CalibrationInfo,
  ClusterAnalysis,
  CompetitorRow,
  DemandRange,
  EvidenceGapRow,
  Ga4Signal,
  Level,
  PromptCandidate,
  PromptDemandRow,
  SignalSources,
} from "./types";

function level(score: number, table: Array<{ min: number; level: Level }>): Level {
  return table.find((row) => score >= row.min)?.level ?? "low";
}

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLocaleLowerCase("tr")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2),
  );
}

/** Iki prompt arasindaki kaba semantik yakinlik (Jaccard). */
export function similarity(a: string, b: string): number {
  const left = tokens(a);
  const right = tokens(b);
  if (!left.size || !right.size) return 0;
  let shared = 0;
  left.forEach((word) => { if (right.has(word)) shared += 1; });
  return shared / (left.size + right.size - shared);
}

/** ADIM 4: Ham arama talebi sinyalini tek sayiya indirger. */
export function baseDemand(candidate: PromptCandidate, calibrationMultiplier = 1): number {
  const { directVolume, relatedVolume, autocompleteStrength, historicalTrend } = candidate.signal;
  const base = directVolume > 0 ? directVolume : relatedVolume * 0.45;
  // Kalibrasyon yalnizca saf model tahminlerine uygulanir; gercek veriye dokunmaz.
  const multiplier = candidate.origin === "model" ? calibrationMultiplier : 1;
  return Math.max(0, base * (0.8 + autocompleteStrength * 0.4) * historicalTrend * multiplier);
}

/** ADIM 8: Prompt Talebi = Ham Talep x AI kullanimi x Uygunluk x Semantik guven. */
export function promptDemand(
  candidate: PromptCandidate,
  calibrationMultiplier = 1,
): { demand: number; base: number } {
  const base = baseDemand(candidate, calibrationMultiplier);
  const demand =
    base *
    TOTAL_AI_USAGE_FACTOR *
    PROMPT_SUITABILITY[candidate.shape] *
    candidate.semanticConfidence;
  return { demand, base };
}

/** Pozisyona karsilik beklenen tiklama orani (genel endustri egrisi). */
export function expectedCtr(position: number): number {
  const safe = Number.isFinite(position) && position > 0 ? position : 20;
  return CTR_CURVE.find((row) => safe <= row.maxPosition)?.ctr ?? 0.008;
}

/**
 * Gosterim -> toplam sorgu talebi. Sonuc OLCUM DEGIL: olculen gosterimin
 * modellenmis bir egriyle buyutulmus halidir.
 */
export function impressionsToDemand(
  impressions: number,
  position: number,
): { demand: number; ctr: number; multiplier: number } {
  const ctr = expectedCtr(position);
  const rawMultiplier = 1 / Math.max(ctr, 0.001);
  const multiplier = Math.min(rawMultiplier, CTR_MAX_MULTIPLIER);
  return { demand: Math.round(Math.max(0, impressions) * multiplier), ctr, multiplier };
}

/**
 * Kalibrasyon carpani: gercek/tahmin oranlarinin ortancasi.
 * En az CALIBRATION_MIN_MATCHES cift yoksa uygulanmaz.
 */
export function calibrationRatio(
  pairs: Array<{ actual: number; predicted: number }>,
): CalibrationInfo {
  const usable = pairs.filter((p) => p.actual > 0 && p.predicted > 0);
  if (usable.length < CALIBRATION_MIN_MATCHES) {
    return {
      applied: false,
      matchedSampleSize: usable.length,
      note: `Kalibrasyon için yeterli eşleşme yok (${usable.length}/${CALIBRATION_MIN_MATCHES}). Tahminler ham bırakıldı.`,
    };
  }
  const ratios = usable.map((p) => p.actual / p.predicted).sort((a, b) => a - b);
  const middle = Math.floor(ratios.length / 2);
  const median =
    ratios.length % 2 === 0 ? ((ratios[middle - 1] ?? 1) + (ratios[middle] ?? 1)) / 2 : (ratios[middle] ?? 1);
  const ratio = Math.min(CALIBRATION_CLAMP.max, Math.max(CALIBRATION_CLAMP.min, median));
  return {
    applied: true,
    ratio: Number(ratio.toFixed(2)),
    matchedSampleSize: usable.length,
    note: `Global düzeltme, niyet bazlı değil. ${usable.length} eşleşmiş çiftin ortanca oranı kullanıldı.`,
  };
}

/** Guven skorundan turetilen talep araligi; taban ve tavan ile kirpilir. */
export function demandRange(midDemand: number, confidenceScore: number): DemandRange {
  const mid = Math.max(0, Math.round(midDemand));
  const confidence = Math.min(1, Math.max(0, confidenceScore));
  const raw = DEMAND_BAND.baseWidthPercent * (1 - confidence);
  const width = Math.min(DEMAND_BAND.maxWidthPercent, Math.max(DEMAND_BAND.minWidthPercent, raw));
  return {
    low: Math.max(0, Math.round(mid * (1 - width))),
    mid,
    high: Math.round(mid * (1 + width)),
  };
}

/**
 * GA4 yapay zeka yonlendirmeleri: TIKLANMA tutarliligi sinyali.
 * Talep dogrulugunu olcmez; guven skorunu dusurmez.
 */
export function ga4ClickSignal(input: {
  connected: boolean;
  referralSessions: number;
  predictedDemand: number;
  platformMix?: Record<string, number>;
}): Ga4Signal {
  if (!input.connected) {
    return {
      hasEnoughData: false,
      referralSessions: 0,
      clickConsistency: "unknown",
      note: "GA4 bağlı değil; yapay zeka yönlendirme sinyali okunamıyor.",
    };
  }
  if (input.referralSessions < GA4_MIN_SESSIONS) {
    return {
      hasEnoughData: false,
      referralSessions: input.referralSessions,
      clickConsistency: "unknown",
      note: `Yapay zeka yönlendirmeli oturum sayısı yetersiz (${input.referralSessions}/${GA4_MIN_SESSIONS}); varsayılan platform katsayıları kullanıldı.`,
    };
  }
  const expected = Math.max(1, input.predictedDemand) * 0.01;
  const consistency: Ga4Signal["clickConsistency"] = input.referralSessions >= expected ? "high" : "low";
  return {
    hasEnoughData: true,
    referralSessions: input.referralSessions,
    ...(input.platformMix ? { platformMix: input.platformMix } : {}),
    clickConsistency: consistency,
    note: "Bu sinyal tıklanma tutarlılığını ölçer, talep tahmininin doğruluğunu değil. Kaynak gösterilse bile kullanıcı tıklamayabilir ve bazı AI platformları yönlendirme bilgisi göndermez.",
  };
}

function uniqueWeight(sim: number): number {
  return DEDUPLICATION.weights.find((w) => sim >= w.minSimilarity)?.contribution ?? 1;
}

/** ADIM 10: Kume guven skoru. */
export function clusterConfidence(candidates: PromptCandidate[]): { score: number; level: Level; reason: string } {
  if (!candidates.length) return { score: 0, level: "low", reason: "Yeterli sinyal yok." };
  const measured = candidates.filter((c) => c.source === "measured").length / candidates.length;
  const directCoverage = candidates.filter((c) => c.signal.directVolume > 0).length / candidates.length;
  const directDataCoverage = Math.min(1, measured * 0.5 + directCoverage * 0.5);
  const clusterCoherence =
    candidates.reduce((sum, c) => sum + c.semanticConfidence, 0) / candidates.length;
  const signalAgreement =
    candidates.reduce((sum, c) => sum + Math.min(1, c.signal.autocompleteStrength), 0) / candidates.length;
  const trends = candidates.map((c) => c.signal.historicalTrend);
  const mean = trends.reduce((s, t) => s + t, 0) / trends.length;
  const variance = trends.reduce((s, t) => s + (t - mean) ** 2, 0) / trends.length;
  const historicalStability = Math.max(0, 1 - Math.sqrt(variance));
  const sampleSize = Math.min(1, candidates.length / 30);

  const score =
    directDataCoverage * CONFIDENCE_WEIGHTS.directDataCoverage +
    clusterCoherence * CONFIDENCE_WEIGHTS.clusterCoherence +
    signalAgreement * CONFIDENCE_WEIGHTS.signalAgreement +
    historicalStability * CONFIDENCE_WEIGHTS.historicalStability +
    sampleSize * CONFIDENCE_WEIGHTS.sampleSize;

  const lvl = level(score, CONFIDENCE_THRESHOLDS);
  const reason =
    lvl === "high"
      ? "Küme içindeki promptların çoğu doğrudan talep sinyaline dayanıyor."
      : lvl === "medium"
        ? "Kümeyi tahmin etmeye yetecek veri var, ancak bazı prompt varyantları semantik çıkarıma dayanıyor."
        : "Sinyal sayısı düşük; sonuçlar büyük ölçüde semantik çıkarıma dayanıyor.";
  return { score, level: lvl, reason };
}

/** ADIM 12: Kaynak Gosterim Firsati skoru (0-100). */
export function opportunityScore(input: {
  normalizedDemand: number;
  intentValue: number;
  citationGap: number;
  evidenceGapSeverity: number;
  competitorPressure: number;
  confidence: Level;
}): number {
  const raw =
    input.normalizedDemand * OPPORTUNITY_WEIGHTS.demand +
    input.intentValue * OPPORTUNITY_WEIGHTS.intent +
    input.citationGap * OPPORTUNITY_WEIGHTS.citationGap +
    input.evidenceGapSeverity * OPPORTUNITY_WEIGHTS.evidenceGap +
    input.competitorPressure * OPPORTUNITY_WEIGHTS.competitorPressure;
  return Math.round(Math.max(0, Math.min(1, raw)) * 100 * CONFIDENCE_ADJUSTMENT[input.confidence]);
}

function recommendAction(row: {
  intent: PromptCandidate["intent"];
  citationStatus: PromptCandidate["citationStatus"];
  evidenceGapType: string;
  text: string;
}): string {
  if (row.citationStatus === "cited") return "Mevcut kaynak gösterimini koruyun; kanıtı güncel tutun.";
  if (row.intent === "comparison" || row.intent === "commercial_investigation") {
    return "Kategori karşılaştırma sayfası oluşturun ve farklılaşma kanıtını netleştirin.";
  }
  if (row.evidenceGapType === "Bağımsız kanıt") {
    return "Üçüncü taraf kaynaklarda bağımsız referans ve veri alıntısı oluşturun.";
  }
  if (row.intent === "informational") {
    return "Kategori tanımını ve varlık netliğini güçlendiren açıklayıcı içerik yayınlayın.";
  }
  if (row.intent === "transactional" || row.intent === "commercial") {
    return "Ürün/çözüm sayfasında fiyat, kapsam ve sonuç kanıtını görünür hale getirin.";
  }
  return "Bu soruyu doğrudan yanıtlayan kanıtlı bir içerik bölümü ekleyin.";
}

export type ClusterInput = {
  topic: string;
  canonicalCluster: string;
  country: string;
  language: string;
  candidates: PromptCandidate[];
  citationShare: number;
  citationShareSource: ClusterAnalysis["citationShareSource"];
  competitors: Array<{ name: string; share: number; promptsCited: number; topEvidenceType: string }>;
  signalSources: SignalSources;
  calibration?: CalibrationInfo;
  ga4Signal?: Ga4Signal;
  platformFactors?: Record<string, number>;
};

/** Tum adimlari birlestirir: prompt talebi, ortusme indirimi, guven, firsat, aksiyon. */
export function buildCluster(input: ClusterInput): ClusterAnalysis {
  const calibrationMultiplier = input.calibration?.applied ? (input.calibration.ratio ?? 1) : 1;
  const accepted = input.candidates.filter(
    (c) => c.semanticConfidence >= DEDUPLICATION.semanticThreshold,
  );
  const scored = accepted
    .map((candidate) => ({ candidate, ...promptDemand(candidate, calibrationMultiplier) }))
    .sort((a, b) => b.demand - a.demand);

  const confidence = clusterConfidence(accepted);
  const maxDemand = scored[0]?.demand ?? 0;

  // ADIM 9: semantik ortusme indirimi - talepler asla toplanmaz.
  const rows: PromptDemandRow[] = scored.map((item, index) => {
    const overlap =
      index === 0
        ? 1
        : uniqueWeight(
            Math.max(...scored.slice(0, index).map((prev) => similarity(prev.candidate.text, item.candidate.text))),
          );
    const normalizedDemand = maxDemand > 0 ? item.demand / maxDemand : 0;
    const citationGap =
      item.candidate.citationStatus === "cited" ? 0.15 : item.candidate.citationStatus === "competitor_cited" ? 1 : 0.8;
    const score = opportunityScore({
      normalizedDemand,
      intentValue: INTENT_VALUES[item.candidate.intent],
      citationGap,
      evidenceGapSeverity: EVIDENCE_GAP_SEVERITY[item.candidate.evidenceGapType] ?? 0.5,
      competitorPressure: COMPETITOR_PRESSURE[item.candidate.competitorPresence],
      confidence: confidence.level,
    });
    const promptConfidence: Level =
      item.candidate.source === "measured" || item.candidate.signal.directVolume > 0
        ? "high"
        : item.candidate.semanticConfidence >= 0.85
          ? "medium"
          : "low";

    return {
      ...item.candidate,
      id: `${index}-${item.candidate.text.slice(0, 40)}`,
      demand: Math.round(item.demand),
      uniqueDemand: Math.round(item.demand * overlap),
      confidence: promptConfidence,
      opportunityScore: score,
      opportunity: level(score, OPPORTUNITY_THRESHOLDS),
      recommendedAction: recommendAction(item.candidate),
      breakdown: {
        baseDemand: Math.round(item.base),
        aiUsageFactor: Number(TOTAL_AI_USAGE_FACTOR.toFixed(2)),
        promptSuitability: PROMPT_SUITABILITY[item.candidate.shape],
        semanticConfidence: Number(item.candidate.semanticConfidence.toFixed(2)),
        overlapAdjustment: Number(overlap.toFixed(2)),
        calibrationMultiplier: item.candidate.origin === "model" ? calibrationMultiplier : 1,
        ctrMultiplier: item.candidate.gsc ? Number((1 / Math.max(item.candidate.gsc.ctrUsed, 0.001)).toFixed(1)) : null,
        finalDemand: Math.round(item.demand * overlap),
      },
    };
  });

  const clusterDemand = Math.round(rows.reduce((sum, row) => sum + row.uniqueDemand, 0));
  const trend =
    accepted.length > 0
      ? Math.round(
          (accepted.reduce((s, c) => s + c.signal.historicalTrend, 0) / accepted.length - 1) * 100,
        )
      : 0;

  const intentAverage =
    accepted.length > 0
      ? accepted.reduce((s, c) => s + INTENT_VALUES[c.intent], 0) / accepted.length
      : 0;
  const commercialIntent: Level = intentAverage >= 0.85 ? "high" : intentAverage >= 0.65 ? "medium" : "low";

  const leader = [...input.competitors].sort((a, b) => b.share - a.share)[0] ?? null;
  const competitors: CompetitorRow[] = input.competitors
    .map((c) => ({
      name: c.name,
      share: c.share,
      demandCovered: Math.round(clusterDemand * c.share),
      promptsCited: c.promptsCited,
      topEvidenceType: c.topEvidenceType,
      source: "estimated" as const,
    }))
    .sort((a, b) => b.share - a.share);

  // Kanit bosluklari: prompt bazli boslulari tipe gore toplar.
  const gapMap = new Map<string, { demand: number; prompts: number }>();
  rows
    .filter((row) => row.citationStatus !== "cited" && row.evidenceGapType !== "Yok")
    .forEach((row) => {
      const current = gapMap.get(row.evidenceGapType) ?? { demand: 0, prompts: 0 };
      gapMap.set(row.evidenceGapType, {
        demand: current.demand + row.uniqueDemand,
        prompts: current.prompts + 1,
      });
    });
  const evidenceGaps: EvidenceGapRow[] = [...gapMap.entries()]
    .map(([type, value]) => {
      const severity = EVIDENCE_GAP_SEVERITY[type] ?? 0.5;
      const share = clusterDemand > 0 ? value.demand / clusterDemand : 0;
      const impactScore = severity * 0.6 + share * 0.4;
      return {
        type,
        why: gapReason(type),
        affectedDemand: Math.round(value.demand),
        affectedPrompts: value.prompts,
        impact: (impactScore >= 0.7 ? "high" : impactScore >= 0.4 ? "medium" : "low") as Level,
        action: gapAction(type),
      };
    })
    .sort((a, b) => b.affectedDemand - a.affectedDemand);

  const clusterOpportunityScore = rows.length
    ? Math.round(
        rows.reduce((sum, row) => sum + row.opportunityScore * row.uniqueDemand, 0) /
          Math.max(1, rows.reduce((sum, row) => sum + row.uniqueDemand, 0)),
      )
    : 0;

  // Platform dagilimi: GA4 karisimi yeterli veriyle geldiyse onu, aksi halde varsayilani kullan.
  const mix = input.platformFactors ?? null;
  const mixTotal = mix ? Object.values(mix).reduce((s, v) => s + v, 0) : 0;
  const platformDemand = Object.entries(AI_USAGE_FACTORS).map(([key, platform]) => ({
    key,
    label: platform.label,
    demand:
      mix && mixTotal > 0
        ? Math.round((clusterDemand * (mix[key] ?? 0)) / mixTotal)
        : Math.round((clusterDemand * platform.factor) / TOTAL_AI_USAGE_FACTOR),
  }));

  return {
    topic: input.topic,
    canonicalCluster: input.canonicalCluster,
    country: input.country,
    language: input.language,
    demand: clusterDemand,
    trend,
    confidence: confidence.level,
    confidenceScore: Number(confidence.score.toFixed(2)),
    confidenceReason: confidence.reason,
    promptCount: rows.length,
    commercialIntent,
    citationShare: input.citationShare,
    citationShareSource: input.citationShareSource,
    demandRange: demandRange(clusterDemand, confidence.score),
    calibration: input.calibration ?? {
      applied: false,
      matchedSampleSize: 0,
      note: "Kalibrasyon uygulanmadı.",
    },
    ga4Signal:
      input.ga4Signal ??
      ({
        hasEnoughData: false,
        referralSessions: 0,
        clickConsistency: "unknown",
        note: "GA4 sinyali yok.",
      } satisfies Ga4Signal),
    leadingCompetitor: leader ? { name: leader.name, share: leader.share } : null,
    competitors,
    opportunity: level(clusterOpportunityScore, OPPORTUNITY_THRESHOLDS),
    opportunityScore: clusterOpportunityScore,
    demandCovered: Math.round(clusterDemand * input.citationShare),
    platformDemand,
    prompts: rows,
    evidenceGaps,
    actions: buildActions(rows, evidenceGaps, input.canonicalCluster),
    signalSources: input.signalSources,
  };
}

function gapReason(type: string): string {
  switch (type) {
    case "Karşılaştırma içeriği":
      return "Rakiplerin kategori karşılaştırma sayfaları daha güçlü; AI yanıtları bu sayfaları kaynak gösteriyor.";
    case "Bağımsız kanıt":
      return "Rakipler üçüncü taraf kaynaklarda daha sık geçiyor.";
    case "Ürün tanımı":
      return "Kategori tanımınız site genelinde tutarlı biçimde pekiştirilmiyor.";
    case "Veri ve araştırma":
      return "Alıntılanabilir özgün veri ve araştırma içeriği eksik.";
    case "Vaka çalışması":
      return "Sonuç kanıtı içeren vaka içerikleri yetersiz.";
    default:
      return "Bu soru tipinde AI yanıtlarını besleyecek kanıt yeterli değil.";
  }
}

function gapAction(type: string): string {
  switch (type) {
    case "Karşılaştırma içeriği":
      return "Kategori karşılaştırma sayfası oluşturun.";
    case "Bağımsız kanıt":
      return "Üçüncü taraf referans ve basın kaynağı kazanın.";
    case "Ürün tanımı":
      return "Kategori tanımını ana sayfa ve ürün sayfalarında standartlaştırın.";
    case "Veri ve araştırma":
      return "Özgün ölçüm verisi yayınlayın.";
    case "Vaka çalışması":
      return "Ölçülebilir sonuç içeren vaka sayfası yayınlayın.";
    default:
      return "Kanıt içeriği üretin.";
  }
}

function buildActions(
  rows: PromptDemandRow[],
  gaps: EvidenceGapRow[],
  cluster: string,
): ActionRow[] {
  return gaps.slice(0, 4).map((gap) => {
    const related = rows.filter((row) => row.evidenceGapType === gap.type);
    const opportunity: Level = gap.impact;
    const verb = gap.type === "Ürün tanımı" ? "Geliştir" : gap.type === "Bağımsız kanıt" ? "Kazan" : "Oluştur";
    const title =
      gap.type === "Karşılaştırma içeriği"
        ? `${cluster} karşılaştırma rehberi`
        : gap.type === "Ürün tanımı"
          ? `${cluster} kategori tanımı sayfası`
          : gap.type === "Bağımsız kanıt"
            ? `${cluster} için bağımsız referanslar`
            : `${cluster} — ${gap.type}`;
    return {
      verb,
      title,
      potentialDemand: gap.affectedDemand,
      affectedPrompts: gap.affectedPrompts,
      opportunity,
      reason: `${gap.why} En yüksek fırsatlı soru: "${related[0]?.text ?? cluster}".`,
    };
  });
}