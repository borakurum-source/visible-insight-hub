export const PRICING_CURRENCY = "USD" as const;

export function formatUsd(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

export interface PricingPlan {
  slug: string;
  label: string;
  desc: string;
  monthly: number;
  annualTotal: number;
  limits: string[];
  features: string[];
  highlight?: boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    slug: "free_user",
    label: "Ücretsiz",
    desc: "Tek marka için yapay zeka görünürlüğünüzü ölçmeye başlayın.",
    monthly: 0,
    annualTotal: 0,
    limits: ["1 müşteri", "10 soru", "2 rakip takibi"],
    features: [],
  },
  {
    slug: "starter",
    label: "Başlangıç",
    desc: "Tek marka için düzenli izleme ve Bilgi Bankası.",
    monthly: 29,
    annualTotal: 290,
    limits: ["1 müşteri", "30 soru", "5 rakip takibi"],
    features: ["Bilgi Bankası"],
  },
  {
    slug: "growth",
    label: "Büyüme",
    desc: "Büyüyen markalar ve tam GEO iş akışı için.",
    monthly: 79,
    annualTotal: 790,
    limits: ["5 müşteri", "100 soru / müşteri", "15 rakip takibi"],
    features: ["Bilgi Bankası", "Bilgi Grafiği", "GSC / GA4 Entegrasyonu"],
    highlight: true,
  },
  {
    slug: "agency",
    label: "Ajans",
    desc: "Birden fazla müşteriyi tek çatı altında yöneten ajanslar için.",
    monthly: 199,
    annualTotal: 1990,
    limits: ["Sınırsız müşteri", "Sınırsız soru", "Sınırsız rakip takibi"],
    features: ["Bilgi Bankası", "Bilgi Grafiği", "GSC / GA4 Entegrasyonu"],
  },
];
