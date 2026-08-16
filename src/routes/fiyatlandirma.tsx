import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Minus } from "lucide-react";
import { MarketingShell } from "@/components/site/MarketingShell";
import { MarketingCta } from "@/components/site/marketing-cta";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { pricingPlans } from "@/lib/pricingData";

const pricingFaqs = [
  {
    q: "Ücretsiz planla nereye kadar gidebilirim?",
    a: "Tek marka, 10 soru ve 2 rakip ile ilk ölçümünüzü yapar, atıf payınızı ve eksik kanıt başlıklarını görürsünüz. Kredi kartı istenmez.",
  },
  {
    q: "Yıllık ödemede ne kazanıyorum?",
    a: "Yıllık ödemede 12 ay yerine 10 aylık ücret ödersiniz; yani iki ay ücretsizdir. Yıllık planlar aynı limit ve özelliklerle gelir.",
  },
  {
    q: "Plan değişikliği veya iptal nasıl işliyor?",
    a: "Planınızı istediğiniz zaman yükseltebilir veya durdurabilirsiniz. Yükseltmede kalan süre için fark hesaplanır, taahhüt yoktur.",
  },
  {
    q: "Ajans planında müşteri limiti var mı?",
    a: "Hayır. Ajans planında müşteri, soru ve rakip takibi sınırsızdır; her müşteri için ayrı bilgi bankası, prompt seti ve rapor yönetirsiniz.",
  },
  {
    q: "Kurulum ücreti var mı?",
    a: "Yok. Kurulum sihirbazı markanızı, marka profilinizi ve ilk soru setinizi aynı gün içinde hazırlar.",
  },
];

const comparisonRows = [
  { label: "Müşteri / marka", values: ["1", "1", "5", "Sınırsız"] },
  { label: "Soru sayısı", values: ["10", "30", "100 / müşteri", "Sınırsız"] },
  { label: "Rakip takibi", values: ["2", "5", "15", "Sınırsız"] },
  { label: "Ölçüm & skor kırılımı", values: [true, true, true, true] },
  { label: "Bilgi Bankası", values: [false, true, true, true] },
  { label: "Bilgi Grafiği", values: [false, false, true, true] },
  { label: "GSC / GA4 entegrasyonu", values: [false, false, true, true] },
  { label: "Çoklu çalışma alanı", values: [false, false, false, true] },
];

const profiles = [
  {
    title: "İlk kez ölçüyorum",
    body: "Markanızın yapay zeka cevaplarında nerede durduğunu tek ölçümle görün.",
    plan: "Ücretsiz",
    href: "/free-ai-readiness-report",
    action: "Ücretsiz ölçüm başlat",
  },
  {
    title: "Tek markayı düzenli izliyorum",
    body: "Sabit soru seti, Bilgi Bankası ve aylık trend takibiyle ritim kurun.",
    plan: "Başlangıç / Büyüme",
    href: "/platform",
    action: "Platformu incele",
  },
  {
    title: "Birden fazla marka yönetiyorum",
    body: "Ajans veya grup şirketi ölçeğinde müşteri, soru ve rakip görünürlüğünü karşılaştırın.",
    plan: "Ajans",
    href: "/solutions/agencies",
    action: "Ajans çözümü",
  },
];

