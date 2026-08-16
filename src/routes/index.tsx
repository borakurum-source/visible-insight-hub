import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Search, ShieldCheck, Users } from "lucide-react";
import { MarketingShell } from "@/components/site/MarketingShell";
import { PublicReportAnalyzer } from "@/components/site/public-report-analyzer";
import { EngineRotator, MetricRise } from "@/components/site/citation-motion";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqs } from "@/lib/faqData";
import heroCitationOrb from "@/assets/landing/hero-citation-orb.webp";
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
    <section className="visual-hero-surface relative isolate overflow-hidden border-b border-[#1B2D52]">
      <div className="visual-hero-grid pointer-events-none absolute inset-0 -z-10 opacity-40" aria-hidden="true" />
      <div className="marketing-container grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[minmax(0,.92fr)_minmax(440px,1.08fr)] lg:gap-16 lg:py-28">
        <div className="space-y-7 text-white md:space-y-8">
          <div className="flex items-center gap-3"><span className="visual-source-label text-[#35E1FF]">AI CITATION INTELLIGENCE</span><span className="h-px w-10 bg-[#35E1FF]/70" /></div>
          <div className="space-y-5">
            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.03] tracking-[-0.05em] text-white md:text-5xl lg:text-[60px]">Yapay zeka cevaplarında markanız <span className="text-[#35E1FF]">kaynak</span> olarak seçiliyor mu?</h1>
            <p className="max-w-xl text-base leading-7 text-slate-300 md:text-lg md:leading-8">Atıf payınızı ölçün, eksik kanıtı görün ve yapay zekanın güvenebileceği bir sonraki içeriği önce üretin.</p>
          </div>
          <p className="flex items-center gap-2 text-xs font-medium text-slate-400">Ölçülen yüzeyler: <EngineRotator className="font-mono text-[#35E1FF]" /></p>
          <div className="max-w-xl rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-md md:p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">İlk ölçümü başlatın</div>
            <PublicReportAnalyzer />
            <p className="mt-3 text-xs leading-5 text-slate-400">Kredi kartı gerekmez. İlk ölçüm herkese açık web verileriyle başlar.</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#35E1FF]" /> Soru bazlı ölçüm</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#35E1FF]" /> Görünen kaynak kanıtı</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#35E1FF]" /> Öncelikli uygulama</span>
          </div>
        </div>
        <div className="visual-panel-shadow relative overflow-hidden rounded-[28px] border border-white/15 bg-[#0B1020]">
          <img src={heroCitationOrb} alt="Üç kaynak noktasını birleştiren ışıklı citation ağı taşıyan cam küre" className="block h-auto w-full" width="2560" height="1440" fetchPriority="high" />
          <div className="absolute bottom-5 left-5 right-5 z-20 flex items-end justify-between gap-4">
            <div><p className="visual-source-label text-[#35E1FF]">EVIDENCE LAYER</p><p className="mt-1 text-sm font-semibold text-white">Görünmek ile kaynak olarak seçilmek aynı şey değil.</p></div>
            <span className="font-mono text-[10px] text-slate-400">1C / 001</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProofStrip() {
  const items = [{ value: 41, suffix: "", label: "Sabit satın alma niyetli soru" }, { value: 28.1, suffix: " puan", label: "Ağırlıklı atıf payı değişimi" }, { value: 286, suffix: "", label: "Ölçüm tekrarı" }];
  return (
    <section className="border-b border-[#E6EAF2] bg-white">
      <div className="marketing-container grid gap-0 px-4 py-5 md:grid-cols-[1.1fr_repeat(3,.72fr)] md:px-6 md:py-0">
        <div className="flex items-center py-5 md:pr-8"><div><p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#356AFF]">Örnek ölçüm · FilmFolk</p><p className="mt-1 text-sm leading-5 text-[#667085]">41 sabit sorudaki 286 ölçüm tekrarının özeti.</p></div></div>
        {items.map((item) => (
          <div key={item.label} className="border-t border-[#E6EAF2] py-5 md:border-l md:border-t-0 md:px-7">
            <p className="font-mono text-2xl font-medium text-[#0B1020]"><MetricRise value={item.value} suffix={item.suffix} /></p>
            <p className="mt-1 text-xs leading-5 text-[#667085]">{item.label}</p>
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
    <section className="marketing-container px-4 py-16 md:px-6 md:py-24">
      <div className="grid gap-10 lg:grid-cols-[.88fr_1.12fr] lg:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#356AFF]">Neden OneCite?</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-[#0B1020] md:text-4xl">Yapay zeka görünürlüğünü bir sayı değil, bir <span className="underline decoration-[#35E1FF] decoration-4 underline-offset-4">kanıt zinciri</span> olarak okuyun.</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#667085]">OneCite yalnızca “göründünüz” demez. Hangi soruda göründüğünüzü, hangi kaynağın seçildiğini ve daha sık atıf almak için neyin eksik olduğunu açıklar.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {items.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-[#E6EAF2] bg-white p-5 shadow-[0_12px_28px_rgba(11,16,32,0.035)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF3FF] text-[#356AFF]"><Icon className="h-5 w-5" /></div>
              <h3 className="mt-5 text-sm font-bold text-[#0B1020]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#667085]">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FilmFolkOrnegi() {
  const metrics = [{ label: "İlk ağırlıklı atıf payı", value: "%30,7" }, { label: "Son ağırlıklı atıf payı", value: "%58,9" }, { label: "Sabit satın alma niyetli soru", value: "41" }, { label: "Ölçüm tekrarı", value: "286" }];
  return (
    <section className="marketing-container px-4 py-16 md:px-6 md:py-24">
      <div className="overflow-hidden rounded-3xl border border-[#DDE5F4] bg-[#EEF3FF] p-7 md:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          <div>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.035em] text-[#0B1020] md:text-4xl">Bir vaka çalışması, yalnızca sonuç değil; sonuçtaki kanıt değişimidir.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#516078]">FilmFolk için 41 satın alma niyetli soru, toplam 286 tekrar üzerinden karşılaştırıldı. Ağırlıklı atıf payı ilk ölçümde %30,7 iken son ölçümde %58,9’a ulaştı; değişim +28,1 puan oldu.</p>
            <Link to="/proof/filmfolk" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#0B1020] underline decoration-[#35E1FF] decoration-2 underline-offset-4 hover:text-[#356AFF]">FilmFolk vaka çalışmasını inceleyin <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid grid-cols-2 gap-3 self-start">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-white bg-white p-4 md:p-5">
                <p className="font-mono text-2xl font-medium text-[#0B1020] md:text-3xl">{metric.value}</p>
                <p className="mt-2 text-xs leading-5 text-[#667085]">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SSS() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#356AFF]">Sık sorulan sorular</p>
      <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em] text-[#0B1020] md:text-4xl">OneCite hakkında bilmeniz gerekenler.</h2>
      <Accordion type="single" collapsible className="mt-9 w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={faq.q} value={`item-${index}`}>
            <AccordionTrigger className="text-left text-sm font-bold text-[#0B1020] md:text-base">{faq.q}</AccordionTrigger>
            <AccordionContent className="pr-8 leading-7 text-[#667085]">{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

function SonCagri() {
  return (
    <section className="relative isolate overflow-hidden bg-[#0B1020] px-4 py-16 md:px-6 md:py-24">
      <img src={heroSignalAction} alt="Üç ışıklı yolun şeffaf bir prizma içinde tek kaynak noktasında birleşmesi" className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-45" loading="lazy" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#0B1020]/55 via-[#0B1020]/60 to-[#0B1020]" aria-hidden="true" />
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/15 bg-[#0B1020]/70 px-7 py-12 text-center text-white backdrop-blur-md md:px-12">
        <p className="visual-source-label text-[#35E1FF]">SIGNAL → EVIDENCE → ACTION</p>
        <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] md:text-5xl">Markanızın yapay zeka cevaplarında nerede durduğunu tahmin etmeyin.</h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-300">İlk ölçümle soru, kaynak ve eksik kanıt zincirini görün. Sonra yalnızca en yüksek etkili uygulamaya odaklanın.</p>
        <Button size="lg" className="mt-8 bg-[#35E1FF] text-[#0B1020] hover:bg-[#B8F4FF]" asChild>
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
      <FilmFolkOrnegi />
      <SSS />
      <SonCagri />
    </MarketingShell>
  );
}
