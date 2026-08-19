// AI Talep Kesfi (AI Prompt Demand) veri modeli.
// Her deger bir kaynak sinifina baglidir: olculen / tahmini / cikarim.

export type DataSource = "measured" | "estimated" | "inferred";

/**
 * Satir duzeyinde veri kaynagi iki alana ayrilir:
 * origin = veri nereden geldi, source = veri ne kadar islenmis.
 * Rozetler: gsc+measured -> "Olculdu (GSC)", onecite+measured -> "Olculdu (OneCite)",
 * gsc+modeled -> "GSC temelli tahmin", model+calibrated -> "Kalibre tahmin",
 * model+estimated -> "Ham tahmin".
 */
export type RowOrigin = "gsc" | "onecite" | "model";
export type RowSource = "measured" | "modeled" | "calibrated" | "estimated";

export type Intent =
  | "informational"
  | "commercial"
  | "commercial_investigation"
  | "transactional"
  | "comparison"
  | "navigational"
  | "brand";

export type PromptShape =
  | "keyword"
  | "question"
  | "recommendation"
  | "comparison"
  | "research"
  | "navigational";

export type Level = "high" | "medium" | "low";

export type CitationStatus = "cited" | "not_cited" | "competitor_cited";

export type DemandSignal = {
  directVolume: number;
  relatedVolume: number;
  autocompleteStrength: number;
  historicalTrend: number;
};

/** Search Console'dan eslesen gercek sorgu verisi. */
export type GscSignal = {
  query: string;
  impressions: number;
  clicks: number;
  position: number;
  matchScore: number;
  /** CTR egrisiyle gosterimden turetilen toplam talep — olculen degil, modellenmis. */
  modeledDemand: number;
  ctrUsed: number;
  method: "vector" | "jaccard";
  borderline: boolean;
};

/** Kume duzeyinde hangi gercek veri kaynaklarinin besledigi. */
export type SignalSources = {
  gscConnected: boolean;
  ga4Connected: boolean;
  gscMatchedPrompts: number;
  gscQueryCount: number;
  gscImpressions: number;
  ga4AiSessions: number;
  measuredPrompts: number;
  snapshotDate: string | null;
  /** Vektor eslestirme kullanildi mi, yoksa kelime ortusmesine mi dusuldu. */
  matchMethod: "vector" | "jaccard";
  gscAddedPrompts: number;
};

export type CalibrationInfo = {
  applied: boolean;
  ratio?: number;
  matchedSampleSize: number;
  note: string;
};

export type Ga4Signal = {
  hasEnoughData: boolean;
  referralSessions: number;
  platformMix?: Record<string, number>;
  /** Tiklanma tutarliligi — talep dogrulugu degil. */
  clickConsistency: "high" | "low" | "unknown";
  note: string;
};

export type DemandRange = { low: number; mid: number; high: number };

/** Saglayicilardan (arama, soru, semantik genisletme) gelen ham aday. */
export type PromptCandidate = {
  text: string;
  intent: Intent;
  shape: PromptShape;
  semanticConfidence: number;
  signal: DemandSignal;
  origin: RowOrigin;
  source: RowSource;
  citationStatus: CitationStatus;
  competitorPresence: Level;
  evidenceGapType: string;
  gsc?: GscSignal;
  /** Takibe alindi, ilk OneCite olcumu henuz gelmedi. */
  pendingMeasurement?: boolean;
};

export type DemandBreakdown = {
  baseDemand: number;
  aiUsageFactor: number;
  promptSuitability: number;
  semanticConfidence: number;
  overlapAdjustment: number;
  calibrationMultiplier: number;
  ctrMultiplier: number | null;
  finalDemand: number;
};

export type PromptDemandRow = PromptCandidate & {
  id: string;
  demand: number;
  uniqueDemand: number;
  confidence: Level;
  opportunityScore: number;
  opportunity: Level;
  recommendedAction: string;
  breakdown: DemandBreakdown;
};

export type PlatformDemand = { key: string; label: string; demand: number };

export type CompetitorRow = {
  name: string;
  share: number;
  demandCovered: number;
  promptsCited: number;
  topEvidenceType: string;
  source: DataSource;
};

export type EvidenceGapRow = {
  type: string;
  why: string;
  affectedDemand: number;
  affectedPrompts: number;
  impact: Level;
  action: string;
};

export type ActionRow = {
  verb: string;
  title: string;
  potentialDemand: number;
  affectedPrompts: number;
  opportunity: Level;
  reason: string;
};

export type ClusterAnalysis = {
  topic: string;
  canonicalCluster: string;
  country: string;
  language: string;
  demand: number;
  trend: number;
  confidence: Level;
  confidenceScore: number;
  confidenceReason: string;
  promptCount: number;
  commercialIntent: Level;
  citationShare: number;
  citationShareSource: DataSource;
  demandRange: DemandRange;
  calibration: CalibrationInfo;
  ga4Signal: Ga4Signal;
  leadingCompetitor: { name: string; share: number } | null;
  competitors: CompetitorRow[];
  opportunity: Level;
  opportunityScore: number;
  demandCovered: number;
  platformDemand: PlatformDemand[];
  prompts: PromptDemandRow[];
  evidenceGaps: EvidenceGapRow[];
  actions: ActionRow[];
  signalSources: SignalSources;
};