export interface MockDiscoveryPrompt {
  id: number;
  promptText: string;
  cluster: string;
  opportunityScore: number;
  estMonthlyVolume: string;
  rationale: string;
}

export const mockPromptDiscovery: MockDiscoveryPrompt[] = [
  { id: 1, promptText: "Küçük işletmeler için en iyi AI görünürlük stratejisi nedir?", cluster: "Strateji", opportunityScore: 92, estMonthlyVolume: "1.2K", rationale: "Marka adı geçmiyor, rakipler de düşük skorda." },
  { id: 2, promptText: "ChatGPT'de markamın önerilmesi için ne yapmalıyım?", cluster: "Nasıl yapılır", opportunityScore: 87, estMonthlyVolume: "880", rationale: "Yüksek arama hacmi, düşük rekabet." },
  { id: 3, promptText: "GEO ajansı seçerken nelere dikkat edilmeli?", cluster: "Satın alma", opportunityScore: 78, estMonthlyVolume: "410", rationale: "BOFU niyeti yüksek, hiçbir rakip kaynak gösterilmiyor." },
];

export interface MockCitationSource {
  id: number;
  domain: string;
  title: string;
  mentionsBrand: boolean;
  citedInPrompts: number;
  authorityScore: number;
  lastSeen: string;
}

export const mockCitationSources: MockCitationSource[] = [
  { id: 1, domain: "g2.com", title: "En iyi AI görünürlük yazılımları 2025", mentionsBrand: true, citedInPrompts: 14, authorityScore: 91, lastSeen: "3 gün önce" },
  { id: 2, domain: "producthunt.com", title: "GEO araçları karşılaştırması", mentionsBrand: false, citedInPrompts: 9, authorityScore: 84, lastSeen: "1 hafta önce" },
  { id: 3, domain: "reddit.com/r/SaaS", title: "AI arama optimizasyonu deneyimleri", mentionsBrand: true, citedInPrompts: 6, authorityScore: 62, lastSeen: "2 hafta önce" },
];
