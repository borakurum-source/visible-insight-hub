import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, FileSearch, Network, ShieldCheck } from "lucide-react";
import { MarketingShell } from "@/components/site/MarketingShell";
import { VisualHero } from "@/components/site/visual-hero";
import { PublicReportAnalyzer } from "@/components/site/public-report-analyzer";
import heroSignalAction from "@/assets/landing/hero-signal-action.webp";

export const Route = createFileRoute("/free-ai-readiness-report")({
  head: () => ({
    meta: [
      { title: "Ücretsiz Yapay Zeka Hazırlık Raporu | OneCite" },
      { name: "description", content: "Web siteniz için ücretsiz yapay zeka hazırlık ölçümü başlatın; kanıt, kaynak bağlamı ve öncelikli uygulamaları görün." },
      { property: "og:title", content: "Ücretsiz Yapay Zeka Hazırlık Raporu | OneCite" },
      { property: "og:description", content: "Herkese açık web sinyalleriyle ilk yapay zeka hazırlık çerçevenizi çıkarın." },
      { property: "og:url", content: "https://1cite.com/free-ai-readiness-report" },
    ],
    links: [{ rel: "canonical", href: "https://1cite.com/free-ai-readiness-report" }],
  }),
  component: FreeReportPage,
});

const outputs = [
  { icon: FileSearch, title: "Yapay zeka hazırlık özeti", body: "Herkese açık web varlığınızdan ilk yapısal ve kanıt sinyallerini çıkarın." },
  { icon: Network, title: "Atıf bağlamı", body: "Marka, kaynak ve yapay zeka yanıtlarında etkili olabilecek bağlamın ilk görünümünü alın." },
  { icon: ShieldCheck, title: "Öncelikli sonraki adımlar", body: "Her düzeltmeyi değil, en yüksek etkili kanıt alanını önce görün." },
];

function FreeReportPage() {
  return (
    <MarketingShell>
      <VisualHero
        eyebrow="FREE READINESS REPORT · PUBLIC WEB SIGNALS"
        title={<>Markanızın yapay zeka cevaplarında nerede durduğunu <span className="text-cyan">ölçerek başlayın.</span></>}
        description="Web sitenizi girin. OneCite, herkese açık sinyaller üzerinden yapay zeka hazırlık durumunuzun ilk çerçevesini çıkarır."
        image={heroSignalAction}
        imageAlt="Üç ışıklı yolun şeffaf bir prizma içinde tek kaynak noktasında birleşmesi"
        visualLabel="READINESS / 04"
        primaryLabel="Ücretsiz raporu başlat"
      >
        <div className="max-w-xl rounded-2xl border border-white/15 bg-background/[0.08] p-4 backdrop-blur-md md:p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><CheckCircle2 className="h-4 w-4 text-cyan" /> Ücretsiz ölçümünüzü başlatın</div>
          <div className="[&_button]:border-white [&_button]:bg-background [&_button]:text-foreground [&_button]:hover:bg-[#E9F9FD] [&_input]:border-white/20 [&_input]:bg-background [&_input]:text-foreground [&_input]:placeholder:text-muted-foreground">
            <PublicReportAnalyzer />
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-400">Kredi kartı gerekmez. İlk ölçüm yalnızca herkese açık web verilerini kullanır.</p>
        </div>
      </VisualHero>

      <section className="marketing-container px-4 py-16 md:px-6 md:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Raporun içinden</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-5xl">Bir skor değil, neyi incelemeniz gerektiğini gösteren başlangıç noktası.</h2>
          <p className="mt-5 text-base leading-7 text-muted-foreground">Ücretsiz rapor, tam platform analizi yerine ilk doğrulanabilir çerçeveyi sunar. Düzenli takip için soru, kaynak ve eksik kanıt çalışma alanına geçebilirsiniz.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {outputs.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border border-border bg-background p-6">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-6 text-lg font-extrabold text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-background px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Doğru beklenti</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-4xl">Bu bir görünürlük garantisi değildir.</h2>
          <p className="mt-5 text-base leading-7 text-muted-foreground">Yapay zeka yanıtları model, zaman, soru bağlamı ve web kaynaklarıyla değişebilir. OneCite’ın rolü belirsizliği gizlemek değil; ölçülebilir kanıt ve uygulama alanını görünür kılmaktır.</p>
        </div>
      </section>
    </MarketingShell>
  );
}
