export interface MockContentDraft {
  id: number;
  title: string;
  targetPrompt: string;
  status: "taslak" | "incelemede" | "yayinlandi";
  format: "blog" | "sss" | "landing" | "karsilastirma";
  updatedAt: string;
  wordCount: number;
}

export const mockContentDrafts: MockContentDraft[] = [
  { id: 1, title: "GEO Nedir? 2025 Rehberi", targetPrompt: "GEO nedir, nasıl yapılır?", status: "yayinlandi", format: "blog", updatedAt: "3 gün önce", wordCount: 1840 },
  { id: 2, title: "OneCite vs RivalAI Karşılaştırması", targetPrompt: "En iyi AI görünürlük aracı hangisi?", status: "incelemede", format: "karsilastirma", updatedAt: "1 gün önce", wordCount: 1220 },
  { id: 3, title: "Fiyatlandırma SSS Güncellemesi", targetPrompt: "Fiyatlar ne kadar?", status: "taslak", format: "sss", updatedAt: "5 saat önce", wordCount: 480 },
];

export const mockContentGaps = [
  { id: 1, cluster: "Fiyatlandırma", gap: "Paket karşılaştırma tablosu eksik", impact: "yuksek" as const },
  { id: 2, cluster: "Entegrasyon", gap: "GSC bağlantı adımları detaylandırılmamış", impact: "orta" as const },
];
