import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/fiyatlandirma")({
  head: () => ({
    meta: [
      { title: "Fiyatlandırma — 1cite" },
      {
        name: "description",
        content:
          "1cite paketleri: takip edilen sorgu sayısı, model kapsamı ve rakip analizi limitlerine göre şeffaf aylık fiyatlandırma.",
      },
      { property: "og:title", content: "Fiyatlandırma — 1cite" },
      {
        property: "og:description",
        content: "AI görünürlük takibi için şeffaf aylık paketler.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

const plans = [
  {
    name: "Başlangıç",
    price: "₺2.900",
    tag: "Tek marka",
    features: ["50 takip sorgusu", "2 model", "Haftalık tarama", "3 rakip"],
    variant: "subtle" as const,
  },
  {
    name: "Büyüme",
    price: "₺7.900",
    tag: "En popüler",
    features: ["250 takip sorgusu", "4 model", "Günlük tarama", "10 rakip", "İçerik önerileri"],
    variant: "hero" as const,
  },
  {
    name: "Ajans",
    price: "Görüşelim",
    tag: "Çoklu marka",
    features: ["Sınırsız sorgu", "Tüm modeller", "Çoklu çalışma alanı", "API erişimi"],
    variant: "subtle" as const,
  },
];

function PricingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-20">
        <h1 className="text-4xl font-semibold sm:text-5xl">Fiyatlandırma</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Takip ettiğiniz sorgu ve model sayısına göre ölçeklenir. Kurulum ücreti yok.
        </p>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`surface-panel rounded-2xl border p-8 ${
                plan.variant === "hero" ? "border-primary/50 glow-ring" : "border-border"
              }`}
            >
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">
                {plan.tag}
              </p>
              <h2 className="mt-4 text-2xl font-semibold">{plan.name}</h2>
              <p className="mt-2 font-display text-3xl">
                {plan.price}
                {plan.price.startsWith("₺") && (
                  <span className="text-base text-muted-foreground"> /ay</span>
                )}
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="size-4 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild variant={plan.variant} className="mt-8 w-full">
                <Link to="/auth">Ücretsiz başla</Link>
              </Button>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}