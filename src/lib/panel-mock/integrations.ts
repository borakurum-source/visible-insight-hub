export const mockIntegrations = [
  { id: "gsc", name: "Google Search Console", status: "bagli" as const, lastSync: "2 saat önce", detail: "onecite.com" },
  { id: "ga4", name: "Google Analytics 4", status: "bagli" as const, lastSync: "2 saat önce", detail: "GA4-38291012" },
  { id: "webhook", name: "Zapier Webhook", status: "bagli-degil" as const, lastSync: "—", detail: "Otomasyon için bağlayın" },
];

export const mockGscQueries = [
  { id: 1, query: "ai görünürlük aracı", clicks: 240, impressions: 8100, ctr: 0.029, position: 4.2, promptLinked: true },
  { id: 2, query: "geo nedir", clicks: 512, impressions: 15400, ctr: 0.033, position: 2.6, promptLinked: true },
  { id: 3, query: "chatgpt marka önerisi nasıl olur", clicks: 88, impressions: 4200, ctr: 0.021, position: 7.8, promptLinked: false },
];
