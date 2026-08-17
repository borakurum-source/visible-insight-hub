// Mock data for the dashboard (Komuta Merkezi). Mirrors the shapes the real
// /api/overview, /api/overview/trend and /api/prompts endpoints will return.
export interface Overview {
  totalPrompts: number;
  promptsWithRuns: number;
  totalRuns: number;
  mentionRate: number;
  citedRate: number;
  visibilityScore: number | null;
  visibilityLabel: string;
  visibilityBand: "kritik" | "zayıf" | "gelisiyor" | "güçlü";
  lastRunAt: string;
  competitorLeaderboard: { name: string; count: number }[];
}

export const mockOverview: Overview = {
  totalPrompts: 128,
  promptsWithRuns: 112,
  totalRuns: 940,
  mentionRate: 0.42,
  citedRate: 0.184,
  visibilityScore: 61,
  visibilityLabel: "Gelişiyor",
  visibilityBand: "gelisiyor",
  lastRunAt: "2 saat önce",
  competitorLeaderboard: [
    { name: "RivalAI", count: 38 },
    { name: "Insightly", count: 26 },
    { name: "Marka X", count: 19 },
  ],
};

export const mockTrend = [
  { date: "1 Haz", mentionRate: 0.28, citedRate: 0.11, runCount: 22 },
  { date: "8 Haz", mentionRate: 0.31, citedRate: 0.13, runCount: 26 },
  { date: "15 Haz", mentionRate: 0.35, citedRate: 0.15, runCount: 24 },
  { date: "22 Haz", mentionRate: 0.38, citedRate: 0.16, runCount: 28 },
  { date: "29 Haz", mentionRate: 0.4, citedRate: 0.17, runCount: 25 },
  { date: "6 Tem", mentionRate: 0.42, citedRate: 0.184, runCount: 30 },
];

export const mockKbHealth = {
  score: 74,
  chunkCount: 412,
  sourceCount: 38,
  pageCount: 96,
  embeddedPct: 88,
  lexicalPct: 12,
  avgAgeDays: 21,
  staleSourceCount: 4,
};

export const mockClusterStats = [
  { cluster: "Ürün karşılaştırma", total: 32, measured: 30, mentionRate: 0.5, citedRate: 0.22 },
  { cluster: "Fiyatlandırma", total: 18, measured: 18, mentionRate: 0.33, citedRate: 0.11 },
  { cluster: "Nasıl yapılır", total: 41, measured: 35, mentionRate: 0.46, citedRate: 0.2 },
  { cluster: "Marka değerlendirme", total: 22, measured: 19, mentionRate: 0.38, citedRate: 0.14 },
];

export const mockPriorityTasks = [
  { id: 1, title: "GSC'de yüksek gösterimli 6 sorgu için yayın kanıtı eksik", severity: "yüksek" as const },
  { id: 2, title: "3 rakip, fiyatlandırma cluster'ında sizden daha sık anılıyor", severity: "orta" as const },
  { id: 3, title: "Bilgi bankasında 4 kaynak 90 günden eski", severity: "düşük" as const },
];
