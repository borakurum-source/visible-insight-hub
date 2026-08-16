import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/urun")({
  head: () => ({
    meta: [
      { title: "Ürün — 1cite AI Görünürlük Platformu" },
      {
        name: "description",
        content:
          "1cite; ChatGPT, Perplexity ve Gemini yanıtlarında markanızın kaç kez alıntılandığını ölçer, rakiplerle karşılaştırır ve içerik önerileri üretir.",
      },
      { property: "og:title", content: "Ürün — 1cite AI Görünürlük Platformu" },
      {
        property: "og:description",
        content: "AI yanıtlarındaki marka alıntılarınızı ölçün, izleyin ve artırın.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

const modules = [
  {
    title: "Alıntı Takibi",
    body: "Belirlediğiniz sorgu setleri her gün ChatGPT, Perplexity, Gemini ve Copilot üzerinde çalıştırılır; markanızın geçtiği yanıtlar kaydedilir.",
  },
  {
    title: "Rakip Karşılaştırma",
    body: "Aynı sorgularda hangi rakiplerin alıntılandığını, hangi kaynak sayfalar üzerinden geldiklerini görün.",
  },
  {
    title: "Kaynak Analizi",
    body: "Modellerin sizi hangi sayfa, dizin veya üçüncü parti kaynaktan aldığını çıkarın; eksik kaynakları tespit edin.",
  },
  {
    title: "İçerik Önerileri",
    body: "Alıntılanabilir içerik boşluklarını, entity eksiklerini ve şema önerilerini görev listesi olarak alın.",
  },
];

function ProductPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-20">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Ürün</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold sm:text-5xl">
          AI yanıtlarındaki görünürlüğünüz için tek panel
        </h1>
        <p className="mt-5 max-w-2xl text-muted-foreground">
          1cite, arama motoru sıralaması yerine üretken AI yanıtlarında alıntılanma oranınızı ölçer.
        </p>

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {modules.map((m) => (
            <article key={m.title} className="surface-panel rounded-2xl border border-border p-7">
              <h2 className="text-xl font-semibold">{m.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{m.body}</p>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}