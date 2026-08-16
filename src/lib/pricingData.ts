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
    slug: "free_user",
    label: "Ücretsiz",
    desc: "Tek marka için yapay zeka görünürlüğünüzü ölçmeye başlayın.",
    monthly: 0,
    annualTotal: 0,
    limits: ["1 marka", "5 prompt", "1 rakip takibi"],
    features: ["Atıf payı ölçümü ve skor kırılımı", "Öncelikli eksik kanıt listesi"],
  },
  {
    slug: "starter",
    label: "Başlangıç",
    desc: "Tek marka için düzenli izleme, Bilgi Bankası ve içerik üretimi.",
    monthly: 49,
    annualTotal: 490,
    limits: ["1 marka", "15 prompt", "2 rakip takibi", "Ayda 3 AI atıf görünürlük içeriği"],
    features: ["Bilgi Bankası", "Aksiyon listesi", "Atıf kaynakları raporu", "E-posta ile rapor paylaşımı"],
  },
  {
    slug: "growth",
    label: "Büyüme",
    desc: "Büyüyen markalar ve uçtan uca GEO iş akışı için.",
    monthly: 149,
    annualTotal: 1490,
    limits: ["3 marka", "45 prompt", "5 rakip takibi", "Ayda 10 AI atıf görünürlük içeriği"],
    features: [
      "4 farklı LLM üzerinde kontrol",
      "Bilgi Bankası",
      "Marka Zekası (RAG)",
      "GSC / GA4 entegrasyonları",
      "Aksiyon listesi ve önceliklendirme",
      "Prompt keşfi ve rakip karşılaştırma",
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
    limits: ["Özel marka sayısı", "Özel prompt limiti", "Sınırsız rakip takibi", "Özel içerik üretim kotası"],
    features: [
      "Büyüme planındaki her şey",
      "Çoklu çalışma alanı ve müşteri yönetimi",
      "White-label rapor",
      "Öncelikli destek ve onboarding",
    ],
  },
];
