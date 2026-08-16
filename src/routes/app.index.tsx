import { createFileRoute } from "@tanstack/react-router";
import { PanelHeader } from "@/components/app/PanelHeader";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Panel — 1cite" },
      { name: "description", content: "1cite AI görünürlük paneli genel bakış ekranı." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

const stats = [
  { label: "Alıntı Payı", value: "%18,4", delta: "+2,1 pt" },
  { label: "Takip Edilen Sorgu", value: "128", delta: "+12" },
  { label: "Alıntılanan Sayfa", value: "37", delta: "+5" },
  { label: "Ortalama Sıra", value: "2,6", delta: "-0,4" },
];

const rows = [
  { q: "en iyi ai görünürlük aracı", model: "ChatGPT", cited: true, source: "1cite.com/urun" },
  { q: "geo nedir", model: "Perplexity", cited: true, source: "1cite.com/blog/geo" },
  { q: "rag signal nasıl ölçülür", model: "Gemini", cited: false, source: "—" },
  { q: "ai arama optimizasyonu ajansı", model: "ChatGPT", cited: false, source: "—" },
];

function Dashboard() {
  return (
    <>
      <PanelHeader title="Genel Bakış" />
      <main className="flex-1 space-y-8 p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="surface-panel rounded-2xl border border-border p-5">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-3 font-display text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-primary">{s.delta} son 30 gün</p>
            </div>
          ))}
        </div>

        <section className="surface-panel overflow-hidden rounded-2xl border border-border">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold">Son tarama sonuçları</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Sorgu</th>
                <th className="px-6 py-3 font-medium">Model</th>
                <th className="px-6 py-3 font-medium">Durum</th>
                <th className="px-6 py-3 font-medium">Kaynak</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.q} className="border-t border-border/70">
                  <td className="px-6 py-4">{r.q}</td>
                  <td className="px-6 py-4 text-muted-foreground">{r.model}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        r.cited
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {r.cited ? "Alıntılandı" : "Alıntılanmadı"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{r.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </>
  );
}