import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, FileCheck2, Goal, Network, SearchCheck } from "lucide-react";
import { MarketingShell } from "@/components/site/MarketingShell";
import { VisualHero } from "@/components/site/visual-hero";
import { EngineRotator } from "@/components/site/citation-motion";
import heroSignalAction from "@/assets/landing/hero-signal-action.webp";
import shotMetrics from "@/assets/landing/shot-metrics.webp";

export const Route = createFileRoute("/platform/")({
  head: () => ({
    meta: [
      { title: "OneCite Platformu | Kaynak, Sinyal, Uygulama" },
      { name: "description", content: "OneCite ile marka kanıtınızı, yapay zeka atıf sinyalini ve öncelikli GEO uygulamalarını tek platformda yönetin." },
      { property: "og:title", content: "OneCite Platformu | Kaynak, Sinyal, Uygulama" },
      { property: "og:description", content: "Marka kanıtınızı, atıf sinyalini ve öncelikli GEO uygulamalarını tek çalışma döngüsünde birleştirin." },
    ],
  }),
  component: PlatformPage,
});

const steps = [
  { icon: Network, number: "01", label: "Kaynak", title: "Marka kanıtınızı modelleyin", body: "Sitenizdeki hizmetleri, varlıkları, kaynakları, SSS’lerinizi ve güven sinyallerinizi ölçümün referans katmanına dönüştürün." },
  { icon: BarChart3, number: "02", label: "Sinyal", title: "Yapay zeka seçimlerini okuyun", body: "Satın alma niyetli sorularda hangi modelin sizi, rakibinizi veya üçüncü taraf kaynağı seçtiğini görün." },
  { icon: Goal, number: "03", label: "Uygulama", title: "Doğru kanıtı önce üretin", body: "Eksik kanıtı içerik, vaka çalışması, üçüncü taraf otorite veya teknik iyileştirme uygulamasına bağlayın." },
];

const modules = [
  { icon: SearchCheck, title: "Atıf Payı", body: "Soru bazında kaynak olarak seçilme oranınızı ve değişim trendini izleyin.", href: "/platform/citation-share" },
  { icon: FileCheck2, title: "Eksik Kanıtlar", body: "Yapay zekanın güvenmek için hangi bilgi, kaynak veya içerik türünü bulamadığını görün.", href: "/platform/evidence-gaps" },
  { icon: Network, title: "Bilgi Grafiği", body: "Hizmet, konu, lokasyon, rakip ve kaynak bağlarının nerede zayıf kaldığını haritalayın.", href: "/platform/evidence-gaps" },
];

function PlatformPage() {
  return (
    <MarketingShell>
      <VisualHero
        eyebrow="ONECITE PLATFORMU · SOURCE → SIGNAL → ACTION"
        title={<>Yapay zeka görünürlüğünüzü <span className="text-cyan">yönetilebilir bir kanıt sistemine</span> dönüştürün.</>}
        description="OneCite, marka kaynaklarınızı, yapay zeka cevaplarındaki seçim sinyalini ve en yüksek etkili içeriği aynı çalışma döngüsünde birleştirir."
        image={heroSignalAction}
        imageAlt="Üç ışıklı yolun şeffaf bir prizma içinde tek kaynak noktasında birleşmesi"
        visualLabel="SOURCE / SIGNAL / ACTION"
        secondaryHref="/platform/citation-share"
        secondaryLabel="Atıf payını incele"
      >
        <p className="text-sm text-slate-400">Ölçülen yüzeyler: <EngineRotator className="font-mono text-cyan" /></p>
      </VisualHero>

      <section className="marketing-container px-4 py-16 md:px-6 md:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Çalışma modeli</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-5xl">Kaynak → Sinyal → Uygulama.</h2>
          <p className="mt-5 text-base leading-7 text-muted-foreground">OneCite; panelden daha fazlasını verir. Yapay zekanın seçebileceği kanıtı kurar, seçim davranışını ölçer ve sonucu uygulanabilir iş listesine çevirir.</p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {steps.map(({ icon: Icon, number, label, title, body }) => (
            <article key={number} className="rounded-2xl border border-border bg-background p-6">
              <div className="flex items-center justify-between"><span className="font-mono text-sm text-primary">{number}</span><Icon className="h-5 w-5 text-foreground" /></div>
              <p className="mt-9 text-xs font-semibold uppercase tracking-[0.13em] text-muted-foreground">{label}</p>
              <h3 className="mt-3 text-xl font-extrabold text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-background px-4 py-16 md:px-6 md:py-24">
        <div className="marketing-container grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Üründen kanıt</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-4xl">Skorun arkasındaki soruyu, kaynak seçimini ve değişimi görün.</h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">Bir metrik tek başına karar verdirmez. OneCite, skoru etkileyen soruları, kaynak tiplerini ve rakip bağlamını birlikte sunar.</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-secondary">
            <img src={shotMetrics} alt="OneCite atıf payı ve kaynak trendi paneli" className="h-auto w-full" />
          </div>
        </div>
      </section>

      <section className="marketing-container px-4 py-16 md:px-6 md:py-24">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Platform modülleri</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-4xl">Her sinyalin yanında açıklanabilir bir sonraki adım.</h2>
          </div>
          <Link to="/free-ai-readiness-report" className="text-sm font-bold text-primary hover:text-foreground">Kendi markanızla deneyin →</Link>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {modules.map(({ icon: Icon, title, body, href }) => (
            <Link to={href} key={title} className="group rounded-2xl border border-border bg-background p-6 transition-transform hover:-translate-y-1">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-6 text-lg font-extrabold text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
              <span className="mt-6 inline-flex items-center text-sm font-bold text-primary">Detayı görün <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
