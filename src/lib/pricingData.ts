export const PRICING_CURRENCY = "USD" as const;

export function formatUsd(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

export interface PricingPlan {
  slug: string;
  label: string;
  desc: string;
  monthly: number | null;
  annualTotal: number | null;
  limits: string[];
  features: string[];
  highlight?: boolean;
  contactOnly?: boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    slug: "trial",
    label: "7 gün deneme",
    desc: "Kredi kartı istemeden Başlangıç planının tamamını 7 gün deneyin.",
    monthly: 0,
    annualTotal: 0,
    limits: ["1 marka", "20 prompt", "Haftalık ölçüm", "3 rakip takibi", "7 gün süre"],
    features: [
      "Başlangıç planının tüm özellikleri",
      "Ücretsiz yapay zeka görünürlük raporu",
      "Kredi kartı gerekmez",
    ],
  },
  {
    slug: "starter",
    label: "Başlangıç",
    desc: "Tek marka için haftalık izleme, Bilgi Bankası ve içerik üretimi.",
    monthly: 69,
    annualTotal: 690,
    limits: ["1 marka", "20 prompt", "Haftalık ölçüm (ayda 80 yanıt)", "3 rakip takibi", "Ayda 5 AI görünürlük içeriği", "2 kullanıcı"],
    features: [
      "Bilgi Bankası ve Marka İddiaları",
      "Aksiyon listesi ve görev takibi",
      "Seçilen kaynaklar raporu",
      "GSC entegrasyonu",
      "E-posta ile rapor paylaşımı",
    ],
  },
  {
    slug: "growth",
    label: "Büyüme",
    desc: "Büyüyen markalar ve uçtan uca GEO iş akışı için.",
    monthly: 189,
    annualTotal: 1890,
    limits: ["3 marka", "60 prompt", "Haftalık ölçüm (ayda 240 yanıt)", "10 rakip takibi", "Ayda 20 AI görünürlük içeriği", "5 kullanıcı"],
    features: [
      "Başlangıç planındaki her şey",
      "Bilgi Bankası",
      "Marka Zekası (RAG)",
      "GSC / GA4 / Bing Webmaster entegrasyonları",
      "Rakip karşılaştırmalı görünürlük trendi",
      "Yapay zeka trafiği kırılımı (ChatGPT, Perplexity, Copilot, Gemini)",
      "Paylaşılabilir müşteri raporu",
    ],
    highlight: true,
  },
  {
    slug: "agency",
    label: "Ajans",
    desc: "Birden fazla müşteriyi tek çatı altında yöneten ajanslar için.",
    monthly: null,
    annualTotal: null,
    contactOnly: true,
    limits: ["Sınırsız marka", "Özel prompt limiti", "Günlük ölçüme kadar", "Sınırsız rakip takibi", "Sınırsız kullanıcı"],
    features: [
      "Büyüme planındaki her şey",
      "Çoklu çalışma alanı ve müşteri yönetimi",
      "White-label rapor",
      "Öncelikli destek ve onboarding",
    ],
  },
];
