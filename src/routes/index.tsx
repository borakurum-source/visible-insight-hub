import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  BadgeCheck,
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
import { ProductTabs, type ProductTab } from "@/components/site/product-tabs";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqs } from "@/lib/faqData";
import {
  AUTHORITY_BADGES,
  CASE_RESULTS,
  COMMITMENT_FAQ,
  COMMITMENT_CONDITIONS,
  COMMITMENT_STEPS,
  TRUST_CARDS,
} from "@/lib/trustSignals";
import { CASE_LOGOS } from "@/lib/caseLogos";
import { ClientLogoStrip, ClientLogoWall } from "@/components/site/client-logos";
import { formatUsd, pricingPlans } from "@/lib/pricingData";
import shotMetrics from "@/assets/landing/shot-metrics.webp";
import shotKb from "@/assets/landing/shot-kb.webp";
import shotContent from "@/assets/landing/shot-content.webp";
import shotDashboard from "@/assets/features/dashboard.webp.asset.json";
import shotCompetitors from "@/assets/features/competitors.webp.asset.json";
import shotTasks from "@/assets/features/tasks.webp.asset.json";
import heroEvidenceGap from "@/assets/landing/hero-evidence-gap.webp";
import heroSignalAction from "@/assets/landing/hero-signal-action.webp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OneCite | Yapay Zeka Görünürlük ve Kaynak Payı Platformu" },
      { name: "description", content: "Türkiye'de geliştirilen ilk uçtan uca yapay zeka görünürlük platformu: 10.000+ prompt ile test edilmiş akademik metodoloji, Marka Zekası RAG altyapısı ve 90 gün görünürlük taahhüdü." },
      { property: "og:title", content: "OneCite | Yapay Zeka Görünürlük ve Kaynak Payı Platformu" },
      { property: "og:description", content: "10.000+ prompt ile test edilmiş akademik metodoloji, Marka Zekası RAG altyapısı ve 90 gün görünürlük taahhüdü ile AI kaynak payınızı ölçün." },
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

const MEASURED_ENGINES = ["ChatGPT", "Perplexity", "Gemini", "Copilot", "Claude"];

const PRODUCT_TABS: ProductTab[] = [
  {
    id: "skor",
    label: "OneCite Score",
    headline: "Tek skorda: yapay zeka cevaplarında neredesiniz?",
    body: "Bahsedilme, AI kaynak payı, sıralama kalitesi, kanıt kapsamı ve iddia kanıtı olarak beş bileşene bölünür. Zayıf bileşenin yanında ne yapmanız gerektiği yazar.",
    highlight: "AI Kaynak Payı %58,9",
    shot: shotDashboard.url,
    alt: "OneCite komuta merkezi ekranı: OneCite Score ve görünürlük kırılımı",
  },
  {
    id: "rakip",
    label: "Rakip trendi",
    headline: "Aynı sorularda rakibiniz seçiliyorsa bunu görürsünüz",
    body: "Takip ettiğiniz her soruda hangi alan adının kaynak olarak seçildiğini sayar, karşılaştırmalı trend çizgisiyle kaybettiğiniz payı gösteririz.",
    highlight: "3 rakip, tek grafik",
    shot: shotCompetitors.url,
    alt: "OneCite rakip takibi ekranı: karşılaştırmalı görünürlük trendi",
  },
  {
    id: "gorevler",
    label: "Görev listesi",
    headline: "Ölçüm biter bitmez sıradaki iş listeniz hazır",
    body: "Görünmediğiniz her soru; içerik, kanıt veya teknik iyileştirme görevine dönüşür. Tamamladıkça skorun nasıl değiştiğini izlersiniz.",
    highlight: "Bu hafta 3 öncelik",
    shot: shotTasks.url,
    alt: "OneCite görev listesi ekranı: öncelikli aksiyonlar",
  },
];

