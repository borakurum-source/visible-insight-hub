import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CircleDotDashed, FileSearch, LineChart, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingShell } from "@/components/site/MarketingShell";
import { VisualHero } from "@/components/site/visual-hero";
import heroEvidenceGap from "@/assets/landing/hero-evidence-gap.webp";

export const Route = createFileRoute("/proof/filmfolk")({
  head: () => ({
    meta: [
      { title: "FilmFolk Vaka Çalışması | OneCite" },
      { name: "description", content: "FilmFolk için 41 satın alma niyetli soruda, 286 ölçüm tekrarında gözlenen yapay zeka atıf payı değişimini ve Search Console bağlamını inceleyin." },
      { property: "og:title", content: "FilmFolk Vaka Çalışması | OneCite" },
      { property: "og:description", content: "41 soru, 286 tekrar: FilmFolk'ün atıf payı değişimi." },
      { property: "og:url", content: "https://1cite.com/proof/filmfolk" },
    ],
    links: [{ rel: "canonical", href: "https://1cite.com/proof/filmfolk" }],
  }),
  component: FilmFolkPage,
});

type PromptResult = { prompt: string; first: number; latest: number; delta: number; runs: number };

const topGains: PromptResult[] = [
  { prompt: "Who offers professional livestreaming services in London?", first: 0, latest: 85, delta: 85, runs: 7 },
  { prompt: "corporate headshot photography and personal branding video combo UK", first: 0, latest: 85, delta: 85, runs: 8 },
  { prompt: "hire a videographer for a corporate event in London", first: 0, latest: 85, delta: 85, runs: 8 },
  { prompt: "Best event videographers in London for conferences", first: 0, latest: 75, delta: 75, runs: 5 },
  { prompt: "Recommend a freelance photographer in London for corporate work", first: 0, latest: 75, delta: 75, runs: 5 },
];

const pressurePrompts: PromptResult[] = [
  { prompt: "best professional photography and videography services for weddings London", first: 65, latest: 0, delta: -65, runs: 4 },
  { prompt: "Best property video production in London", first: 55, latest: 0, delta: -55, runs: 12 },
  { prompt: "Recommend a corporate photographer in London", first: 45, latest: 0, delta: -45, runs: 17 },
];

function Delta({ value }: { value: number }) {
  const positive = value >= 0;
  return <span className={`font-mono text-sm font-semibold ${positive ? "text-emerald-700" : "text-rose-700"}`}>{positive ? "+" : ""}{value} puan</span>;
}

