import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CircleDotDashed, ExternalLink, Network, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingShell } from "@/components/site/MarketingShell";
import { VisualHero } from "@/components/site/visual-hero";
import BrandLogo from "@/components/site/BrandLogo";
import heroCitationOrb from "@/assets/landing/hero-citation-orb.webp";

export const Route = createFileRoute("/hakkimizda")({
  head: () => ({
    meta: [
      { title: "Hakkımızda | OneCite" },
      { name: "description", content: "OneCite’ın neden kurulduğunu, neyi ölçtüğünü ve yapay zeka cevaplarında görünürlük için nasıl bir kanıt döngüsü kurduğunu keşfedin." },
      { property: "og:title", content: "Hakkımızda | OneCite" },
      { property: "og:description", content: "OneCite’ın kuruluş nedenini ve kanıt zincirini keşfedin." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <MarketingShell>
      <VisualHero
        eyebrow="ONECITE · KURULUŞ NEDENİ"
        title={<>Yapay zeka cevaplarında <span className="text-cyan">kaynak</span> olarak seçilmek, artık ölçülebilir bir problem.</>}
        description="OneCite, markaların yalnızca görünür olup olmadığını değil; hangi soruda, hangi kaynakla ve hangi eksik kanıt yüzünden seçilip seçilmediğini anlamak için kuruldu."
        image={heroCitationOrb}
        imageAlt="Kaynak noktalarını birleştiren ışıklı cam küre; OneCite’ın kanıt ağı metaforu"
        visualLabel="SOURCE SIGNAL / ABOUT"
        primaryHref="/free-ai-readiness-report"
        primaryLabel="İlk ölçümü başlat"
        secondaryHref="#neden"
        secondaryLabel="Neden kurulduğunu gör"
      >
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-background/[0.05] p-3">
          <BrandLogo variant="icon" tone="dark" size="sm" />
          <div><p className="visual-source-label text-cyan">ONECITE / FOUNDER NOTE</p><p className="mt-1 text-sm text-slate-200">Ölçüm, kanıt ve sonraki karar aynı zincirde buluşmalı.</p></div>
        </div>
      </VisualHero>

      <section id="neden" className="marketing-container py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[.86fr_1.14fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Problem</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-5xl">Arama sonucu ile AI cevabı aynı görünürlük değildir.</h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-muted-foreground">
            <p>Google’da iyi sıralanan bir sayfa, bir yapay zeka cevabında otomatik olarak kaynak seçilmez. AI sistemleri sorunun bağlamını, kaynağın güven sinyallerini ve web’deki kanıt ilişkilerini birlikte yorumlar.</p>
            <p>OneCite bu belirsizliği tek bir skorla kapatmaya çalışmaz. Sabit soru seti, pazar, dil ve tekrar bağlamında gözlenen atıf sinyalini; seçilen kaynak ve eksik kanıtla birlikte okur.</p>
            <blockquote className="border-l-2 border-cyan pl-5 text-xl font-semibold leading-8 text-foreground">“Bir markanın AI cevaplarında nerede durduğunu tahmin etmeyin. Soruyu, kaynağı ve eksik kanıtı aynı anda görün.”</blockquote>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-background px-4 py-16 md:px-6 md:py-24">
        <div className="marketing-container">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Nasıl çalışıyoruz?</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-5xl">Görsel merak uyandırır; kanıt güven verir.</h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-border bg-background p-6"><Network className="h-5 w-5 text-primary" /><p className="mt-7 font-mono text-xs text-muted-foreground">01 / CONTEXT</p><h3 className="mt-3 text-xl font-extrabold text-foreground">Bağlamı kur</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Marka, domain, hedef pazar, dil ve satın alma niyetli soruları aynı çalışma çerçevesinde tanımla.</p></article>
            <article className="rounded-2xl border border-border bg-background p-6"><CircleDotDashed className="h-5 w-5 text-cyan" /><p className="mt-7 font-mono text-xs text-muted-foreground">02 / EVIDENCE</p><h3 className="mt-3 text-xl font-extrabold text-foreground">Kaynak sinyalini gör</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">AI cevabında seçilen kaynakları, atıf payını ve görünürlüğü kesen evidence gap’leri ilişkilendir.</p></article>
            <article className="rounded-2xl border border-border bg-background p-6"><Sparkles className="h-5 w-5 text-primary" /><p className="mt-7 font-mono text-xs text-muted-foreground">03 / ACTION</p><h3 className="mt-3 text-xl font-extrabold text-foreground">Sonraki kararı seç</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Eksik kanıtı içerik, kaynak veya ölçüm aksiyonuna çevir; sonucu aynı soru bağlamında yeniden izle.</p></article>
          </div>
        </div>
      </section>

      <section className="marketing-container py-16 md:py-24">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div className="rounded-3xl bg-ink p-7 text-white md:p-10">
            <p className="visual-source-label text-cyan">MEASUREMENT BOUNDARY</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] md:text-4xl">OneCite görünürlük garantisi vermez; gözlenen sinyali karar verilebilir hale getirir.</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">AI cevapları model, zaman, prompt, pazar, dil ve web kaynaklarına göre değişebilir. Sonuçlar sabit ölçüm seti ve bağlamı içinde yorumlanır. Bu sınır, ürünün zayıflığı değil; ölçümün dürüstlük koşuludur.</p>
            <div className="mt-7 flex items-center gap-3 text-sm text-slate-200"><ShieldCheck className="h-5 w-5 text-cyan" />Kaynak ve metodoloji sınırlarını görünür tutarız.</div>
          </div>
          <div className="rounded-3xl border border-border bg-background p-7 md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Kurucu</p>
            <h2 className="mt-4 text-3xl font-extrabold text-foreground">Bora Kurum</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">OneCite, AI görünürlüğünü yalnızca bir pazarlama iddiası olarak değil, soru ve kaynak düzeyinde izlenebilir bir çalışma alanı olarak ele alma ihtiyacından doğdu.</p>
            <a href="https://borakurum.com" target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-foreground">Kurucu hikâyesini incele <ExternalLink className="h-4 w-4" /></a>
          </div>
        </div>
      </section>

      <section className="bg-muted px-4 py-16 text-center md:px-6 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Başlangıç</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-5xl">Markanızın AI cevaplarında nerede durduğunu birlikte görün.</h2>
        <Button asChild size="lg" className="mt-8"><Link to="/free-ai-readiness-report">Ücretsiz ölçüm başlat <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
      </section>
    </MarketingShell>
  );
}
