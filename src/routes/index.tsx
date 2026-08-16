import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Goal,
  Network,
  Search,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { MarketingShell } from "@/components/site/MarketingShell";
import { Reveal } from "@/components/site/marketing-motion";
import { PublicReportAnalyzer } from "@/components/site/public-report-analyzer";
import { EngineRotator, MetricRise } from "@/components/site/citation-motion";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqs } from "@/lib/faqData";
import { formatUsd, pricingPlans } from "@/lib/pricingData";
import shotMetrics from "@/assets/landing/shot-metrics.webp";
import shotKb from "@/assets/landing/shot-kb.webp";
import shotContent from "@/assets/landing/shot-content.webp";
import heroCitationOrb from "@/assets/landing/hero-citation-orb.webp";
import heroEvidenceGap from "@/assets/landing/hero-evidence-gap.webp";
import heroSignalAction from "@/assets/landing/hero-signal-action.webp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OneCite | Yapay Zeka Atıf Zekası" },
      { name: "description", content: "Yapay zeka cevaplarında markanızın atıf payını ölçün, eksik kanıtları görün ve doğru GEO uygulamasını önceliklendirin." },
      { property: "og:title", content: "OneCite | Yapay Zeka Atıf Zekası" },
      { property: "og:description", content: "Yapay zeka cevaplarında markanızın atıf payını, eksik kanıtları ve öncelikli uygulamalarını görün." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://1cite.com" },
    ],
    links: [{ rel: "canonical", href: "https://1cite.com" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        }),
      },
    ],
  }),
  component: Landing,
});

const HERO_PROOF = [
  { value: 28.1, suffix: " puan", label: "6 ayda ağırlıklı atıf payı artışı" },
  { value: 41, suffix: "", label: "Satın alma niyetli soru" },
  { value: 286, suffix: "", label: "Ölçüm tekrarı" },
];

