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
import shotMetrics from "@/assets/landing/shot-metrics.webp";
import shotDiscovery from "@/assets/landing/shot-discovery.webp";
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
    ],
  }),
  component: Landing,
});

function Hero() {
  return (
    <section id="olcum" className="visual-hero-surface relative isolate overflow-hidden border-b border-[#26302E] scroll-mt-16" data-testid="section-hero">
      <div className="visual-hero-grid pointer-events-none absolute inset-0 -z-10 opacity-40" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-24 top-24 -z-10 h-64 w-64 rounded-full bg-[#3FBFB2]/10 blur-3xl" aria-hidden="true" />
      <div className="marketing-container grid min-w-0 items-center gap-12 py-16 md:py-24 lg:grid-cols-[minmax(0,.92fr)_minmax(440px,1.08fr)] lg:gap-16 lg:py-28">
        <div className="space-y-7 text-white md:space-y-8">
          <div className="flex items-center gap-3"><span className="visual-source-label text-[#3FBFB2]">AI CITATION INTELLIGENCE</span><span className="h-px w-10 bg-[#3FBFB2]/70" /></div>
          <div className="space-y-5">
            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.03] tracking-[-0.05em] text-white md:text-5xl lg:text-[60px]" data-testid="text-hero-headline">
              Yapay zeka cevaplarında markanız <span className="text-[#3FBFB2]">kaynak</span> olarak seçiliyor mu?
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-300 md:text-lg md:leading-8">Atıf payınızı ölçün, eksik kanıtı görün ve yapay zekanın güvenebileceği bir sonraki içeriği önce üretin.</p>
          </div>
          <p className="flex items-center gap-2 text-xs font-medium text-slate-400">Ölçülen yüzeyler: <EngineRotator className="font-mono text-[#3FBFB2]" /></p>
          <div className="max-w-xl rounded-xl border border-white/15 bg-[#FBFAF5]/[0.08] p-4 backdrop-blur-md md:p-5" data-testid="hero-report-cta">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Target className="h-4 w-4 text-[#3FBFB2]" /> İlk ölçümü başlatın</div>
            <PublicReportAnalyzer />
            <p className="mt-3 text-xs leading-5 text-slate-400">Kredi kartı gerekmez. İlk ölçüm herkese açık web verileriyle başlar.</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#3FBFB2]" /> Soru bazlı ölçüm</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#3FBFB2]" /> Görünen kaynak kanıtı</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#3FBFB2]" /> Öncelikli uygulama</span>
          </div>
        </div>
        <Reveal className="relative" delay={0.06}>
          <div className="visual-panel-shadow relative overflow-hidden rounded-[28px] border border-white/15 bg-[#101211]" data-testid="hero-visual-panel">
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#101211]/45 via-transparent to-transparent" aria-hidden="true" />
            <div className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-[#101211]/70 px-3 py-1.5 backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-[#3FBFB2]" /><span className="visual-source-label text-slate-300">SOURCE SIGNAL · 01</span></div>
            <img src={heroCitationOrb} alt="Karanlık bir yüzey üzerinde, üç kaynak noktasını birleştiren ışıklı citation ağı taşıyan cam küre" className="block h-auto w-full" width="2560" height="1440" fetchPriority="high" />
            <div className="absolute bottom-5 left-5 right-5 z-20 flex items-end justify-between gap-4">
              <div><p className="visual-source-label text-[#3FBFB2]">EVIDENCE LAYER</p><p className="mt-1 text-sm font-semibold text-white">Görünmek ile kaynak olarak seçilmek aynı şey değil.</p></div>
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
    <section className="border-b border-[#E3E0D5] bg-[#FBFAF5]" data-testid="section-proof-strip">
      <div className="marketing-container grid gap-0 px-4 py-5 md:grid-cols-[1.1fr_repeat(3,.72fr)] md:px-6 md:py-0">
        <div className="flex items-center py-5 md:pr-8"><div><p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#1B7F86]">Örnek ölçüm · FilmFolk</p><p className="mt-1 text-sm leading-5 text-[#6B6A61]">41 sabit sorudaki 286 ölçüm tekrarının özeti.</p></div></div>
        {items.map((item) => (
          <div key={item.label} className="border-t border-[#E3E0D5] py-5 md:border-l md:border-t-0 md:px-7">
            <p className="font-mono text-2xl font-medium text-[#101211]"><MetricRise value={item.value} suffix={item.suffix} /></p>
            <p className="mt-1 text-xs leading-5 text-[#6B6A61]">{item.label}</p>
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
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#1B7F86]">Neden OneCite?</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-[#101211] md:text-4xl">Yapay zeka görünürlüğünü bir sayı değil, bir <span className="underline decoration-[#3FBFB2] decoration-4 underline-offset-4">kanıt zinciri</span> olarak okuyun.</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#6B6A61]">OneCite yalnızca “göründünüz” demez. Hangi soruda göründüğünüzü, hangi kaynağın seçildiğini ve daha sık atıf almak için neyin eksik olduğunu açıklar.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {items.map(({ icon: Icon, title, body }, index) => (
            <Reveal key={title} delay={index * 0.06} className="rounded-xl border border-[#E3E0D5] bg-[#FBFAF5] p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDEFE9] text-[#1B7F86]"><Icon className="h-5 w-5" /></div>
              <h3 className="mt-5 text-sm font-bold text-[#101211]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#6B6A61]">{body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function KanıtMetaforuBandı() {
  return (
    <section className="border-y border-[#E3E0D5] bg-[#101211] py-16 md:py-24" data-testid="section-visual-evidence-gap">
      <div className="marketing-container grid items-center gap-10 lg:grid-cols-[1.08fr_.92fr] lg:gap-16">
        <Reveal className="relative overflow-hidden rounded-[26px] border border-white/15 bg-[#101211] visual-panel-shadow">
          <img src={heroEvidenceGap} alt="Eksik bir parçaya sahip ışıklı cam köprü; OneCite evidence gap kavramının görsel metaforu" className="block h-auto w-full" width="2560" height="1440" loading="lazy" />
          <div className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-4"><span className="visual-source-label text-[#3FBFB2]">EVIDENCE GAP / 02</span><span className="font-mono text-[10px] text-slate-400">MISSING SOURCE</span></div>
        </Reveal>
        <div className="text-white">
          <p className="visual-source-label text-[#3FBFB2]">GÖRÜNMEYEN KIRILMA</p>
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
    <section className="border-y border-[#E3E0D5] bg-[#F2F0E8] py-16 md:py-24" data-testid="section-source-signal-action">
      <div className="marketing-container">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#1B7F86]">Ürün akışı</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-[#101211] md:text-4xl">Kaynağı sinyale, sinyali doğru uygulamaya çevirin.</h2>
          <p className="mt-4 text-base leading-7 text-[#57564E]">OneCite’in kapalı döngüsü: yapay zekanın kullanabileceği kanıtı kurar, seçimlerini ölçer ve en yüksek etkili iyileştirmeyi öne alır.</p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {steps.map(({ number, icon: Icon, eyebrow, title, body }, index) => (
            <Reveal key={number} delay={index * 0.07} className="relative rounded-xl border border-[#E3E0D5] bg-[#FBFAF5] p-6 md:p-7">
              {index < 2 && <ArrowRight className="absolute -right-8 top-1/2 hidden h-5 w-5 text-[#1B7F86] lg:block" aria-hidden="true" />}
              <div className="flex items-center justify-between"><span className="font-mono text-sm text-[#1B7F86]">{number}</span><Icon className="h-5 w-5 text-[#57564E]" /></div>
              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.12em] text-[#1B7F86]">{eyebrow}</p>
              <h3 className="mt-3 text-xl font-bold text-[#101211]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#6B6A61]">{body}</p>
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
    { step: "03", tag: "Kanıt bağlamı", title: "Bağlamı ve kapsamdaki eksikleri ilişki haritasında görün", body: "Hizmet, konu, rakip ve kaynak bağları hangi kanıt alanının zayıf kaldığını görünür hale getirir.", img: shotDiscovery, alt: "OneCite ilişki haritası" },
    { step: "04", tag: "Sonraki uygulama", title: "Fırsatı doğrudan içerik uygulamasına dönüştürün", body: "En önemli eksik kanıt, önceliklendirilmiş karşılaştırma içeriği, vaka çalışması veya otorite kaynağı taslağına dönüşür.", img: shotContent, alt: "OneCite İçerik Fırsatları" },
  ];
  return (
    <section className="border-y border-[#E3E0D5] bg-[#FBFAF5] py-16 md:py-24" data-testid="section-product-flow">
      <div className="marketing-container">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#1B7F86]">Ürünün içinden</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-[#101211] md:text-4xl">Ölçümden uygulamaya giden görünür bir karar zinciri.</h2>
          <p className="mt-4 text-base leading-7 text-[#6B6A61]">Bunlar taslak görseller değil; OneCite ürünündeki gerçek ekranlardan alınan örneklerdir.</p>
        </div>
        <div className="mt-14 space-y-16 md:space-y-24">
          {rows.map((row, index) => (
            <Reveal key={row.step} className={`grid items-center gap-9 lg:grid-cols-2 lg:gap-16 ${index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
              <div>
                <div className="flex items-center gap-3"><span className="font-mono text-xs text-[#1B7F86]">{row.step}</span><span className="h-px w-8 bg-[#3FBFB2]" /><span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B6A61]">{row.tag}</span></div>
                <h3 className="mt-5 text-2xl font-extrabold tracking-[-0.03em] text-[#101211] md:text-3xl">{row.title}</h3>
                <p className="mt-4 max-w-xl text-base leading-7 text-[#6B6A61]">{row.body}</p>
              </div>
              <div className="overflow-hidden rounded-xl border border-[#E3E0D5] bg-[#F5F3EC]"><img src={row.img} alt={row.alt} className="h-auto w-full" /></div>
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
      <div className="overflow-hidden rounded-2xl border border-[#E3E0D5] bg-[#EDEFE9] p-7 md:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          <div>
            <span className="inline-flex items-center rounded-full border border-[#C9C5B6] bg-[#FBFAF5] px-2.5 py-0.5 text-xs font-semibold text-[#1B7F86]">Örnek ölçüm · FilmFolk</span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-[-0.035em] text-[#101211] md:text-4xl">Bir vaka çalışması, yalnızca sonuç değil; sonuçtaki kanıt değişimidir.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#57564E]">FilmFolk için 41 satın alma niyetli soru, toplam 286 tekrar üzerinden karşılaştırıldı. Ağırlıklı atıf payı ilk ölçümde %30,7 iken son ölçümde %58,9’a ulaştı; değişim +28,1 puan oldu.</p>
            <Link to="/proof/filmfolk" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#101211] underline decoration-[#3FBFB2] decoration-2 underline-offset-4 transition-colors hover:text-[#1B7F86]">FilmFolk vaka çalışmasını inceleyin <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid grid-cols-2 gap-3 self-start">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-xl border border-[#E3E0D5] bg-[#FBFAF5] p-4 md:p-5">
                <p className="font-mono text-2xl font-medium text-[#101211] md:text-3xl">{metric.value}</p>
                <p className="mt-2 text-xs leading-5 text-[#6B6A61]">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PlanlaraBakis() {
  const fits = [
    { title: "İlk kez ölçmek istiyorum", description: "Tek markanın yapay zeka görünürlüğünü görün.", action: "Ücretsiz ölçüm", href: "/free-ai-readiness-report" },
    { title: "Tek markayı düzenli izliyorum", description: "Soru seti ve Bilgi Bankası ile ritmik takip kurun.", action: "Planları incele", href: "/fiyatlandirma" },
    { title: "Birden fazla marka ve domain yönetiyorum", description: "Ajans veya grup şirketi ölçeğinde marka, soru ve rakip görünürlüğünü karşılaştırın.", action: "Ajans çözümünü incele", href: "/solutions/agencies" },
  ];
  return (
    <section className="bg-[#F5F3EC] py-16 md:py-24" data-testid="section-plans-overview">
      <div className="marketing-container">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#1B7F86]">Planlar</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-[#101211] md:text-4xl">Ölçüm ritminize uygun bir başlangıç seçin.</h2>
          <p className="mt-4 text-base leading-7 text-[#6B6A61]">Planları, limitleri ve ekibiniz için uygun çalışma alanını ayrı fiyatlandırma sayfasında net biçimde karşılaştırın.</p>
        </div>
        <div className="mt-10 grid gap-3 lg:grid-cols-3">
          {fits.map((fit) => (
            <Link to={fit.href} key={fit.title} className="group flex flex-col rounded-xl border border-[#E3E0D5] bg-[#FBFAF5] p-5 transition-transform hover:-translate-y-1">
              <p className="text-sm font-bold text-[#101211]">{fit.title}</p>
              <p className="mt-2 flex-1 text-sm leading-6 text-[#6B6A61]">{fit.description}</p>
              <span className="mt-5 flex items-center gap-1 text-sm font-bold text-[#1B7F86] group-hover:text-[#101211]">{fit.action} <ArrowRight className="h-3.5 w-3.5" /></span>
            </Link>
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
      <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#1B7F86]">Sık sorulan sorular</p>
      <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-[#101211] md:text-4xl">OneCite hakkında bilmeniz gerekenler.</h2>
      <Accordion type="single" collapsible className="mt-9 w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={faq.q} value={`item-${index}`}>
            <AccordionTrigger className="text-left text-sm font-bold text-[#101211] md:text-base">{faq.q}</AccordionTrigger>
            <AccordionContent className="pr-8 leading-7 text-[#6B6A61]">{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

function SonCagri() {
  return (
    <section className="relative isolate overflow-hidden bg-[#101211] px-4 py-16 md:px-6 md:py-24" data-testid="section-final-cta">
      <img src={heroSignalAction} alt="Üç ışıklı yolun şeffaf bir prizma içinde tek kaynak noktasında birleşmesi" className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-45" loading="lazy" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#101211]/55 via-[#101211]/60 to-[#101211]" aria-hidden="true" />
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/15 bg-[#101211]/70 px-7 py-12 text-center text-white backdrop-blur-md md:px-12">
        <p className="visual-source-label text-[#3FBFB2]">SIGNAL → EVIDENCE → ACTION</p>
        <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] md:text-5xl">Markanızın yapay zeka cevaplarında nerede durduğunu tahmin etmeyin.</h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-300">İlk ölçümle soru, kaynak ve eksik kanıt zincirini görün. Sonra yalnızca en yüksek etkili uygulamaya odaklanın.</p>
        <Button size="lg" className="mt-8 bg-[#3FBFB2] text-[#101211] hover:bg-[#B8F4FF]" asChild>
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
      <KanıtMetaforuBandı />
      <KaynakSinyalUygulama />
      <UrunAkisi />
      <FilmFolkOrnegi />
      <PlanlaraBakis />
      <SSS />
      <SonCagri />
    </MarketingShell>
  );
}
