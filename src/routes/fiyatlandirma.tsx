import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Minus } from "lucide-react";
import { MarketingShell } from "@/components/site/MarketingShell";
import { MarketingCta } from "@/components/site/marketing-cta";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatUsd, pricingPlans } from "@/lib/pricingData";

const pricingFaqs = [
  {
    q: "7 günlük deneme neleri kapsıyor?",
    a: "Deneme, Başlangıç planının tamamını kapsar: 1 marka, 20 prompt, haftalık ölçüm ve 3 rakip takibi. Kredi kartı istenmez; süre bitiminde otomatik ücret alınmaz, hesabınız salt okunur moda geçer.",
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
    a: "Ajans planı teklife göre kurgulanır. Müşteri sayısı, prompt limiti ve içerik üretim kotası ihtiyacınıza göre belirlenir; her müşteri için ayrı bilgi bankası, prompt seti ve white-label rapor yönetirsiniz. Fiyat için iletişime geçin.",
  },
  {
    q: "AI kaynak görünürlük içeriği ne demek?",
    a: "Ölçümde kanıt boşluğu çıkan sorular için, kendi bilgi bankanıza dayanarak üretilen kaynak gösterilebilir içerik taslaklarıdır. Başlangıç planında ayda 3, Büyüme planında ayda 10 taslak üretebilirsiniz.",
  },
  {
    q: "Kurulum ücreti var mı?",
    a: "Yok. Kurulum sihirbazı markanızı, marka profilinizi ve ilk soru setinizi aynı gün içinde hazırlar.",
  },
];

const comparisonRows = [
  { label: "Marka", values: ["1", "1", "3", "Özel"] },
  { label: "Prompt sayısı", values: ["5", "15", "45", "Özel"] },
  { label: "Rakip takibi", values: ["1", "2", "5", "Sınırsız"] },
  { label: "Aylık AI kaynak görünürlük içeriği", values: ["—", "3", "10", "Özel"] },
  { label: "Ölçüm & skor kırılımı", values: [true, true, true, true] },
  { label: "4 farklı LLM üzerinde kontrol", values: [false, false, true, true] },
  { label: "Bilgi Bankası", values: [false, true, true, true] },
  { label: "Marka Zekası (RAG)", values: [false, false, true, true] },
  { label: "GSC / GA4 entegrasyonu", values: [false, false, true, true] },
  { label: "Aksiyon listesi", values: [false, true, true, true] },
  { label: "Çoklu çalışma alanı / white-label", values: [false, false, false, true] },
];

const profiles = [
  {
    title: "İlk kez ölçüyorum",
    body: "Markanızın yapay zeka cevaplarında nerede durduğunu tek ölçümle görün.",
    plan: "7 gün deneme",
    usage: "1 marka · 20 prompt · 3 rakip",
    href: "/ucretsiz-yapay-zeka-gorunurluk-raporu",
    action: "Ücretsiz ölçüm başlat",
  },
  {
    title: "Tek markayı düzenli izliyorum",
    body: "Sabit soru seti, Bilgi Bankası ve aylık trend takibiyle ritim kurun.",
    plan: "Başlangıç / Büyüme",
    usage: "1-3 marka · 20-60 prompt · 3-10 rakip",
    href: "/ozellikler",
    action: "Ürünü incele",
  },
  {
    title: "Birden fazla marka yönetiyorum",
    body: "Ajans veya grup şirketi ölçeğinde müşteri, soru ve rakip görünürlüğünü karşılaştırın.",
    plan: "Ajans · Teklife göre",
    usage: "Sınırsız marka · özel prompt kotası",
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
      { property: "og:url", content: "https://1cite.com/fiyatlandirma" },
    ],
    links: [{ rel: "canonical", href: "https://1cite.com/fiyatlandirma" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "OneCite",
          description: "Yapay zeka cevaplarında AI kaynak payı ölçümü ve GEO optimizasyon platformu.",
          brand: { "@type": "Brand", name: "OneCite" },
          url: "https://1cite.com/fiyatlandirma",
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "USD",
            lowPrice: 0,
            highPrice: 189,
            offerCount: pricingPlans.filter((plan) => plan.monthly !== null).length,
            url: "https://1cite.com/fiyatlandirma",
            offers: pricingPlans
              .filter((plan) => plan.monthly !== null)
              .map((plan) => ({
                "@type": "Offer",
                name: plan.label,
                description: plan.desc,
                price: plan.monthly,
                priceCurrency: "USD",
                category: "Aylık abonelik",
                url: "https://1cite.com/fiyatlandirma",
                availability: "https://schema.org/InStock",
              })),
          },
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
            const isContact = plan.contactOnly || plan.monthly === null;
            const isFree = !isContact && plan.monthly === 0;
            const displayPrice = isContact
              ? "Teklife göre"
              : isFree
                ? "$0"
                : annual
                  ? formatUsd(plan.annualTotal ?? 0)
                  : formatUsd(plan.monthly ?? 0);
            const suffix = isContact || isFree ? "" : annual ? " /yıl" : " /ay";
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
                <p className={`mt-5 font-mono font-medium text-foreground ${isContact ? "text-2xl" : "text-3xl"}`}>
                  {displayPrice}
                  <span className="text-sm text-muted-foreground">{suffix}</span>
                </p>
                {!isFree && !isContact && annual && (
                  <p className="mt-1 text-xs text-muted-foreground">Aylık karşılığı {formatUsd(Math.round((plan.annualTotal ?? 0) / 12))}</p>
                )}
                {isContact && <p className="mt-1 text-xs text-muted-foreground">İhtiyacınıza göre limit ve fiyat belirlenir.</p>}
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
                  {isContact ? (
                    <a href="mailto:hello@1cite.com?subject=Ajans%20plan%C4%B1%20teklif%20talebi">İletişime geç</a>
                  ) : (
                    <Link to={isFree ? "/ucretsiz-yapay-zeka-gorunurluk-raporu" : "/app/pricing"}>{isFree ? "7 gün ücretsiz dene" : "Planı seç"}</Link>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">Fiyatlar ABD doları (USD) cinsindendir ve vergiler hariçtir. Ajans planında ihtiyaç halinde özel limit ve white-label seçenekleri tanımlanır.</p>
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
              <p className="mt-4 font-mono text-[11px] text-muted-foreground">{profile.usage}</p>
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
        description="İlk ölçüm markanızın yapay zeka cevaplarındaki AI kaynak payını ve eksik kanıtlarını gösterir. Plan kararını veriye bakarak verin."
        secondaryHref="/ozellikler"
        secondaryLabel="Platformu incele"
      />
    </MarketingShell>
  );
}
