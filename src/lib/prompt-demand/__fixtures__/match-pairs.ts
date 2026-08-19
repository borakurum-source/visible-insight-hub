// Elle etiketli eslestirme fiksturu.
// Amac: kosinus esiklerini kor kor sabitlemek yerine olcerek ayarlamak.
// "expected: false" ciftleri bilerek konu olarak yakin ama niyet olarak farklidir;
// embedding tabanli eslestirmenin en buyuk riski bu yanlis pozitiflerdir.
export type LabeledPair = {
  candidate: string;
  query: string;
  expected: boolean;
  language: "tr" | "en" | "mixed";
  note?: string;
};

export const MATCH_PAIRS: LabeledPair[] = [
  // --- Dogru eslesmeler (TR) ---
  { candidate: "yapay zeka görünürlük aracı", query: "yapay zeka görünürlük aracı", expected: true, language: "tr" },
  { candidate: "yapay zeka görünürlük aracı", query: "ai görünürlük yazılımı", expected: true, language: "tr" },
  { candidate: "e-ticaret kargo entegrasyonu", query: "e ticaret kargo entegrasyon api", expected: true, language: "tr" },
  { candidate: "e-ticaret kargo entegrasyonu", query: "online mağaza gönderi entegrasyonu", expected: true, language: "tr" },
  { candidate: "kurumsal seo ajansı", query: "kurumsal seo ajansları", expected: true, language: "tr" },
  { candidate: "kurumsal seo ajansı", query: "b2b seo danışmanlığı firması", expected: true, language: "tr" },
  { candidate: "chatgpt'de markam nasıl görünür", query: "chatgpt marka görünürlüğü nasıl artar", expected: true, language: "tr" },
  { candidate: "yapay zeka kaynak gösterim payı ölçümü", query: "ai atıf payı ölçme", expected: true, language: "tr" },
  { candidate: "geo optimizasyonu nedir", query: "generative engine optimization nedir", expected: true, language: "mixed" },
  { candidate: "marka zekası bilgi bankası", query: "marka bilgi bankası oluşturma", expected: true, language: "tr" },
  { candidate: "perplexity'de nasıl kaynak gösterilirim", query: "perplexity kaynak gösterimi almak", expected: true, language: "tr" },
  { candidate: "ai görünürlük raporu ücretsiz", query: "ücretsiz yapay zeka görünürlük raporu", expected: true, language: "tr" },
  { candidate: "llms.txt nasıl hazırlanır", query: "llms txt dosyası oluşturma", expected: true, language: "mixed" },
  { candidate: "yapay zeka arama optimizasyonu fiyatları", query: "ai arama optimizasyon ücreti", expected: true, language: "tr" },
  { candidate: "search console verisi ile ai görünürlük", query: "google search console ai görünürlük", expected: true, language: "mixed" },

  // --- Dogru eslesmeler (EN) ---
  { candidate: "ai visibility tracking tool", query: "ai visibility tracker", expected: true, language: "en" },
  { candidate: "how to get cited by chatgpt", query: "getting cited in chatgpt answers", expected: true, language: "en" },
  { candidate: "generative engine optimization agency", query: "geo optimization agency", expected: true, language: "en" },
  { candidate: "brand mention monitoring in llms", query: "monitor brand mentions in ai answers", expected: true, language: "en" },
  { candidate: "enterprise seo platform pricing", query: "enterprise seo software cost", expected: true, language: "en" },

  // --- Yanlis eslesmeler: konu yakin, niyet farkli ---
  { candidate: "AI görünürlük platformu", query: "AI güvenlik platformu", expected: false, language: "tr", note: "konu yakın, alan tamamen farklı" },
  { candidate: "yapay zeka görünürlük aracı", query: "yapay zeka görsel oluşturma aracı", expected: false, language: "tr" },
  { candidate: "e-ticaret kargo entegrasyonu", query: "e-ticaret ödeme entegrasyonu", expected: false, language: "tr" },
  { candidate: "kurumsal seo ajansı", query: "kurumsal sosyal medya ajansı", expected: false, language: "tr" },
  { candidate: "chatgpt'de markam nasıl görünür", query: "chatgpt abonelik ücreti ne kadar", expected: false, language: "tr" },
  { candidate: "ai kaynak gösterim payı ölçümü", query: "ai içerik tespit aracı", expected: false, language: "tr" },
  { candidate: "marka zekası bilgi bankası", query: "marka tescil başvurusu", expected: false, language: "tr" },
  { candidate: "perplexity'de nasıl kaynak gösterilirim", query: "perplexity pro iptal etme", expected: false, language: "tr" },
  { candidate: "llms.txt nasıl hazırlanır", query: "robots.txt nasıl engellenir", expected: false, language: "mixed", note: "dosya adı benzer, amaç zıt" },
  { candidate: "ai visibility tracking tool", query: "ai security monitoring tool", expected: false, language: "en" },
  { candidate: "how to get cited by chatgpt", query: "how to detect chatgpt written text", expected: false, language: "en" },
  { candidate: "generative engine optimization agency", query: "generative ai art studio", expected: false, language: "en" },
  { candidate: "enterprise seo platform pricing", query: "enterprise crm platform pricing", expected: false, language: "en" },
  { candidate: "yapay zeka arama optimizasyonu fiyatları", query: "yapay zeka hisse senedi fiyatları", expected: false, language: "tr" },
  { candidate: "search console verisi ile ai görünürlük", query: "search console hesap silme", expected: false, language: "mixed" },
];
