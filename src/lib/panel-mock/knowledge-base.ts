export const mockKbSummary = {
  score: 74,
  chunkCount: 412,
  sourceCount: 38,
  pageCount: 96,
  embeddedPct: 88,
  staleSourceCount: 4,
};

export interface MockKbSource {
  id: number;
  title: string;
  url: string;
  type: "sayfa" | "pdf" | "sss" | "manuel";
  chunkCount: number;
  updatedAt: string;
  status: "güncel" | "eski" | "isleniyor";
}

export const mockKbSources: MockKbSource[] = [
  { id: 1, title: "Ürün Sayfası", url: "onecite.com/urun", type: "sayfa", chunkCount: 38, updatedAt: "3 gün önce", status: "güncel" },
  { id: 2, title: "Fiyatlandırma Politikası", url: "onecite.com/fiyatlandirma", type: "sayfa", chunkCount: 12, updatedAt: "12 gün önce", status: "güncel" },
  { id: 3, title: "Şirket Tanıtım PDF'i", url: "onecite.com/assets/kurumsal.pdf", type: "pdf", chunkCount: 54, updatedAt: "94 gün önce", status: "eski" },
  { id: 4, title: "Sıkça Sorulan Sorular", url: "onecite.com/sss", type: "sss", chunkCount: 21, updatedAt: "1 gün önce", status: "güncel" },
  { id: 5, title: "Manuel eklenen marka özeti", url: "—", type: "manuel", chunkCount: 4, updatedAt: "2 saat önce", status: "isleniyor" },
];

export const mockBrandFacts = {
  brandSummary: "OneCite, markaların AI sohbet motorlarında (ChatGPT, Perplexity, Gemini) ne sıklıkla anıldığını ve alıntılandığını ölçen bir GEO platformudur.",
  services: ["AI görünürlük ölçümü", "Kanıt/bilgi bankası yönetimi", "GEO görev takibi", "Rakip analizi"],
  usp: "Tek platformda ölçüm + kanıt yönetimi + aksiyon döngüsü.",
  targetAudience: "SaaS şirketleri, ajanslar, kurumsal pazarlama ekipleri",
  tone: "Güvenilir, veri odaklı, sade",
};
