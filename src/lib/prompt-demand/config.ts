// Tahmin motorunun tum katsayilari burada. Bilesenlere sabit sayi yazilmaz.
// UYARI: Asagidaki AI platform kullanim katsayilari temsili demo degerleridir;
// dogrulanmis pazar verisiyle degistirilmelidir.
import type { Intent, Level, PromptShape, RowOrigin, RowSource } from "./types";

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
  commercial_investigation: "Ticari araştırma",
  transactional: "Satın alma",
  comparison: "Karşılaştırma",
  navigational: "Yönlendirme",
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

/**
 * Kosinus olceginde ortusme indirimi kademeleri.
 * Vektor eslestirme aktifken bu tablo kullanilir; Jaccard yedekte
 * DEDUPLICATION.weights gecerli kalir.
 */
export const DEDUPLICATION_COSINE = {
  weights: [
    { minSimilarity: 0.93, contribution: 0.2 },
    { minSimilarity: 0.86, contribution: 0.35 },
    { minSimilarity: 0.78, contribution: 0.5 },
    { minSimilarity: 0, contribution: 0.85 },
  ],
};

/**
 * Eslestirme esikleri. 0.72 / 0.80 baslangic degeridir; elle etiketli
 * fikstur (src/lib/prompt-demand/__fixtures__/match-pairs.ts) uzerinde
 * olculup ayarlanmalidir. Dil bazli override eklenebilir.
 */
export const MATCHING = {
  gscMatch: 0.72,
  measuredPromptMatch: 0.8,
  /** Esige bu kadar yakin kabuller log'a "borderline" olarak yazilir. */
  borderlineMargin: 0.02,
  /** Kosinus oncesi kaba on filtre: prompt basina en fazla bu kadar aday. */
  prefilterCandidates: 25,
  /** On filtrede minimum kaba yakinlik (token/ngram). */
  prefilterMinScore: 0.08,
  /** Jaccard yedegi devreye girdiginde kullanilan esikler. */
  jaccardFallback: { gscMatch: 0.4, measuredPromptMatch: 0.55 },
  /** Dile gore esik override alani (ornek: { en: { gscMatch: 0.74 } }). */
  languageOverrides: {} as Record<string, Partial<{ gscMatch: number; measuredPromptMatch: number }>>,
};

/**
 * Pozisyon -> beklenen tiklama orani.
 * NOT: Genel endustri ortalamasi egrisidir, sektore ozel degildir.
 * Gosterimi toplam talebe cevirmek icin kullanilir; sonuc OLCUM DEGIL,
 * olculen gosterim uzerine modellenmis bir tahmindir.
 */
export const CTR_CURVE: Array<{ maxPosition: number; ctr: number }> = [
  { maxPosition: 1, ctr: 0.27 },
  { maxPosition: 2, ctr: 0.15 },
  { maxPosition: 3, ctr: 0.11 },
  { maxPosition: 4, ctr: 0.08 },
  { maxPosition: 5, ctr: 0.06 },
  { maxPosition: 7, ctr: 0.04 },
  { maxPosition: 10, ctr: 0.025 },
  { maxPosition: 20, ctr: 0.012 },
  { maxPosition: Infinity, ctr: 0.008 },
];

export const CTR_CURVE_NOTE =
  "Genel endüstri ortalaması tıklama eğrisi kullanılır; sektöre özel değildir. Bu yüzden eğriyle büyütülen sayı ölçüm değil, gerçek veriye dayalı tahmindir.";

/** Gosterimden toplam talep turetirken uygulanan ust sinir carpani. */
export const CTR_MAX_MULTIPLIER = 12;

/** Aralik bandi: yariGenislik = mid x BASE x (1 - guven), taban/tavan ile kirpilir. */
export const DEMAND_BAND = {
  baseWidthPercent: 0.6,
  minWidthPercent: 0.12,
  maxWidthPercent: 0.55,
};

/** Kalibrasyon icin gereken minimum eslesmis cift sayisi. */
export const CALIBRATION_MIN_MATCHES = 5;
/** Kalibrasyon carpaninin makul araligi. */
export const CALIBRATION_CLAMP = { min: 0.25, max: 4 };

/** GA4 platform karisimina ve tiklanma sinyaline guvenmek icin minimum oturum. */
export const GA4_MIN_SESSIONS = 30;

export const ROW_SOURCE_LABELS: Record<string, string> = {
  "gsc:measured": "Ölçüldü (GSC)",
  "gsc:modeled": "GSC temelli tahmin",
  "onecite:measured": "Ölçüldü (OneCite)",
  "model:calibrated": "Kalibre tahmin",
  "model:estimated": "Ham tahmin",
};

export function rowSourceLabel(origin: RowOrigin, source: RowSource): string {
  return ROW_SOURCE_LABELS[`${origin}:${source}`] ?? "Ham tahmin";
}

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
  "Karşılaştırma içeriği": 1,
  "Bağımsız kanıt": 0.9,
  "Ürün tanımı": 0.7,
  "Veri ve araştırma": 0.7,
  "Vaka çalışması": 0.6,
  "Dokümantasyon": 0.5,
  "Yok": 0.2,
};

export const EVIDENCE_GAP_TYPES = Object.keys(EVIDENCE_GAP_SEVERITY).filter((k) => k !== "Yok");

export const LEVEL_LABELS: Record<Level, string> = { high: "Yüksek", medium: "Orta", low: "Düşük" };

export const SOURCE_LABELS = {
  measured: "Ölçülen",
  estimated: "Tahmini",
  inferred: "Çıkarım",
} as const;

export const DEMAND_TOOLTIP =
  "AI Talebi; arama talebi, ilgili sorular, semantik prompt genişletmesi ve AI platform kullanım modellemesi ile bu konu etrafındaki aylık yanıt talebini tahmin eder. ChatGPT veya diğer AI sağlayıcılarına ait özel kullanım verisini temsil etmez.";