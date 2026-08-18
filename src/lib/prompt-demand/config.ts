// Tahmin motorunun tum katsayilari burada. Bilesenlere sabit sayi yazilmaz.
// UYARI: Asagidaki AI platform kullanim katsayilari temsili demo degerleridir;
// dogrulanmis pazar verisiyle degistirilmelidir.
import type { Intent, Level, PromptShape } from "./types";

export const AI_USAGE_FACTORS: Record<string, { label: string; factor: number }> = {
  chatgpt: { label: "ChatGPT", factor: 0.18 },
  gemini: { label: "Gemini", factor: 0.08 },
  perplexity: { label: "Perplexity", factor: 0.04 },
  copilot: { label: "Copilot", factor: 0.03 },
};

/** Toplam AI kullanim carpani: tum platformlarin toplami. */
export const TOTAL_AI_USAGE_FACTOR = Object.values(AI_USAGE_FACTORS).reduce((s, p) => s + p.factor, 0);

/** Bir arama niyetinin sohbet asistanina tasinma olasiligi. */
export const PROMPT_SUITABILITY: Record<PromptShape, number> = {
  keyword: 0.6,
  question: 0.9,
  recommendation: 1.0,
  comparison: 1.0,
  research: 0.95,
  navigational: 0.3,
};

/** Niyet degeri yalnizca Firsat skorunu etkiler, ham talebi sismez. */
export const INTENT_VALUES: Record<Intent, number> = {
  informational: 0.6,
  commercial: 0.9,
  commercial_investigation: 1.0,
  transactional: 1.0,
  comparison: 1.0,
  navigational: 0.4,
  brand: 0.5,
};

export const INTENT_LABELS: Record<Intent, string> = {
  informational: "Bilgi",
  commercial: "Ticari",
  commercial_investigation: "Ticari arastirma",
  transactional: "Satin alma",
  comparison: "Karsilastirma",
  navigational: "Yonlendirme",
  brand: "Marka",
};

/** Kume icindeki ortusen talebi dusuren benzerlik agirliklari. */
export const DEDUPLICATION = {
  semanticThreshold: 0.65,
  weights: [
    { minSimilarity: 0.9, contribution: 0.2 },
    { minSimilarity: 0.8, contribution: 0.35 },
    { minSimilarity: 0.7, contribution: 0.5 },
    { minSimilarity: 0, contribution: 0.85 },
  ],
};

export const CONFIDENCE_WEIGHTS = {
  directDataCoverage: 0.3,
  clusterCoherence: 0.25,
  signalAgreement: 0.2,
  historicalStability: 0.15,
  sampleSize: 0.1,
};

export const CONFIDENCE_THRESHOLDS: Array<{ min: number; level: Level }> = [
  { min: 0.75, level: "high" },
  { min: 0.45, level: "medium" },
  { min: 0, level: "low" },
];

export const CONFIDENCE_ADJUSTMENT: Record<Level, number> = {
  high: 1.0,
  medium: 0.85,
  low: 0.65,
};

export const OPPORTUNITY_WEIGHTS = {
  demand: 0.3,
  intent: 0.2,
  citationGap: 0.25,
  evidenceGap: 0.15,
  competitorPressure: 0.1,
};

export const OPPORTUNITY_THRESHOLDS: Array<{ min: number; level: Level }> = [
  { min: 75, level: "high" },
  { min: 45, level: "medium" },
  { min: 0, level: "low" },
];

export const COMPETITOR_PRESSURE: Record<Level, number> = { high: 1, medium: 0.6, low: 0.25 };

export const EVIDENCE_GAP_SEVERITY: Record<string, number> = {
  "Karsilastirma icerigi": 1,
  "Bagimsiz kanit": 0.9,
  "Urun tanimi": 0.7,
  "Veri ve arastirma": 0.7,
  "Vaka calismasi": 0.6,
  "Dokumantasyon": 0.5,
  "Yok": 0.2,
};

export const LEVEL_LABELS: Record<Level, string> = { high: "Yuksek", medium: "Orta", low: "Dusuk" };

export const SOURCE_LABELS = {
  measured: "Olculen",
  estimated: "Tahmini",
  inferred: "Cikarim",
} as const;

export const DEMAND_TOOLTIP =
  "AI Talebi; arama talebi, ilgili sorular, semantik prompt genisletmesi ve AI platform kullanim modellemesi ile bu konu etrafindaki aylik yanit talebini tahmin eder. ChatGPT veya diger AI saglayicilarina ait ozel kullanim verisini temsil etmez.";