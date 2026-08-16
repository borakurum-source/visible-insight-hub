import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, BriefcaseBusiness, FileOutput, Layers3, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingShell } from "@/components/site/MarketingShell";
import { MarketingCta } from "@/components/site/marketing-cta";
import { VisualHero } from "@/components/site/visual-hero";
import heroCitationOrb from "@/assets/landing/hero-citation-orb.webp";

export const Route = createFileRoute("/solutions/agencies")({
  head: () => ({
    meta: [
      { title: "Ajanslar için OneCite | Paylaşılabilir atıf zekası" },
      { name: "description", content: "Ajanslar için müşteri bazlı yapay zeka atıf ölçümü, eksik kanıt analizi ve paylaşılabilir GEO raporlama iş akışı." },
      { property: "og:title", content: "Ajanslar için OneCite | Paylaşılabilir atıf zekası" },
      { property: "og:description", content: "Müşteri bazlı ölçüm, eksik kanıt ve GEO iş akışını tek platformda yönetin." },
      { property: "og:url", content: "https://1cite.com/solutions/agencies" },
    ],
    links: [{ rel: "canonical", href: "https://1cite.com/solutions/agencies" }],
  }),
  component: AgenciesPage,
});

const workflow = [
  { icon: Layers3, step: "01", title: "Her müşteri için ölçüm kapsamı", body: "Marka, rakip, soru seti ve hedef pazarları müşteri bazında düzenleyin." },
  { icon: BarChart3, step: "02", title: "Sinyali açıklanabilir rapora çevirin", body: "Atıf payının arkasındaki kaynak ve eksik kanıt bağlamını müşteriye taşıyın." },
  { icon: BriefcaseBusiness, step: "03", title: "GEO işini önceliklendirin", body: "Kısa vadeli içerik üretimi ile uzun vadeli otorite varlıklarını tek iş listesinde yönetin." },
];
const outcomes = ["Müşteri bazında soru ve rakip bağlamı", "Paylaşılabilir atıf kanıtı", "İçerik, halkla ilişkiler ve teknik GEO için tek öncelik listesi"];

function AgenciesPage() {
  return (
    <MarketingShell>
      <VisualHero
        eyebrow="AJANSLAR · SHAREABLE EVIDENCE"
        title={<>Müşterinize yalnızca rapor değil, <span className="text-cyan">açıklanabilir yapay zeka görünürlüğü kanıtı</span> götürün.</>}
        description="OneCite, soru ölçümünü kaynak analizi ve eksik kanıtlarla birleştirir. Böylece GEO öneriniz “içerik üretelim” seviyesinde kalmaz."
        image={heroCitationOrb}
        imageAlt="Citation ağı taşıyan cam küre; ajanslar için paylaşılabilir kanıt metaforu"
        visualLabel="AJANS KANIT KATMANI"
        secondaryLabel="Ajans planını incele"
        secondaryHref="/fiyatlandirma"
      >
        <p className="text-sm text-slate-400">Her müşteride aynı kanıt zinciri, farklı bağlam.</p>
      </VisualHero>

      <section className="marketing-container px-4 py-16 md:px-6 md:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Ajans çalışma döngüsü</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-5xl">GEO hizmetini teslim çıktısı değil, ölçülebilir büyüme ritmi yapın.</h2>
          <p className="mt-5 text-base leading-7 text-muted-foreground">Her müşterinin alıcısı, kategorisi, rakibi ve eksik kanıt farklıdır. OneCite aynı iş akışını tekrar edilebilir, ancak her müşteri için bağlama duyarlı hale getirir.</p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {workflow.map(({ icon: Icon, step, title, body }) => (
            <article key={step} className="rounded-2xl border border-border bg-background p-6">
              <span className="font-mono text-sm text-primary">{step}</span>
              <Icon className="mt-8 h-5 w-5 text-foreground" />
              <h3 className="mt-5 text-xl font-extrabold text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-background px-4 py-16 md:px-6 md:py-24">
        <div className="marketing-container grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Müşteri görüşmesi</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-4xl">“Neden görünmüyoruz?” sorusuna somut cevap verin.</h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">Marka anılması ile kaynak olarak seçilme arasındaki farkı, rakibin neden seçildiğini ve hangi varlığın eksik kaldığını aynı müşteri görüşmesinde gösterin.</p>
          </div>
          <div className="rounded-2xl bg-secondary p-6">
            <div className="flex items-center gap-3"><UsersRound className="h-5 w-5 text-primary" /><p className="font-bold text-foreground">Müşteri raporunun üç çıktısı</p></div>
            <div className="mt-6 space-y-3">
              {outcomes.map((outcome) => (
                <div key={outcome} className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 text-sm font-semibold text-foreground"><FileOutput className="h-4 w-4 text-primary" />{outcome}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <MarketingCta
        title="Bir müşteri ile başlayın, kanıta dayalı GEO iş akışını görün."
        description="İlk ücretsiz ölçüm, gerçek müşteri verisiyle nasıl bir rapor ve uygulama sistemi kurabileceğinizi gösterir."
      />
    </MarketingShell>
  );
}
