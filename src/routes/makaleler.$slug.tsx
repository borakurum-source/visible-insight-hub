import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft, ArrowRight, CalendarDays, CircleAlert, Clock3, FileSearch, FileText, LineChart, ListChecks, SearchCheck, Target, TrendingDown, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketingShell } from "@/components/site/MarketingShell";
import { VisualHero } from "@/components/site/visual-hero";
import { AnimatedBar, MotionPress, Reveal } from "@/components/site/marketing-motion";
import { MiniMarkdown } from "@/components/site/mini-markdown";
import heroCitationOrb from "@/assets/landing/hero-citation-orb.webp";
import heroEvidenceGap from "@/assets/landing/hero-evidence-gap.webp";
import { articles, type Article } from "./makaleler.index";

export const Route = createFileRoute("/makaleler/$slug")({
  head: ({ params }) => {
    const article = articles.find((item) => item.slug === params.slug);
    const title = article ? `${article.title} | OneCite` : "Makale bulunamadı | OneCite";
    const description = article?.description ?? "Aradığınız makale bulunamadı.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ArticleDetailPage,
});

type PromptChange = { prompt: string; first: number; latest: number; delta: number; runs: number };

const gains: PromptChange[] = [
  { prompt: "Profesyonel canlı yayın hizmetini Londra'da kim sunuyor?", first: 0, latest: 85, delta: 85, runs: 7 },
  { prompt: "Kurumsal etkinlik için Londra'da videograf kiralamak", first: 0, latest: 85, delta: 85, runs: 8 },
  { prompt: "Kurumsal kişisel marka videosu ve headshot paketi, Birleşik Krallık", first: 0, latest: 85, delta: 85, runs: 8 },
  { prompt: "Londra'da konferanslar için en iyi etkinlik videografları", first: 0, latest: 75, delta: 75, runs: 6 },
];

const watchlist: PromptChange[] = [
  { prompt: "Londra'da kurumsal fotoğrafçı önerisi", first: 45, latest: 0, delta: -45, runs: 17 },
  { prompt: "Londra'da en iyi gayrimenkul video prodüksiyonu", first: 55, latest: 0, delta: -55, runs: 12 },
  { prompt: "Londra'da düğün için profesyonel fotoğraf ve video hizmeti", first: 65, latest: 0, delta: -65, runs: 4 },
];

function Delta({ value }: { value: number }) {
  return <span className={`font-mono text-sm font-semibold ${value >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{value >= 0 ? "+" : ""}{value} puan</span>;
}

function PromptComparison({ item, tone = "positive" }: { item: PromptChange; tone?: "positive" | "watch" }) {
  const positive = tone === "positive";
  return (
    <article className="rounded-2xl border border-border bg-background p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-2xl text-sm font-semibold leading-6 text-foreground">{item.prompt}</p>
        <div className="shrink-0 text-right"><Delta value={item.delta} /><p className="mt-1 text-xs text-muted-foreground">{item.runs} ölçüm tekrarı</p></div>
      </div>
      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div>
          <div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>İlk ölçüm</span><span>{item.first}%</span></div>
          <AnimatedBar value={item.first} label={`${item.prompt} ilk ölçüm ${item.first} yüzde`} className="bg-[#9CB6FF]" />
        </div>
        <span className="pb-0.5 font-mono text-[#A1AABC]">→</span>
        <div>
          <div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>Son ölçüm</span><span>{item.latest}%</span></div>
          <AnimatedBar value={item.latest} label={`${item.prompt} son ölçüm ${item.latest} yüzde`} className={positive ? "bg-[#356AFF]" : "bg-rose-500"} />
        </div>
      </div>
    </article>
  );
}

function FilmFolkCaseStudy() {
  return (
    <MarketingShell>
      <article>
        <VisualHero
          eyebrow="VAKA İNCELEMESİ · FILMFOLK / 41 SORU"
          title={<>Atıf payı <span className="text-cyan">%30,7’den %58,9’a</span> nasıl taşındı?</>}
          description="Aynı satın alma niyetli soru havuzunda yapılan ilk ve son ölçüm karşılaştırması. Bu vaka tek bir yanıtı değil; hangi niyetlerde kaynak olarak daha sık seçildiğini gösterir."
          image={heroEvidenceGap}
          imageAlt="Eksik parçası olan ışıklı cam köprü; FilmFolk vaka incelemesinde kanıt boşluğunu temsil eden OneCite görseli"
          visualLabel="CASE STUDY / FILMFOLK"
          primaryHref="#metodoloji"
          primaryLabel="Metodolojiyi incele"
          secondaryHref="/free-ai-readiness-report"
          secondaryLabel="Kendi ölçümünü başlat"
        >
          <div className="grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-white/15 bg-background/[0.06] p-3"><p className="visual-source-label text-slate-400">İLK PAY</p><p className="mt-2 font-mono text-xl text-white">30,7%</p></div>
            <div className="rounded-xl border border-[#35E1FF]/35 bg-cyan/10 p-3"><p className="visual-source-label text-cyan">SON PAY</p><p className="mt-2 font-mono text-xl text-white">58,9%</p></div>
            <div className="rounded-xl border border-white/15 bg-background/[0.06] p-3"><p className="visual-source-label text-slate-400">DEĞİŞİM</p><p className="mt-2 font-mono text-xl text-white">+28,1</p></div>
            <div className="rounded-xl border border-white/15 bg-background/[0.06] p-3"><p className="visual-source-label text-slate-400">TEKRAR</p><p className="mt-2 font-mono text-xl text-white">286</p></div>
          </div>
        </VisualHero>

        <section id="metodoloji" className="marketing-container px-4 py-16 md:px-6 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,.88fr)_minmax(380px,1.12fr)]">
            <Reveal>
              <div>
                <Link to="/makaleler" className="inline-flex items-center gap-1 text-sm font-bold text-primary"><ArrowLeft className="h-4 w-4" /> Tüm makaleler</Link>
                <p className="mt-9 text-xs font-semibold uppercase tracking-[0.14em] text-primary">Ölçüm çerçevesi</p>
                <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-5xl">Sabit soru seti, tekrar edilmiş ölçüm ve açık sınırlar.</h2>
                <p className="mt-5 text-base leading-7 text-muted-foreground">Londra ve Birleşik Krallık odaklı video prodüksiyonu, etkinlik, canlı yayın, fotoğraf ve düzenleme hizmetlerinde satın alma niyeti taşıyan sorular takip edildi. Aynı soru havuzu, ilk ve son gözlemde tekrar kullanıldı.</p>
                <p className="mt-4 text-base leading-7 text-muted-foreground">Bu çalışma gözlenen bir değişimi raporlar; değişimi tek bir içerik veya tek bir müdahaleye bağlayan nedensellik iddiası taşımaz.</p>
              </div>
            </Reveal>
            <div className="grid gap-3 sm:grid-cols-2">
              <Reveal delay={0.04}><div className="rounded-2xl border border-border bg-background p-5"><Target className="h-5 w-5 text-primary" /><p className="mt-6 font-mono text-4xl text-foreground">41</p><h3 className="mt-2 font-bold text-foreground">Sabit soru</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Satın alma niyetli sorgu seti.</p></div></Reveal>
              <Reveal delay={0.08}><div className="rounded-2xl border border-border bg-background p-5"><LineChart className="h-5 w-5 text-primary" /><p className="mt-6 font-mono text-4xl text-foreground">286</p><h3 className="mt-2 font-bold text-foreground">Tekrar</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Ağırlıklı orana giren kayıtlar.</p></div></Reveal>
              <Reveal delay={0.12}><div className="rounded-2xl border border-border bg-background p-5"><TrendingUp className="h-5 w-5 text-emerald-700" /><p className="mt-6 font-mono text-4xl text-foreground">32</p><h3 className="mt-2 font-bold text-foreground">Yükselen soru</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Son ölçümde daha yüksek oran.</p></div></Reveal>
              <Reveal delay={0.16}><div className="rounded-2xl border border-border bg-background p-5"><TrendingDown className="h-5 w-5 text-rose-700" /><p className="mt-6 font-mono text-4xl text-foreground">7</p><h3 className="mt-2 font-bold text-foreground">Gerileyen soru</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Ayrı takip listesine alınan alan.</p></div></Reveal>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-background px-4 py-16 md:px-6 md:py-24">
          <div className="marketing-container">
            <Reveal>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Niyet düzeyindeki değişim</p>
                  <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-5xl">Kazanan niyetleri görün, kaybedilenleri saklamayın.</h2>
                </div>
                <p className="max-w-sm text-sm leading-6 text-muted-foreground">Her satır, ilk ve son ölçüm oranını aynı prompt için karşılaştırır.</p>
              </div>
            </Reveal>
            <div className="mt-12 grid gap-4 lg:grid-cols-2">
              {gains.map((item, index) => <Reveal key={item.prompt} delay={index * 0.06}><PromptComparison item={item} /></Reveal>)}
            </div>
            <Reveal delay={0.08}>
              <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <div className="flex gap-3">
                  <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                  <div>
                    <h3 className="font-extrabold text-foreground">İzleme listesi: gerileyen niyetler</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Düğün, gayrimenkul videosu ve kurumsal fotoğrafçılık niyetleri son ölçümde geriledi. Bu alanlar bir sonraki kanıt ve içerik çalışmasının izleme listesinde kalmalı.</p>
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      {watchlist.map((item) => <PromptComparison key={item.prompt} item={item} tone="watch" />)}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="marketing-container px-4 py-16 md:px-6 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,.95fr)_minmax(360px,1.05fr)] lg:items-center">
            <Reveal>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Arama görünürlüğü bağlamı</p>
                <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-4xl">Search Console, atıf sonucunu kanıtlamaz; bağlamı zenginleştirir.</h2>
                <p className="mt-5 text-base leading-7 text-muted-foreground">18 Mayıs–12 Ağustos 2026 tarihleri arasındaki 87 günlük Google Search Console exportu yalnızca <strong>Web</strong> arama türünü kapsar. Bu veri yapay zeka atıf payının nedeni veya sonucu değildir.</p>
                <div className="mt-7 grid gap-3 text-sm">
                  <p className="flex items-center gap-3 font-semibold text-foreground"><FileSearch className="h-4 w-4 text-primary" />Canlı yayın hizmeti: 3.377 gösterim</p>
                  <p className="flex items-center gap-3 font-semibold text-foreground"><FileSearch className="h-4 w-4 text-primary" />Serbest videograf hizmeti: 3.276 gösterim</p>
                  <p className="flex items-center gap-3 font-semibold text-foreground"><FileSearch className="h-4 w-4 text-primary" />Video düzenleme hizmeti: 2.276 gösterim</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <aside className="rounded-3xl border border-border bg-muted p-6">
                <p className="text-sm font-semibold text-foreground">GSC özeti</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  <div className="rounded-2xl border border-border bg-background p-4"><p className="text-xs text-muted-foreground">Toplam gösterim</p><p className="mt-2 font-mono text-3xl text-foreground">44.613</p><p className="mt-1 text-xs text-muted-foreground">87 gün</p></div>
                  <div className="rounded-2xl border border-[#DDE5E4] bg-background p-4"><p className="text-xs text-muted-foreground">Birleşik Krallık payı</p><p className="mt-2 font-mono text-3xl text-foreground">89,1%</p></div>
                  <div className="rounded-2xl border border-[#DDE5E4] bg-background p-4"><p className="text-xs text-muted-foreground">Masaüstü payı</p><p className="mt-2 font-mono text-3xl text-foreground">80,2%</p></div>
                </div>
              </aside>
            </Reveal>
          </div>
        </section>

        <section className="bg-muted px-4 py-16 md:px-6 md:py-24">
          <Reveal className="marketing-container">
            <div className="rounded-3xl bg-ink px-7 py-12 text-center text-white md:px-12">
              <ListChecks className="mx-auto h-6 w-6 text-cyan" />
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-cyan">Vakanın çıkarımı</p>
              <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-extrabold tracking-[-0.04em] md:text-5xl">Atıf payı artabilir; her satın alma niyetinde aynı anda artmayabilir.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300">Düzenli soru takibi, güçlü artışları ve kaybedilen niyet alanlarını aynı ölçüm çerçevesinde görünür kılar. Amaç garanti vermek değil, bir sonraki kanıt üretim kararını daha doğru almaktır.</p>
              <MotionPress className="mt-8 inline-block">
                <Button size="lg" className="bg-cyan text-foreground hover:bg-[#B8F4FF]" asChild>
                  <Link to="/free-ai-readiness-report">Kendi ölçüm çerçeveni oluştur <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
                </Button>
              </MotionPress>
              <p className="mt-6 text-xs text-slate-400">Kaynaklar: kullanıcı tarafından sağlanan prompt takip tablosu ve GSC exportu.</p>
            </div>
          </Reveal>
        </section>
      </article>
    </MarketingShell>
  );
}

function GenericArticle({ article }: { article: Article }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const maximum = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(maximum > 0 ? Math.min(100, Math.round((window.scrollY / maximum) * 100)) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <MarketingShell>
      <article>
        <div className="fixed inset-x-0 top-16 z-40 h-0.5 bg-transparent" aria-hidden="true">
          <div className="h-full bg-[#356AFF] transition-[width] duration-150 motion-reduce:transition-none" style={{ width: `${progress}%` }} />
        </div>
        <header className="border-b border-border bg-background px-4 py-14 md:px-6 md:py-20">
          <div className="mx-auto max-w-3xl">
            <Link to="/makaleler" className="inline-flex items-center gap-1 text-sm font-bold text-primary"><ArrowLeft className="h-4 w-4" /> Tüm makaleler</Link>
            <Badge variant="outline" className="mt-8 border-border bg-background text-primary">{article.category}</Badge>
            <h1 className="mt-5 text-4xl font-extrabold tracking-[-0.045em] text-foreground md:text-6xl">{article.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{article.description}</p>
            <div className="mt-7 flex items-center gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{article.date}</span>
              <span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{article.readingTime}</span>
            </div>
          </div>
        </header>
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-[minmax(0,1fr)_250px]">
          <div className="space-y-12">
            {article.markdown ? (
              <MiniMarkdown content={article.markdown} />
            ) : (
              article.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-foreground md:text-3xl">{section.heading}</h2>
                  {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-5 text-base leading-8 text-muted-foreground">{paragraph}</p>)}
                </section>
              ))
            )}
          </div>
          <aside className="h-fit rounded-2xl border border-border bg-muted p-5">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="mt-4 text-lg font-extrabold text-foreground">Bu kavramı markanızda görün.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Ücretsiz raporla ilk kaynak ve kanıt çerçevenizi çıkarın.</p>
            <Button className="mt-5 w-full" asChild><Link to="/free-ai-readiness-report">Ücretsiz ölçüm</Link></Button>
            <Link to="/platform" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">Platformu inceleyin <SearchCheck className="h-4 w-4" /></Link>
          </aside>
        </div>
      </article>
    </MarketingShell>
  );
}

function ArticleNotFound() {
  return (
    <MarketingShell>
      <section className="marketing-container px-4 py-24 text-center md:px-6">
        <h1 className="text-3xl font-extrabold text-foreground">Makale bulunamadı</h1>
        <p className="mt-4 text-base text-muted-foreground">Aradığınız makale kaldırılmış ya da hiç var olmamış olabilir.</p>
        <Button asChild className="mt-8"><Link to="/makaleler">Tüm makaleleri gör</Link></Button>
      </section>
    </MarketingShell>
  );
}

function ArticleDetailPage() {
  const { slug } = Route.useParams();
  if (slug === "filmfolk-vaka-incelemesi") return <FilmFolkCaseStudy />;
  const article = articles.find((item) => item.slug === slug);
  if (!article) return <ArticleNotFound />;
  return <GenericArticle article={article} />;
}