function PromptRow({ result }: { result: PromptResult }) {
  return (
    <article className="rounded-2xl border border-border bg-background p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-2xl text-sm font-semibold leading-6 text-foreground">{result.prompt}</p>
        <div className="shrink-0 text-right"><Delta value={result.delta} /><p className="mt-1 text-xs text-muted-foreground">{result.runs} tekrar</p></div>
      </div>
      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs">
        <div><div className="mb-2 flex justify-between text-muted-foreground"><span>İlk ölçüm</span><span>{result.first}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-[#9CB6FF]" style={{ width: `${result.first}%` }} /></div></div>
        <span className="font-mono text-[#A1AABC]">→</span>
        <div><div className="mb-2 flex justify-between text-muted-foreground"><span>Son ölçüm</span><span>{result.latest}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#D9F8FF]"><div className={`h-full rounded-full ${result.delta >= 0 ? "bg-primary" : "bg-rose-500"}`} style={{ width: `${result.latest}%` }} /></div></div>
      </div>
    </article>
  );
}

function FilmFolkPage() {
  return (
    <MarketingShell>
      <VisualHero
        eyebrow="ÖRNEK ÇALIŞMA · FILMFOLK / 41 SORU"
        title={<>41 satın alma niyetli soruda atıf payındaki <span className="text-cyan">değişimi</span> görün.</>}
        description="FilmFolk için ilk ve son ölçüm sonuçları, aynı soru havuzundaki 286 tekrar üzerinden karşılaştırıldı. Bu bir nedensellik veya performans garantisi değildir; gözlenen kaynak seçimi değişiminin bağlamlı bir okumasıdır."
        image={heroEvidenceGap}
        imageAlt="Eksik parçası olan ışıklı cam köprü; ölçüm ve kanıt arasındaki kopukluğu temsil eden OneCite görseli"
        visualLabel="MEASURED EVIDENCE / 06"
        secondaryHref="#metodoloji"
        secondaryLabel="Metodolojiyi incele"
      >
        <div className="grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl border border-white/15 bg-background/[0.06] p-3"><p className="visual-source-label text-slate-400">İLK PAY</p><p className="mt-2 font-mono text-xl text-white">30,7%</p></div>
          <div className="rounded-xl border border-cyan/35 bg-cyan/10 p-3"><p className="visual-source-label text-cyan">SON PAY</p><p className="mt-2 font-mono text-xl text-white">58,9%</p></div>
          <div className="rounded-xl border border-white/15 bg-background/[0.06] p-3"><p className="visual-source-label text-slate-400">DEĞİŞİM</p><p className="mt-2 font-mono text-xl text-white">+28,1</p></div>
          <div className="rounded-xl border border-white/15 bg-background/[0.06] p-3"><p className="visual-source-label text-slate-400">TEKRAR</p><p className="mt-2 font-mono text-xl text-white">286</p></div>
        </div>
      </VisualHero>

      <section id="metodoloji" className="marketing-container py-16 md:py-24">
        <div className="marketing-copy">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Metodoloji</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-5xl">Değişimi tekil yanıtla değil, sabit soru havuzuyla okuyun.</h2>
          <p className="mt-5 text-base leading-7 text-muted-foreground">FilmFolk’in London ve Birleşik Krallık odaklı video prodüksiyonu, etkinlik, canlı yayın, fotoğraf ve düzenleme hizmetleri için satın alma niyetine yakın sorular izlendi. Her prompt için ilk ve en güncel atıf oranı, tekrar sayısı ile birlikte kaydedildi.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-border bg-background p-6"><Target className="h-5 w-5 text-primary" /><p className="mt-7 font-mono text-4xl text-foreground">41</p><h3 className="mt-2 font-bold text-foreground">Sabit soru</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Satın alma niyeti taşıyan sorgu havuzu.</p></article>
          <article className="rounded-2xl border border-border bg-background p-6"><LineChart className="h-5 w-5 text-primary" /><p className="mt-7 font-mono text-4xl text-foreground">286</p><h3 className="mt-2 font-bold text-foreground">Ölçüm tekrarı</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">İlk ve son durum karşılaştırmasında kullanılan kayıt.</p></article>
          <article className="rounded-2xl border border-border bg-background p-6"><TrendingUp className="h-5 w-5 text-emerald-700" /><p className="mt-7 font-mono text-4xl text-foreground">32 / 41</p><h3 className="mt-2 font-bold text-foreground">Yükselen soru</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Son ölçümde ilk ölçüme göre daha yüksek atıf oranı.</p></article>
          <article className="rounded-2xl border border-border bg-background p-6"><CircleDotDashed className="h-5 w-5 text-amber-600" /><p className="mt-7 font-mono text-4xl text-foreground">7 / 41</p><h3 className="mt-2 font-bold text-foreground">Gerileyen soru</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Takipte kalması gereken hizmet veya niyet alanı.</p></article>
        </div>
      </section>

      <section className="border-y border-border bg-background px-4 py-16 md:px-6 md:py-24">
        <div className="marketing-container">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="marketing-copy"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Prompt düzeyindeki değişim</p><h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-5xl">En güçlü artışlar, karar niyeti yüksek sorularda görüldü.</h2></div>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">Aşağıdaki değerler gönderilen ilk ve son ölçüm dosyasından alınmıştır.</p>
          </div>
          <div className="mt-12 grid gap-4 lg:grid-cols-2">{topGains.map((result) => <PromptRow key={result.prompt} result={result} />)}</div>
          <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex gap-3">
              <CircleDotDashed className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <h3 className="font-extrabold text-foreground">Takip edilmesi gereken gerilemeler</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Vaka çalışması yalnızca yükselişleri göstermez. Düğün, gayrimenkul videosu ve kurumsal fotoğrafçılık niyetlerinde gerilemeler görülüyor; bu alanlar yeni içerik ve kaynak çalışması için ayrı izleme listesine alınmalı.</p>
                <div className="mt-5 grid gap-2 md:grid-cols-3">
                  {pressurePrompts.map((result) => (
                    <div key={result.prompt} className="rounded-xl border border-amber-200/80 bg-background p-4">
                      <p className="text-xs font-semibold leading-5 text-foreground">{result.prompt}</p>
                      <p className="mt-3"><Delta value={result.delta} /></p>
                      <p className="mt-1 text-xs text-muted-foreground">{result.first}% → {result.latest}% · {result.runs} tekrar</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-container py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,.9fr)_minmax(360px,1.1fr)] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Search Console bağlamı</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-4xl">Organik arama yüzeyi, prompt ölçümünün yerine geçmez; onu bağlama oturtur.</h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">Ekteki Google Search Console exportu 18 Mayıs–12 Ağustos 2026 arasındaki 87 günü ve <strong>Web</strong> arama türünü içeriyor. Bu veriyi yapay zeka atıf sonucunun kanıtı olarak değil, FilmFolk’in hangi hizmet sayfalarında görünür bir organik yüzeye sahip olduğunu anlamak için kullanıyoruz.</p>
            <div className="mt-7 space-y-3 text-sm font-semibold text-foreground">
              <p className="flex items-center gap-3"><FileSearch className="h-4 w-4 text-primary" />Canlı yayın hizmeti: 3.377 gösterim</p>
              <p className="flex items-center gap-3"><FileSearch className="h-4 w-4 text-primary" />Serbest videograf hizmeti: 3.276 gösterim</p>
              <p className="flex items-center gap-3"><FileSearch className="h-4 w-4 text-primary" />Video düzenleme hizmeti: 2.276 gösterim</p>
            </div>
          </div>
          <aside className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-border bg-muted p-5"><p className="text-xs text-muted-foreground">Toplam gösterim</p><p className="mt-2 font-mono text-4xl text-foreground">44.613</p><p className="mt-1 text-xs text-muted-foreground">87 günlük export</p></div>
            <div className="rounded-2xl border border-border bg-background p-5"><p className="text-xs text-muted-foreground">Birleşik Krallık payı</p><p className="mt-2 font-mono text-4xl text-foreground">89,1%</p><p className="mt-1 text-xs text-muted-foreground">ülkelere göre gösterim</p></div>
            <div className="rounded-2xl border border-border bg-background p-5"><p className="text-xs text-muted-foreground">Masaüstü payı</p><p className="mt-2 font-mono text-4xl text-foreground">80,2%</p><p className="mt-1 text-xs text-muted-foreground">cihazlara göre gösterim</p></div>
          </aside>
        </div>
      </section>

      <section className="bg-muted px-4 py-16 md:px-6 md:py-24">
        <div className="marketing-container rounded-3xl bg-ink px-7 py-12 text-center text-white md:px-12">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan">Ne anlatıyor?</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-extrabold tracking-[-0.04em] md:text-5xl">Atıf payı büyüyebilir; ancak her niyette aynı anda büyümeyebilir.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300">FilmFolk verisi, düzenli soru takibinin hem güçlü artışları hem de kaybedilen niyet alanlarını aynı tabloda görünür kıldığını gösteriyor. Bu bir performans garantisi değildir; karar vermek için daha doğru bir ölçüm çerçevesidir.</p>
          <Button size="lg" className="mt-8 bg-cyan text-foreground hover:bg-[#B8F4FF]" asChild><Link to="/free-ai-readiness-report">Kendi ölçüm çerçeveni oluştur <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
        </div>
      </section>
    </MarketingShell>
  );
}
