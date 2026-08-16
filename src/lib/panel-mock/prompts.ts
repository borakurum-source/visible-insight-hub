export interface MockPrompt {
  id: number;
  cluster: string;
  promptText: string;
  totalRuns: number;
  progressPct: number;
  funnelStage: "tofu" | "mofu" | "bofu" | null;
  latestRun: {
    timestamp: string;
    mentioned: boolean;
    cited: boolean;
    citations: string[];
    competitorsFound: string[];
    sentiment: "positive" | "neutral" | "negative" | null;
    position: "early" | "mid" | "late" | null;
    actionStatus: "draft" | "queued_computer" | "done_manual" | "done_computer" | null;
  } | null;
}

export const mockPrompts: MockPrompt[] = [
  {
    id: 1,
    cluster: "Ürün karşılaştırma",
    promptText: "AI görünürlük araçları arasında en iyi seçenek hangisi?",
    totalRuns: 12,
    progressPct: 100,
    funnelStage: "mofu",
    latestRun: {
      timestamp: "2 saat önce",
      mentioned: true,
      cited: true,
      citations: ["onecite.com/urun"],
      competitorsFound: ["RivalAI"],
      sentiment: "positive",
      position: "early",
      actionStatus: "done_computer",
    },
  },
  {
    id: 2,
    cluster: "Fiyatlandırma",
    promptText: "AI görünürlük platformlarının fiyatları ne kadar?",
    totalRuns: 9,
    progressPct: 90,
    funnelStage: "bofu",
    latestRun: {
      timestamp: "1 gün önce",
      mentioned: false,
      cited: false,
      citations: [],
      competitorsFound: ["Insightly", "Marka X"],
      sentiment: null,
      position: null,
      actionStatus: "queued_computer",
    },
  },
  {
    id: 3,
    cluster: "Nasıl yapılır",
    promptText: "GEO (generative engine optimization) nedir, nasıl yapılır?",
    totalRuns: 15,
    progressPct: 100,
    funnelStage: "tofu",
    latestRun: {
      timestamp: "5 saat önce",
      mentioned: true,
      cited: true,
      citations: ["onecite.com/blog/geo"],
      competitorsFound: [],
      sentiment: "neutral",
      position: "mid",
      actionStatus: "done_manual",
    },
  },
  {
    id: 4,
    cluster: "Marka değerlendirme",
    promptText: "OneCite güvenilir bir marka mı?",
    totalRuns: 6,
    progressPct: 60,
    funnelStage: "bofu",
    latestRun: null,
  },
];