function Hero() {
  return (
    <section id="olcum" className="visual-hero-surface relative isolate overflow-hidden border-b border-[#26302E] scroll-mt-16" data-testid="section-hero">
      <div className="visual-hero-grid pointer-events-none absolute inset-0 -z-10 opacity-40" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-24 top-24 -z-10 h-64 w-64 rounded-full bg-cyan/10 blur-3xl" aria-hidden="true" />
      <div className="marketing-container grid min-w-0 items-stretch gap-12 py-16 md:py-20 lg:grid-cols-[minmax(0,1.04fr)_minmax(400px,.96fr)] lg:gap-14 lg:py-24">
        <div className="flex flex-col justify-center space-y-6 text-white md:space-y-7">
          <div className="flex items-center gap-3"><span className="visual-source-label text-cyan">AI CITATION INTELLIGENCE</span><span className="h-px w-10 bg-cyan/70" /></div>
          <div className="space-y-5">
            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-[-0.045em] text-white md:text-[44px] lg:text-[52px]" data-testid="text-hero-headline">
              ChatGPT, Perplexity ve Gemini cevaplarında markanızın <span className="text-cyan">atıf payını</span> ölçün ve artırın.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-300 md:text-lg md:leading-8">
              OneCite, satın alma niyetli sorularda hangi markanın kaynak olarak seçildiğini ölçer, eksik kanıtı gösterir ve önce hangi içeriği üretmeniz gerektiğini söyler.
            </p>
          </div>
          <div className="max-w-xl rounded-xl border border-white/15 bg-background/[0.08] p-4 backdrop-blur-md md:p-5" data-testid="hero-report-cta">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Target className="h-4 w-4 text-cyan" /> İlk ölçümü başlatın</div>
            <PublicReportAnalyzer />
            <p className="mt-3 text-xs leading-5 text-slate-400">Kredi kartı gerekmez. İlk ölçüm herkese açık web verileriyle başlar.</p>
          </div>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
            <span>Kredi kartı yok · 2 dakikada rapor · Ölçülen yüzeyler:</span>
            <EngineRotator className="font-mono text-cyan" />
          </p>
          <dl className="grid max-w-xl grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/15 bg-white/10" data-testid="hero-proof-strip">
            {HERO_PROOF.map((item) => (
              <div key={item.label} className="bg-ink/70 px-4 py-4">
                <dt className="font-mono text-xl font-medium text-white md:text-2xl">
                  <MetricRise value={item.value} suffix={item.suffix} />
                </dt>
                <dd className="mt-1 text-[11px] leading-4 text-slate-400">{item.label}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[11px] text-slate-500">FilmFolk markası için altı aylık gerçek ölçüm sonuçları.</p>
        </div>
        <div className="flex items-center" data-testid="hero-visual-panel">
          <HeroVisual
            image={heroCitationOrb}
            imageAlt="Karanlık bir yüzey üzerinde, üç kaynak noktasını birleştiren ışıklı citation ağı taşıyan cam küre"
            label="EVIDENCE LAYER"
            caption="Görünmek ile kaynak olarak seçilmek aynı şey değil."
            meta="AI CITATION INTELLIGENCE"
            priority
            className="w-full"
          />
        </div>
      </div>
    </section>
  );
}

function Problem() {
  const items = [
    { icon: Search, title: "SEO görünürlüğü atıf payı değildir", body: "Google’da sıralanmanız, bir yapay zeka cevabında kaynak olarak seçileceğiniz anlamına gelmez." },
    { icon: Users, title: "Rakibiniz neden seçiliyor?", body: "Hangi soruda, hangi kaynak türüyle ve hangi kanıt sayesinde öne çıktığını göremezsiniz." },
    { icon: ShieldCheck, title: "Tahminle içerik üretiliyor", body: "Her öneri ölçülen soruya, görünen kaynağa ve eksik kanıta bağlanmadığında bütçe boşa gider." },
  ];
  return (
    <section className="border-y border-border bg-ink py-16 text-white md:py-24" data-testid="section-problem">
      <div className="marketing-container">
        <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_.98fr] lg:gap-16">
          <Reveal className="visual-panel-shadow relative overflow-hidden rounded-[26px] border border-white/15 bg-ink">
            <img src={heroEvidenceGap} alt="Eksik bir parçaya sahip ışıklı cam köprü; OneCite evidence gap kavramının görsel metaforu" className="block h-auto w-full" width="2560" height="1440" loading="lazy" />
            <div className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-4"><span className="visual-source-label text-cyan">EVIDENCE GAP / 02</span><span className="font-mono text-[10px] text-slate-400">MISSING SOURCE</span></div>
          </Reveal>
          <div>
            <p className="editorial-eyebrow text-cyan">Görünmeyen kırılma</p>
            <h2 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight tracking-[-0.04em] md:text-5xl">Eksik kanıt, görünürlüğü sessizce keser.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 md:text-lg">Bir yapay zeka cevabında kaynak olarak seçilmek yalnızca içerik üretmekle ilgili değildir. Doğru sorunun arkasında doğru kaynak, ilişki ve güven sinyali bulunmalıdır.</p>
          </div>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {items.map(({ icon: Icon, title, body }, index) => (
            <Reveal key={title} delay={index * 0.06} className="rounded-xl border border-white/15 bg-white/[0.04] p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-cyan"><Icon className="h-5 w-5" /></div>
              <h3 className="mt-5 text-sm font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function NasilCalisir() {
  const rows = [
    {
      step: "01",
      icon: Network,
      tag: "Kaynak",
      title: "Marka kanıtınızı haritalayın",
      body: "Bilgi Bankası sayfalarınızı, yapılandırılmış verinizi, SSS’lerinizi ve güven sinyallerinizi tek marka zekasında toplar. Ölçümün referans noktası budur.",
      img: shotKb,
      alt: "OneCite Bilgi Bankası ekranı",
    },
    {
      step: "02",
      icon: BarChart3,
      tag: "Sinyal",
      title: "Yapay zeka seçimlerini ölçün",
      body: "Satın alma niyetli sorularda atıf payınızı, görünürlük trendini ve rakip kaynaklarını okuyun. Rakam tek başına kalmaz; soru bağlamı ve seçilen kaynakla birlikte gelir.",
      img: shotMetrics,
      alt: "OneCite atıf payı paneli",
    },
    {
      step: "03",
      icon: Goal,
      tag: "Uygulama",
      title: "Eksik kanıtı üretin",
      body: "En yüksek etkili eksik kanıt, önceliklendirilmiş karşılaştırma içeriği, vaka çalışması veya otorite kaynağı taslağına dönüşür.",
      img: shotContent,
      alt: "OneCite İçerik Fırsatları ekranı",
    },
  ];
  return (
    <section className="border-b border-border bg-background py-16 md:py-24" data-testid="section-how-it-works">
      <div className="marketing-container">
        <div className="max-w-2xl">
          <p className="editorial-eyebrow text-primary">Nasıl çalışır</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-foreground md:text-4xl">Kaynağı sinyale, sinyali doğru uygulamaya çevirin.</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">Aşağıdakiler taslak görseller değil; OneCite panelindeki gerçek ekranlar.</p>
        </div>
        <div className="mt-14 space-y-16 md:space-y-24">
          {rows.map((row, index) => (
            <Reveal key={row.step} className={`grid items-center gap-9 lg:grid-cols-2 lg:gap-16 ${index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-primary">{row.step}</span>
                  <span className="h-px w-8 bg-cyan" />
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{row.tag}</span>
                  <row.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-2xl font-extrabold tracking-[-0.03em] text-foreground md:text-3xl">{row.title}</h3>
                <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">{row.body}</p>
              </div>
              <div className="overflow-hidden rounded-xl border border-border bg-secondary"><img src={row.img} alt={row.alt} className="h-auto w-full" loading="lazy" /></div>
            </Reveal>
          ))}
        </div>
        <div className="mt-14 flex justify-center">
          <Button asChild><Link to="/platform">Platformu inceleyin <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
        </div>
      </div>
    </section>
  );
}

function FilmFolkOrnegi() {
  const timeline = [
    { phase: "Başlangıç", body: "41 satın alma niyetli soru sabitlendi; ilk ölçümde ağırlıklı atıf payı %30,7 çıktı." },
    { phase: "Eksik kanıt", body: "Rakiplerin seçildiği sorularda karşılaştırma sayfası, fiyat şeffaflığı ve vaka kanıtı eksikti." },
    { phase: "Uygulama", body: "Öncelik sırasına göre karşılaştırma içerikleri, SSS yapısı ve referans varlıkları üretildi." },
    { phase: "Sonuç", body: "Son ölçümde ağırlıklı atıf payı %58,9’a çıktı; kazanım 286 tekrar üzerinden doğrulandı." },
  ];
  return (
    <section className="marketing-container px-4 py-16 md:px-6 md:py-24" data-testid="section-case-study">
      <div className="overflow-hidden rounded-2xl border border-border bg-muted p-7 md:p-12">
        <div className="grid gap-10 lg:grid-cols-[.95fr_1.05fr] lg:gap-16">
          <div>
            <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-semibold text-primary">Vaka çalışması · FilmFolk</span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-[-0.035em] text-foreground md:text-4xl">Atıf payı %30,7’den %58,9’a nasıl çıktı?</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">Sonuç tek bir içerik hamlesinden gelmedi. Hangi soruda hangi kaynağın seçildiği ölçüldü, eksik kanıt sıraya kondu ve yalnızca en yüksek etkili varlıklar üretildi.</p>
            <Link to="/proof/filmfolk" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-foreground underline decoration-cyan decoration-2 underline-offset-4 transition-colors hover:text-primary">Vaka çalışmasının tamamını inceleyin <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <ol className="space-y-3">
            {timeline.map((item, index) => (
              <li key={item.phase} className="flex gap-4 rounded-xl border border-border bg-background p-4 md:p-5">
                <span className="font-mono text-xs text-primary">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p className="text-sm font-bold text-foreground">{item.phase}</p>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

const planFits: Record<string, string> = {
  free_user: "İlk kez ölçmek isteyenler için",
  starter: "Tek markayı düzenli izleyenler için",
  growth: "Büyüyen marka ekipleri için",
  agency: "Birden fazla marka yönetenler için",
};

function PlanlarVeKimIcin() {
  return (
    <section className="border-y border-border bg-secondary py-16 md:py-24" data-testid="section-plans-overview">
      <div className="marketing-container">
        <div className="max-w-2xl">
          <p className="editorial-eyebrow text-primary">Kimin için ve ne kadar?</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-foreground md:text-4xl">Ücretsiz başlayın, ihtiyaç büyüdükçe ölçeklendirin.</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">Kurulum ücreti ve taahhüt yok. Planlar takip ettiğiniz marka, soru ve rakip sayısına göre değişir.</p>
        </div>
        <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {pricingPlans.map((plan) => (
            <div key={plan.slug} className={`flex flex-col rounded-xl border bg-background p-5 ${plan.highlight ? "border-primary" : "border-border"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="editorial-eyebrow text-primary">{plan.label}</p>
                {plan.highlight && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">Popüler</span>}
              </div>
              <p className="mt-3 text-xs font-semibold leading-5 text-foreground">{planFits[plan.slug] ?? plan.desc}</p>
              <p className="mt-4 font-mono text-2xl font-medium text-foreground">
                {plan.monthly === null ? "Teklif" : plan.monthly === 0 ? "$0" : formatUsd(plan.monthly)}
                {plan.monthly !== null && <span className="text-xs text-muted-foreground"> /ay</span>}
              </p>
              <ul className="mt-4 flex-1 space-y-1.5 text-sm text-muted-foreground">
                {plan.limits.map((limit) => (
                  <li key={limit} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{limit}</li>
                ))}
              </ul>
              <Link to="/fiyatlandirma" className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary hover:text-foreground">
                Plan detayı <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild><Link to="/fiyatlandirma">Tüm planları karşılaştır <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
          <Button asChild variant="outline"><Link to="/solutions/agencies">Ajans çözümünü incele</Link></Button>
        </div>
      </div>
    </section>
  );
}

function SSS() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24" data-testid="section-faq">
      <p className="editorial-eyebrow text-primary">Sık sorulan sorular</p>
      <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-foreground md:text-4xl">OneCite hakkında bilmeniz gerekenler.</h2>
      <Accordion type="single" collapsible className="mt-9 w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={faq.q} value={`item-${index}`}>
            <AccordionTrigger className="text-left text-sm font-bold text-foreground md:text-base">{faq.q}</AccordionTrigger>
            <AccordionContent className="pr-8 leading-7 text-muted-foreground">{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

function SonCagri() {
  return (
    <section className="relative isolate overflow-hidden bg-ink px-4 py-16 md:px-6 md:py-24" data-testid="section-final-cta">
      <img src={heroSignalAction} alt="Üç ışıklı yolun şeffaf bir prizma içinde tek kaynak noktasında birleşmesi" className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-45" loading="lazy" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-ink/55 via-ink/60 to-ink" aria-hidden="true" />
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/15 bg-ink/70 px-7 py-12 text-center text-white backdrop-blur-md md:px-12">
        <p className="visual-source-label text-cyan">SIGNAL → EVIDENCE → ACTION</p>
        <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] md:text-5xl">Markanızın yapay zeka cevaplarında nerede durduğunu tahmin etmeyin.</h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-300">İlk ölçümle soru, kaynak ve eksik kanıt zincirini görün. Sonra yalnızca en yüksek etkili uygulamaya odaklanın.</p>
        <Button size="lg" className="mt-8 bg-cyan text-foreground hover:bg-[#B8F4FF]" asChild>
          <Link to="/ucretsiz-yapay-zeka-gorunurluk-raporu">Ücretsiz ölçümünü başlat <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
        </Button>
      </div>
    </section>
  );
}

function Landing() {
  return (
    <MarketingShell>
      <Hero />
      <Problem />
      <NasilCalisir />
      <FilmFolkOrnegi />
      <PlanlarVeKimIcin />
      <SSS />
      <SonCagri />
    </MarketingShell>
  );
}