export const Route = createFileRoute("/fiyatlandirma")({
  head: () => ({
    meta: [
      { title: "Fiyatlandırma | OneCite Yapay Zeka Görünürlük Planları" },
      {
        name: "description",
        content:
          "OneCite planları: ücretsiz ölçümle başlayın, marka, soru ve rakip limitlerine göre aylık ya da yıllık şeffaf fiyatlarla ölçeklendirin.",
      },
      { property: "og:title", content: "Fiyatlandırma | OneCite Yapay Zeka Görünürlük Planları" },
      { property: "og:description", content: "Ücretsiz ölçümle başlayın; marka, soru ve rakip limitlerine göre şeffaf aylık ve yıllık planlar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "OneCite",
          description: "Yapay zeka cevaplarında atıf payı ölçümü ve GEO optimizasyon platformu.",
          brand: { "@type": "Brand", name: "OneCite" },
          offers: pricingPlans.map((plan) => ({
            "@type": "Offer",
            name: plan.label,
            price: plan.monthly,
            priceCurrency: "TRY",
            category: "Aylık abonelik",
            availability: "https://schema.org/InStock",
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: pricingFaqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        }),
      },
    ],
  }),
  component: PricingPage,
});

function formatTry(value: number) {
  return `₺${value.toLocaleString("tr-TR")}`;
}

function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <MarketingShell>
      <section className="border-b border-border bg-ink px-4 py-16 text-white md:px-6 md:py-24">
        <div className="marketing-container">
          <p className="editorial-eyebrow text-cyan">PLANLAR · ÖLÇÜM → KANIT → UYGULAMA</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-[-0.045em] md:text-6xl">
            Ücretsiz ölçün, işe yaradığında <span className="text-cyan">ölçeklendirin.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            Kurulum ücreti yok, taahhüt yok. Planlar takip ettiğiniz marka, soru ve rakip sayısına göre ölçeklenir.
          </p>

          <div className="mt-9 inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.06] p-1">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              aria-pressed={!annual}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${annual ? "text-slate-300" : "bg-cyan text-foreground"}`}
            >
              Aylık
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              aria-pressed={annual}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${annual ? "bg-cyan text-foreground" : "text-slate-300"}`}
            >
              Yıllık · 2 ay bedava
            </button>
          </div>
        </div>
      </section>

      <section className="marketing-container px-4 py-16 md:px-6 md:py-24">
        <div className="grid gap-4 lg:grid-cols-4">
          {pricingPlans.map((plan) => {
            const isFree = plan.monthly === 0;
            const displayPrice = isFree ? "₺0" : annual ? formatTry(plan.annualTotal) : formatTry(plan.monthly);
            const suffix = isFree ? "" : annual ? " /yıl" : " /ay";
            return (
              <div
                key={plan.slug}
                className={`flex flex-col rounded-2xl border p-6 ${plan.highlight ? "border-primary bg-secondary" : "border-border bg-background"}`}
              >
                <div className="flex items-center justify-between">
                  <p className="editorial-eyebrow text-primary">{plan.label}</p>
                  {plan.highlight && (
                    <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-white">En popüler</span>
                  )}
                </div>
                <p className="mt-5 font-mono text-3xl font-medium text-foreground">
                  {displayPrice}
                  <span className="text-sm text-muted-foreground">{suffix}</span>
                </p>
                {!isFree && annual && (
                  <p className="mt-1 text-xs text-muted-foreground">Aylık karşılığı {formatTry(Math.round(plan.annualTotal / 12))}</p>
                )}
                <p className="mt-4 min-h-[3.5rem] text-sm leading-6 text-muted-foreground">{plan.desc}</p>
                <ul className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
                  {plan.limits.map((limit) => (
                    <li key={limit} className="flex items-start gap-2 text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {limit}
                    </li>
                  ))}
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 flex-1" />
                <Button asChild className="w-full" variant={plan.highlight ? "default" : "outline"}>
                  <Link to={isFree ? "/free-ai-readiness-report" : "/auth"}>
                    {isFree ? "Ücretsiz başla" : plan.slug === "agency" ? "Görüşme planla" : "Planı seç"}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">Fiyatlara KDV dahil değildir. Ajans planında ihtiyaç halinde özel limit ve white-label seçenekleri tanımlanır.</p>
      </section>

      <section className="border-y border-border bg-secondary px-4 py-16 md:px-6 md:py-24">
        <div className="marketing-container">
          <p className="editorial-eyebrow text-primary">Karşılaştırma</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-foreground md:text-4xl">Planlar tek tabloda.</h2>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-border bg-background">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-4 font-semibold text-muted-foreground">Özellik</th>
                  {pricingPlans.map((plan) => (
                    <th key={plan.slug} className="p-4 font-bold text-foreground">{plan.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.label} className="border-b border-border last:border-0">
                    <td className="p-4 text-muted-foreground">{row.label}</td>
                    {row.values.map((value, index) => (
                      <td key={`${row.label}-${index}`} className="p-4 text-foreground">
                        {typeof value === "boolean" ? (
                          value ? <Check className="h-4 w-4 text-primary" /> : <Minus className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          value
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="marketing-container px-4 py-16 md:px-6 md:py-24">
        <p className="editorial-eyebrow text-primary">Hangi plan size uygun?</p>
        <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-foreground md:text-4xl">Ölçüm ritminize göre seçin.</h2>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {profiles.map((profile) => (
            <Link
              key={profile.title}
              to={profile.href}
              className="group flex flex-col rounded-2xl border border-border bg-background p-6 transition-transform hover:-translate-y-1"
            >
              <p className="editorial-eyebrow text-muted-foreground">{profile.plan}</p>
              <p className="mt-4 text-lg font-bold text-foreground">{profile.title}</p>
              <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{profile.body}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-primary group-hover:text-foreground">
                {profile.action} <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-background px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="editorial-eyebrow text-primary">Fiyatlandırma SSS</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-foreground md:text-4xl">Karar vermeden önce merak edilenler.</h2>
          <Accordion type="single" collapsible className="mt-9 w-full">
            {pricingFaqs.map((faq, index) => (
              <AccordionItem key={faq.q} value={`price-faq-${index}`}>
                <AccordionTrigger className="text-left text-sm font-bold text-foreground md:text-base">{faq.q}</AccordionTrigger>
                <AccordionContent className="pr-8 leading-7 text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <MarketingCta
        title="Önce ücretsiz ölçün, sonra planı seçin."
        description="İlk ölçüm markanızın yapay zeka cevaplarındaki atıf payını ve eksik kanıtlarını gösterir. Plan kararını veriye bakarak verin."
        secondaryHref="/platform"
        secondaryLabel="Platformu incele"
      />
    </MarketingShell>
  );
}
