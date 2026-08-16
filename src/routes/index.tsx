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

function Hero() {
  return (
    <section id="olcum" className="visual-hero-surface relative isolate overflow-hidden border-b border-[#26302E] scroll-mt-16" data-testid="section-hero">
      <div className="visual-hero-grid pointer-events-none absolute inset-0 -z-10 opacity-40" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-24 top-24 -z-10 h-64 w-64 rounded-full bg-cyan/10 blur-3xl" aria-hidden="true" />
      <div className="marketing-container grid min-w-0 items-center gap-12 py-16 md:py-24 lg:grid-cols-[minmax(0,.92fr)_minmax(440px,1.08fr)] lg:gap-16 lg:py-28">
        <div className="space-y-7 text-white md:space-y-8">
          <div className="flex items-center gap-3"><span className="visual-source-label text-cyan">AI CITATION INTELLIGENCE</span><span className="h-px w-10 bg-cyan/70" /></div>
          <div className="space-y-5">
            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.03] tracking-[-0.05em] text-white md:text-5xl lg:text-[60px]" data-testid="text-hero-headline">
              Yapay zeka cevaplarında markanız <span className="text-cyan">kaynak</span> olarak seçiliyor mu?
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-300 md:text-lg md:leading-8">Atıf payınızı ölçün, eksik kanıtı görün ve yapay zekanın güvenebileceği bir sonraki içeriği önce üretin.</p>
          </div>
          <p className="flex items-center gap-2 text-xs font-medium text-slate-400">Ölçülen yüzeyler: <EngineRotator className="font-mono text-cyan" /></p>
          <div className="max-w-xl rounded-xl border border-white/15 bg-background/[0.08] p-4 backdrop-blur-md md:p-5" data-testid="hero-report-cta">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Target className="h-4 w-4 text-cyan" /> İlk ölçümü başlatın</div>
            <PublicReportAnalyzer />
            <p className="mt-3 text-xs leading-5 text-slate-400">Kredi kartı gerekmez. İlk ölçüm herkese açık web verileriyle başlar.</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-cyan" /> Soru bazlı ölçüm</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-cyan" /> Görünen kaynak kanıtı</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-cyan" /> Öncelikli uygulama</span>
          </div>
        </div>
        <Reveal className="relative" delay={0.06}>
          <div className="visual-panel-shadow relative overflow-hidden rounded-[28px] border border-white/15 bg-ink" data-testid="hero-visual-panel">
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-ink/45 via-transparent to-transparent" aria-hidden="true" />
            <div className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-ink/70 px-3 py-1.5 backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-cyan" /><span className="visual-source-label text-slate-300">SOURCE SIGNAL · 01</span></div>
            <img src={heroCitationOrb} alt="Karanlık bir yüzey üzerinde, üç kaynak noktasını birleştiren ışıklı citation ağı taşıyan cam küre" className="block h-auto w-full" width="2560" height="1440" fetchPriority="high" />
            <div className="absolute bottom-5 left-5 right-5 z-20 flex items-end justify-between gap-4">
              <div><p className="visual-source-label text-cyan">EVIDENCE LAYER</p><p className="mt-1 text-sm font-semibold text-white">Görünmek ile kaynak olarak seçilmek aynı şey değil.</p></div>
              <span className="font-mono text-[10px] text-slate-400">1C / 001</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ProofStrip() {
  const items = [
    { value: 41, suffix: "", label: "Sabit satın alma niyetli soru" },
    { value: 28.1, suffix: " puan", label: "Ağırlıklı atıf payı değişimi" },
    { value: 286, suffix: "", label: "Ölçüm tekrarı" },
  ];
  return (
    <section className="border-b border-border bg-background" data-testid="section-proof-strip">
      <div className="marketing-container grid gap-0 px-4 py-5 md:grid-cols-[1.1fr_repeat(3,.72fr)] md:px-6 md:py-0">
        <div className="flex items-center py-5 md:pr-8"><div><p className="text-xs font-semibold uppercase tracking-[0.13em] text-primary">Örnek ölçüm · FilmFolk</p><p className="mt-1 text-sm leading-5 text-muted-foreground">41 sabit sorudaki 286 ölçüm tekrarının özeti.</p></div></div>
        {items.map((item) => (
          <div key={item.label} className="border-t border-border py-5 md:border-l md:border-t-0 md:px-7">
            <p className="font-mono text-2xl font-medium text-foreground"><MetricRise value={item.value} suffix={item.suffix} /></p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function NedenOneCite() {
  const items = [
    { icon: Search, title: "SEO görünürlüğü atıf payı değildir", body: "Google’da sıralanmanız, bir yapay zeka cevabında kaynak olarak seçileceğiniz anlamına gelmez." },
    { icon: Users, title: "Rakibinizin neden seçildiğini görün", body: "Hangi soruda, hangi kaynak türüyle ve hangi kanıt sayesinde öne çıktığını ölçün." },
    { icon: ShieldCheck, title: "Tahmin yerine kanıtla ilerleyin", body: "Her öneriyi ölçülen soru, görünen kaynak ve eksik kanıtla ilişkilendirin." },
  ];
  return (
    <section className="marketing-container px-4 py-16 md:px-6 md:py-24" data-testid="section-problem">
      <div className="grid gap-10 lg:grid-cols-[.88fr_1.12fr] lg:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-primary">Neden OneCite?</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-foreground md:text-4xl">Yapay zeka görünürlüğünü bir sayı değil, bir <span className="underline decoration-cyan decoration-4 underline-offset-4">kanıt zinciri</span> olarak okuyun.</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">OneCite yalnızca “göründünüz” demez. Hangi soruda göründüğünüzü, hangi kaynağın seçildiğini ve daha sık atıf almak için neyin eksik olduğunu açıklar.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {items.map(({ icon: Icon, title, body }, index) => (
            <Reveal key={title} delay={index * 0.06} className="rounded-xl border border-border bg-background p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary"><Icon className="h-5 w-5" /></div>
              <h3 className="mt-5 text-sm font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function KanıtMetaforuBandı() {
  return (
    <section className="border-y border-border bg-ink py-16 md:py-24" data-testid="section-visual-evidence-gap">
      <div className="marketing-container grid items-center gap-10 lg:grid-cols-[1.08fr_.92fr] lg:gap-16">
        <Reveal className="relative overflow-hidden rounded-[26px] border border-white/15 bg-ink visual-panel-shadow">
          <img src={heroEvidenceGap} alt="Eksik bir parçaya sahip ışıklı cam köprü; OneCite evidence gap kavramının görsel metaforu" className="block h-auto w-full" width="2560" height="1440" loading="lazy" />
          <div className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-4"><span className="visual-source-label text-cyan">EVIDENCE GAP / 02</span><span className="font-mono text-[10px] text-slate-400">MISSING SOURCE</span></div>
        </Reveal>
        <div className="text-white">
          <p className="visual-source-label text-cyan">GÖRÜNMEYEN KIRILMA</p>
          <h2 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight tracking-[-0.04em] md:text-5xl">Eksik kanıt, görünürlüğü sessizce keser.</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 md:text-lg">Bir yapay zeka cevabında kaynak olarak seçilmek yalnızca içerik üretmekle ilgili değildir. Doğru sorunun arkasında doğru kaynak, ilişki ve güven sinyali bulunmalıdır.</p>
          <div className="mt-8 flex flex-wrap gap-3 text-xs text-slate-400">
            <span className="rounded-full border border-white/15 px-3 py-1.5">Soru bağlamı</span>
            <span className="rounded-full border border-white/15 px-3 py-1.5">Kaynak seçimi</span>
            <span className="rounded-full border border-white/15 px-3 py-1.5">Sonraki kanıt</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function KaynakSinyalUygulama() {
  const steps = [
    { number: "01", icon: Network, eyebrow: "Kaynak", title: "Marka kanıtınızı haritalayın", body: "Sayfalarınızı, yapılandırılmış verinizi, SSS’lerinizi ve güven sinyallerinizi tek marka zekasında toplayın." },
    { number: "02", icon: BarChart3, eyebrow: "Sinyal", title: "Yapay zeka seçimlerini ölçün", body: "Satın alma niyetli sorularda görünürlüğünüzü, atıf payınızı ve rakip kaynaklarını okuyun." },
    { number: "03", icon: Goal, eyebrow: "Uygulama", title: "Eksik kanıtı üretin", body: "En yüksek fırsatı karşılaştırma içeriğine, vaka çalışmasına veya otorite varlığına dönüştürün." },
  ];
  return (
    <section className="border-y border-border bg-muted py-16 md:py-24" data-testid="section-source-signal-action">
      <div className="marketing-container">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-primary">Ürün akışı</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-foreground md:text-4xl">Kaynağı sinyale, sinyali doğru uygulamaya çevirin.</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">OneCite’in kapalı döngüsü: yapay zekanın kullanabileceği kanıtı kurar, seçimlerini ölçer ve en yüksek etkili iyileştirmeyi öne alır.</p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {steps.map(({ number, icon: Icon, eyebrow, title, body }, index) => (
            <Reveal key={number} delay={index * 0.07} className="relative rounded-xl border border-border bg-background p-6 md:p-7">
              {index < 2 && <ArrowRight className="absolute -right-8 top-1/2 hidden h-5 w-5 text-primary lg:block" aria-hidden="true" />}
              <div className="flex items-center justify-between"><span className="font-mono text-sm text-primary">{number}</span><Icon className="h-5 w-5 text-muted-foreground" /></div>
              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.12em] text-primary">{eyebrow}</p>
              <h3 className="mt-3 text-xl font-bold text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Button asChild><Link to="/platform">Platformu inceleyin <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
        </div>
      </div>
    </section>
  );
}

function UrunAkisi() {
  const rows = [
    { step: "01", tag: "Kaynak zekası", title: "Önce yapay zekanın kullanabileceği marka kanıtını görün", body: "Bilgi Bankası sayfa bazında yapı, güncellik, konu varlığı ve kanıt kapsamı sinyallerini toplar. Ölçümün referans noktası budur.", img: shotKb, alt: "OneCite Bilgi Bankası" },
    { step: "02", tag: "Atıf sinyali", title: "Sonra hangi soruda, hangi kaynakla seçildiğinizi ölçün", body: "Atıf payı ve görünürlük trendi tek başına kalmaz; soru bağlamı ve seçilen kaynak ile birlikte okunur.", img: shotMetrics, alt: "OneCite atıf payı paneli" },
    { step: "03", tag: "Sonraki uygulama", title: "Fırsatı doğrudan içerik uygulamasına dönüştürün", body: "En önemli eksik kanıt, önceliklendirilmiş karşılaştırma içeriği, vaka çalışması veya otorite kaynağı taslağına dönüşür.", img: shotContent, alt: "OneCite İçerik Fırsatları" },
  ];
  return (
    <section className="border-y border-border bg-background py-16 md:py-24" data-testid="section-product-flow">
      <div className="marketing-container">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-primary">Ürünün içinden</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-foreground md:text-4xl">Ölçümden uygulamaya giden görünür bir karar zinciri.</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">Bunlar taslak görseller değil; OneCite ürünündeki gerçek ekranlardan alınan örneklerdir.</p>
        </div>
        <div className="mt-14 space-y-16 md:space-y-24">
          {rows.map((row, index) => (
            <Reveal key={row.step} className={`grid items-center gap-9 lg:grid-cols-2 lg:gap-16 ${index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
              <div>
                <div className="flex items-center gap-3"><span className="font-mono text-xs text-primary">{row.step}</span><span className="h-px w-8 bg-cyan" /><span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{row.tag}</span></div>
                <h3 className="mt-5 text-2xl font-extrabold tracking-[-0.03em] text-foreground md:text-3xl">{row.title}</h3>
                <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">{row.body}</p>
              </div>
              <div className="overflow-hidden rounded-xl border border-border bg-secondary"><img src={row.img} alt={row.alt} className="h-auto w-full" /></div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FilmFolkOrnegi() {
  const metrics = [
    { label: "İlk ağırlıklı atıf payı", value: "%30,7" },
    { label: "Son ağırlıklı atıf payı", value: "%58,9" },
    { label: "Sabit satın alma niyetli soru", value: "41" },
    { label: "Ölçüm tekrarı", value: "286" },
  ];
  return (
    <section className="marketing-container px-4 py-16 md:px-6 md:py-24" data-testid="section-case-study">
      <div className="overflow-hidden rounded-2xl border border-border bg-muted p-7 md:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          <div>
            <span className="inline-flex items-center rounded-full border border-[#C9C5B6] bg-background px-2.5 py-0.5 text-xs font-semibold text-primary">Örnek ölçüm · FilmFolk</span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-[-0.035em] text-foreground md:text-4xl">Bir vaka çalışması, yalnızca sonuç değil; sonuçtaki kanıt değişimidir.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">FilmFolk için 41 satın alma niyetli soru, toplam 286 tekrar üzerinden karşılaştırıldı. Ağırlıklı atıf payı ilk ölçümde %30,7 iken son ölçümde %58,9’a ulaştı; değişim +28,1 puan oldu.</p>
            <Link to="/proof/filmfolk" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-foreground underline decoration-cyan decoration-2 underline-offset-4 transition-colors hover:text-primary">FilmFolk vaka çalışmasını inceleyin <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid grid-cols-2 gap-3 self-start">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-xl border border-border bg-background p-4 md:p-5">
                <p className="font-mono text-2xl font-medium text-foreground md:text-3xl">{metric.value}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function KimIcin() {
  const fits = [
    { title: "İlk kez ölçmek istiyorum", description: "Tek markanın yapay zeka görünürlüğünü ücretsiz ölçümle görün.", action: "Ücretsiz ölçüm", href: "/free-ai-readiness-report" },
    { title: "Tek markayı düzenli izliyorum", description: "Sabit soru seti ve Bilgi Bankası ile aylık takip ritmi kurun.", action: "Platformu incele", href: "/platform" },
    { title: "Birden fazla marka yönetiyorum", description: "Ajans veya grup şirketi ölçeğinde marka, soru ve rakip görünürlüğünü karşılaştırın.", action: "Ajans çözümünü incele", href: "/solutions/agencies" },
  ];
  return (
    <section className="border-y border-border bg-background py-16 md:py-24" data-testid="section-audience">
      <div className="marketing-container">
        <div className="max-w-2xl">
          <p className="editorial-eyebrow text-primary">Kimin için?</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-foreground md:text-4xl">Nereden başladığınıza göre farklı bir giriş noktası.</h2>
        </div>
        <div className="mt-10 grid gap-3 lg:grid-cols-3">
          {fits.map((fit) => (
            <Link to={fit.href} key={fit.title} className="group flex flex-col rounded-xl border border-border bg-background p-5 transition-transform hover:-translate-y-1">
              <p className="text-sm font-bold text-foreground">{fit.title}</p>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{fit.description}</p>
              <span className="mt-5 flex items-center gap-1 text-sm font-bold text-primary group-hover:text-foreground">{fit.action} <ArrowRight className="h-3.5 w-3.5" /></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanlaraBakis() {
  return (
    <section className="bg-secondary py-16 md:py-24" data-testid="section-plans-overview">
      <div className="marketing-container">
        <div className="max-w-2xl">
          <p className="editorial-eyebrow text-primary">Planlar</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-foreground md:text-4xl">Ücretsiz başlayın, ihtiyaç büyüdükçe ölçeklendirin.</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">Kurulum ücreti ve taahhüt yok. Planlar takip ettiğiniz marka, soru ve rakip sayısına göre değişir.</p>
        </div>
        <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {pricingPlans.map((plan) => (
            <div key={plan.slug} className={`flex flex-col rounded-xl border p-5 ${plan.highlight ? "border-primary bg-background" : "border-border bg-background"}`}>
              <div className="flex items-center justify-between">
                <p className="editorial-eyebrow text-primary">{plan.label}</p>
                {plan.highlight && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">Popüler</span>}
              </div>
              <p className="mt-4 font-mono text-2xl font-medium text-foreground">
                {plan.monthly === 0 ? "$0" : formatUsd(plan.monthly)}
                <span className="text-xs text-muted-foreground"> /ay</span>
              </p>
              <ul className="mt-4 flex-1 space-y-1.5 text-sm text-muted-foreground">
                {plan.limits.map((limit) => (
                  <li key={limit} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{limit}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Button className="mt-8" asChild><Link to="/fiyatlandirma">Tüm planları karşılaştır <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
      </div>
    </section>
  );
}

function SSS() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24" data-testid="section-faq">
      <p className="text-xs font-semibold uppercase tracking-[0.13em] text-primary">Sık sorulan sorular</p>
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
          <Link to="/free-ai-readiness-report">Ücretsiz ölçümünü başlat <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
        </Button>
      </div>
    </section>
  );
}

function Landing() {
  return (
    <MarketingShell>
      <Hero />
      <ProofStrip />
      <NedenOneCite />
      <KaynakSinyalUygulama />
      <UrunAkisi />
      <KanıtMetaforuBandı />
      <FilmFolkOrnegi />
      <KimIcin />
      <PlanlaraBakis />
      <SSS />
      <SonCagri />
    </MarketingShell>
  );
}