function Hero() {
  return (
    <section id="olcum" className="visual-hero-surface relative isolate overflow-hidden border-b border-[#26302E] scroll-mt-16" data-testid="section-hero">
      <div className="visual-hero-grid pointer-events-none absolute inset-0 -z-10 opacity-40" aria-hidden="true" />
      <div className="hero-ambient-glow" aria-hidden="true" />
      <div className="marketing-container relative flex min-w-0 flex-col items-center py-16 text-center md:py-20 lg:py-24">
        <div className="flex w-full max-w-4xl flex-col items-center space-y-6 text-white md:space-y-7">
          <div className="flex items-center gap-3"><span className="visual-source-label text-cyan">AI CITATION INTELLIGENCE</span><span className="h-px w-10 bg-cyan/70" /></div>
          <div className="space-y-5">
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-[-0.045em] text-white md:text-[48px] lg:text-[58px]" data-testid="text-hero-headline">
              ChatGPT, Perplexity ve Gemini cevaplarında markanızın <span className="text-cyan">AI kaynak payını</span> ölçün ve artırın.
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-7 text-slate-300 md:text-lg md:leading-8">
              OneCite, satın alma niyetli sorularda hangi markanın kaynak olarak seçildiğini ölçer, eksik kanıtı gösterir ve önce hangi içeriği üretmeniz gerektiğini söyler.
            </p>
          </div>
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left shadow-2xl backdrop-blur-xl md:p-4" data-testid="hero-report-cta">
            <div className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold text-white"><Target className="h-4 w-4 text-cyan" /> İlk ölçümü başlatın</div>
            <PublicReportAnalyzer />
            <p className="mt-3 px-1 text-[11px] leading-5 text-slate-400">Kredi kartı gerekmez. İlk ölçüm herkese açık web verileriyle başlar.</p>
          </div>
          <div className="space-y-3">
            <p className="text-xs text-slate-400">Kredi kartı yok · 2 dakikada rapor · Kurulum 5 dakika</p>
            <div className="flex flex-wrap items-center justify-center gap-2" data-testid="hero-engine-strip">
              <span className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Ölçülen motorlar</span>
              {MEASURED_ENGINES.map((engine) => (
                <span key={engine} className="rounded-full border border-white/15 px-2.5 py-1 font-mono text-[11px] text-slate-300">
                  {engine}
                </span>
              ))}
            </div>
          </div>
          <div className="grid w-full gap-2 border-t border-white/10 pt-6 sm:grid-cols-2 lg:grid-cols-4" data-testid="hero-authority-strip">
            {AUTHORITY_BADGES.map((badge) => {
              const inner = (
                <>
                  <span className="flex items-center gap-1.5 text-[12px] font-bold text-white">
                    <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-cyan" aria-hidden="true" />
                    {badge.value}
                  </span>
                  <span className="mt-1 block text-[11px] leading-4 text-slate-400">{badge.label}</span>
                </>
              );
              return badge.to ? (
                <Link
                  key={badge.value}
                  to={badge.to}
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left transition-colors hover:border-cyan/50 hover:bg-white/[0.07]"
                >
                  {inner}
                </Link>
              ) : (
                <div key={badge.value} className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left">
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function NedenOneCite() {
  return (
    <section className="border-b border-border bg-ink py-16 text-white md:py-24" data-testid="section-why-onecite">
      <div className="marketing-container">
        <div className="max-w-2xl">
          <p className="editorial-eyebrow text-cyan">Neden OneCite?</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] md:text-4xl">
            Türkçe pazarda yapay zeka görünürlüğünü uçtan uca ölçen tek sistem.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Her iddianın arkasında bir kanıt var: yayınlanmış metodoloji, tekrarlı ölçüm ve gerçek marka sonuçları.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TRUST_CARDS.map((card, index) => (
            <Reveal key={card.title} delay={index * 0.05} className="flex h-full flex-col rounded-xl border border-white/15 bg-white/[0.04] p-5">
              <span className="w-fit rounded-full border border-cyan/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-cyan">
                {card.proof}
              </span>
              <h3 className="mt-4 text-base font-bold text-white">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{card.body}</p>
            </Reveal>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="bg-cyan text-foreground hover:bg-[#B8F4FF]">
            <Link to="/metodoloji">Metodolojiyi inceleyin <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10">
            <Link to="/proof/filmfolk">Gerçek ölçüm sonucuna bakın</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function GorunurlukTaahhudu() {
  return (
    <section className="border-y border-border bg-background py-16 md:py-24" data-testid="section-commitment">
      <div className="marketing-container">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <p className="editorial-eyebrow text-primary">90 Gün Görünürlük Taahhüdü</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-foreground md:text-4xl">
              90. gün, 0. günün üzerinde olur. Olmazsa ücretinizi iade ederiz.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
              OneCite metodolojisi uygulanır ve panelde üretilen görevler tamamlanırsa, takip edilen prompt setinizin
              toplam görünürlüğü 90. günde başlangıç ölçümünüzün üzerine çıkar.
            </p>
            <ul className="mt-7 space-y-2.5">
              {COMMITMENT_CONDITIONS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-xl text-xs leading-5 text-muted-foreground">
              Yapay zeka motorları kapalı sistemlerdir; taahhüt tek tek cevapları değil, takip edilen prompt setinin
              toplam görünürlüğünü kapsar. Ayrıntılar için{" "}
              <Link to="/refund-policy" className="font-semibold text-primary underline underline-offset-4">
                İade Politikası
              </Link>{" "}
              sayfasına bakın.
            </p>
          </div>
          <ol className="relative space-y-4 before:absolute before:bottom-6 before:left-[15px] before:top-6 before:w-px before:bg-border">
            {COMMITMENT_STEPS.map((item, index) => (
              <li key={item.day} className="relative flex gap-4">
                <span className="relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary bg-background font-mono text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1 rounded-xl border border-border bg-secondary p-4 md:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-primary">{item.day}</span>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {item.owner}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-foreground">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.body}</p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {item.outputs.map((output) => (
                      <li
                        key={output}
                        className="rounded-md bg-background px-2 py-1 text-[11px] leading-4 text-muted-foreground"
                      >
                        {output}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-12 border-t border-border pt-10">
          <h3 className="text-lg font-bold text-foreground">Taahhüt hakkında sık sorulanlar</h3>
          <Accordion type="single" collapsible className="mt-4 max-w-3xl">
            {COMMITMENT_FAQ.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="text-left text-sm font-semibold">{item.q}</AccordionTrigger>
                <AccordionContent className="text-sm leading-6 text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

function SonucVerenMarkalar() {
  return (
    <section className="border-b border-border bg-secondary py-16 md:py-24" data-testid="section-reference-brands">
      <div className="marketing-container">
        <div className="max-w-2xl">
          <p className="editorial-eyebrow text-primary">Sonuç veren uygulamalar</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-foreground md:text-4xl">
            OneCite metodolojisiyle ölçülen markalar.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Farklı sektörlerde aynı akış çalışıyor: prompt setini sabitle, eksik kanıtı üret, görünürlüğü yeniden ölç.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="case-gallery">
          {CASE_RESULTS.map((item) => (
            <CaseCard key={item.brand} item={item} />
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Rakamlar ilgili dönemde takip edilen prompt setinin ağırlıklı AI kaynak payıdır. "Doğrulanmış" etiketli
          vakaların ham ölçüm raporu yayımlanmıştır; diğerleri marka onayıyla anonim olmayan özet verilerdir.
        </p>
        <div className="mt-10 border-t border-border pt-8">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Bizi tercih eden markalar</p>
          <div className="mt-5">
            <ClientLogoWall />
          </div>
        </div>
      </div>
    </section>
  );
}

function CaseCard({ item }: { item: (typeof CASE_RESULTS)[number] }) {
  const delta = Math.round((item.after - item.before) * 10) / 10;
  const logo = item.logoSlug ? CASE_LOGOS[item.logoSlug] : undefined;
  const inner = (
    <>
      <div className="flex h-9 items-center">
        {logo ? (
          <img
            src={logo}
            alt={`${item.brand} logosu`}
            loading="lazy"
            className="max-h-8 w-auto max-w-[130px] object-contain opacity-80"
          />
        ) : (
          <span className="text-base font-extrabold tracking-[-0.02em] text-foreground">{item.brand}</span>
        )}
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{item.sector}</p>
      <div className="mt-4 flex items-baseline gap-2 font-mono">
        <span className="text-sm text-muted-foreground line-through">%{item.before.toString().replace(".", ",")}</span>
        <ArrowRight className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        <span className="text-2xl font-bold text-foreground">%{item.after.toString().replace(".", ",")}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className="h-full rounded-full bg-primary" style={{ width: `${item.after}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono font-bold text-primary">
          +{delta.toString().replace(".", ",")} puan
        </span>
        <span className="text-muted-foreground">{item.window}</span>
        {item.verified ? (
          <span className="inline-flex items-center gap-1 font-semibold text-primary">
            <BadgeCheck className="h-3 w-3" aria-hidden="true" /> Doğrulanmış
          </span>
        ) : null}
      </div>
      {item.to ? (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">
          Vakayı inceleyin <ArrowRight className="h-3.5 w-3.5" />
        </span>
      ) : null}
    </>
  );
  const className =
    "flex flex-col rounded-xl border border-border bg-background p-5 transition-colors hover:border-primary";
  return item.to ? (
    <Link to={item.to} className={className}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  );
}

function NeGoreceksiniz() {
  return (
    <section className="border-b border-border bg-background py-16 md:py-24" data-testid="section-product-preview">
      <div className="marketing-container">
        <div className="max-w-2xl">
          <p className="editorial-eyebrow text-primary">Ne göreceksiniz</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-foreground md:text-4xl">
            İlk ölçümden sonra paneliniz böyle görünür.
          </h2>
          <p className="mt-4 max-w-prose text-base leading-7 text-muted-foreground">
            Üç ekran; skorunuz, rakiplerinizle karşılaştırmanız ve bu hafta yapılacaklar listeniz.
          </p>
        </div>
        <div className="mt-10">
          <ProductTabs tabs={PRODUCT_TABS} />
        </div>
      </div>
    </section>
  );
}

function Problem() {
  const items = [
    { icon: Search, title: "SEO görünürlüğü AI kaynak payı değildir", body: "Google’da sıralanmanız, bir yapay zeka cevabında kaynak olarak seçileceğiniz anlamına gelmez." },
    { icon: Users, title: "Rakibiniz neden seçiliyor?", body: "Hangi soruda, hangi kaynak türüyle ve hangi kanıt sayesinde öne çıktığını göremezsiniz." },
    { icon: ShieldCheck, title: "Tahminle içerik üretiliyor", body: "Her öneri ölçülen soruya, görünen kaynağa ve eksik kanıta bağlanmadığında bütçe boşa gider." },
  ];
  return (
    <section className="border-y border-border bg-ink py-16 text-white md:py-24" data-testid="section-problem">
      <div className="marketing-container">
        <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_.98fr] lg:gap-16">
          <Reveal className="visual-panel-shadow relative overflow-hidden rounded-[26px] border border-white/15 bg-ink">
            <img src={heroEvidenceGap} alt="Eksik bir parçaya sahip ışıklı cam köprü; OneCite evidence gap kavramının görsel metaforu" className="block h-auto w-full" width="2560" height="1440" loading="lazy" />
            <div className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-4"><span className="visual-source-label text-cyan">EVIDENCE GAP</span><span className="font-mono text-[10px] text-slate-400">MISSING SOURCE</span></div>
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
      body: "Satın alma niyetli sorularda AI kaynak payınızı, görünürlük trendini ve rakip kaynaklarını okuyun. Rakam tek başına kalmaz; soru bağlamı ve seçilen kaynakla birlikte gelir.",
      img: shotMetrics,
      alt: "OneCite AI kaynak payı paneli",
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
          <Button asChild><Link to="/ozellikler">Ürünün tamamını inceleyin <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
        </div>
      </div>
    </section>
  );
}

function FilmFolkOrnegi() {
  const timeline = [
    { phase: "Başlangıç", body: "41 satın alma niyetli soru sabitlendi; ilk ölçümde ağırlıklı AI kaynak payı %30,7 çıktı." },
    { phase: "Eksik kanıt", body: "Rakiplerin seçildiği sorularda karşılaştırma sayfası, fiyat şeffaflığı ve vaka kanıtı eksikti." },
    { phase: "Uygulama", body: "Öncelik sırasına göre karşılaştırma içerikleri, SSS yapısı ve referans varlıkları üretildi." },
    { phase: "Sonuç", body: "Son ölçümde ağırlıklı AI kaynak payı %58,9’a çıktı; kazanım 286 tekrar üzerinden doğrulandı." },
  ];
  return (
    <section className="marketing-container px-4 py-16 md:px-6 md:py-24" data-testid="section-case-study">
      <div className="overflow-hidden rounded-2xl border border-border bg-muted p-7 md:p-12">
        <div className="grid gap-10 lg:grid-cols-[.95fr_1.05fr] lg:gap-16">
          <div>
            <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-semibold text-primary">Vaka çalışması · FilmFolk</span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-[-0.035em] text-foreground md:text-4xl">AI Kaynak Payı %30,7’den %58,9’a nasıl çıktı?</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">Sonuç tek bir içerik hamlesinden gelmedi. Hangi soruda hangi kaynağın seçildiği ölçüldü, eksik kanıt sıraya kondu ve yalnızca en yüksek etkili varlıklar üretildi.</p>
            <div className="mt-8 flex items-end gap-5" data-testid="case-before-after">
              <div>
                <p className="editorial-eyebrow text-muted-foreground">Önce</p>
                <p className="mt-1 font-mono text-3xl font-medium text-muted-foreground md:text-4xl">%30,7</p>
              </div>
              <ArrowRight className="mb-2 h-6 w-6 text-primary" aria-hidden="true" />
              <div>
                <p className="editorial-eyebrow text-primary">Sonra</p>
                <p className="mt-1 font-mono text-4xl font-medium text-foreground md:text-5xl">%58,9</p>
              </div>
            </div>
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
  trial: "Kredi kartsız 7 günlük tam erişim",
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
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-foreground md:text-4xl">7 gün ücretsiz deneyin, ihtiyaç büyüdükçe ölçeklendirin.</h2>
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
        <p className="visual-source-label text-cyan">SİNYAL → KANIT → AKSİYON</p>
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
      <ClientLogoStrip />
      <NeGoreceksiniz />
      <NedenOneCite />
      <Problem />
      <NasilCalisir />
      <FilmFolkOrnegi />
      <SonucVerenMarkalar />
      <GorunurlukTaahhudu />
      <PlanlarVeKimIcin />
      <SSS />
      <SonCagri />
    </MarketingShell>
  );
}
