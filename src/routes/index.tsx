import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bot, LineChart, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "1cite — AI Yanıtlarında Marka Görünürlüğü" },
      {
        name: "description",
        content:
          "1cite, ChatGPT ve Perplexity gibi AI asistanlarının yanıtlarında markanızın ne sıklıkla alıntılandığını ölçer ve görünürlüğünüzü artıracak adımları verir.",
      },
      { property: "og:title", content: "1cite — AI Yanıtlarında Marka Görünürlüğü" },
      {
        property: "og:description",
        content: "AI asistanlarının yanıtlarındaki alıntılarınızı ölçün ve artırın.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const highlights = [
  {
    icon: Bot,
    title: "Model kapsamı",
    body: "ChatGPT, Perplexity, Gemini ve Copilot yanıtları aynı sorgu seti üzerinden düzenli taranır.",
  },
  {
    icon: LineChart,
    title: "Alıntı payı metriği",
    body: "Kategori sorgularında rakiplerinize kıyasla alıntılanma payınızı tek skorla izleyin.",
  },
  {
    icon: Sparkles,
    title: "Aksiyon listesi",
    body: "Eksik entity, kaynak ve şema önerilerini doğrudan uygulanabilir görevler olarak alın.",
  },
];

function Index() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="hero-glow border-b border-border/60">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
              Generative Engine Optimization
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.08] sm:text-6xl">
              AI size ne zaman referans veriyor?
              <span className="block text-primary">1cite ölçer.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Arama sıralaması artık tek başına yeterli değil. Markanızın üretken AI yanıtlarında
              kaç kez alıntılandığını izleyin, rakiplerinizle karşılaştırın ve boşlukları kapatın.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/app">
                  Panele git <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="subtle" size="xl">
                <Link to="/urun">Ürünü keşfet</Link>
              </Button>
            </div>

            <dl className="mt-16 grid max-w-2xl grid-cols-2 gap-8 sm:grid-cols-3">
              {[
                ["4", "AI modeli"],
                ["Günlük", "tarama sıklığı"],
                ["%100", "kaynak izlenebilirliği"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="font-display text-3xl">{v}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-3xl font-semibold sm:text-4xl">Neyi ölçüyoruz?</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {highlights.map((h) => (
              <article key={h.title} className="surface-panel rounded-2xl border border-border p-7">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <h.icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{h.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{h.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-border/60">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-20 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Görünürlüğünüzü bugün ölçmeye başlayın</h2>
              <p className="mt-2 text-muted-foreground">
                Kurulum 5 dakika; ilk raporunuz aynı gün hazır.
              </p>
            </div>
            <Button asChild variant="accent" size="xl">
              <Link to="/fiyatlandirma">Paketleri gör</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
