import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpenCheck, FileStack, Network, Quote, SearchCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingShell } from "@/components/site/MarketingShell";
import { MarketingCta } from "@/components/site/marketing-cta";
import { VisualHero } from "@/components/site/visual-hero";
import heroEvidenceGap from "@/assets/landing/hero-evidence-gap.webp";
import shotContent from "@/assets/landing/shot-content.webp";

export const Route = createFileRoute("/platform/evidence-gaps")({
  head: () => ({
    meta: [
      { title: "Eksik Kanıtlar | OneCite" },
      { name: "description", content: "Yapay zekanın markanıza güvenmek için hangi bilgi, kaynak ve ilişkileri bulamadığını görün." },
      { property: "og:title", content: "Eksik Kanıtlar | OneCite" },
      { property: "og:description", content: "Yapay zekanın seçim kararında eksik kalan kanıtı ve önceliklendirilmiş uygulamayı görün." },
      { property: "og:url", content: "https://1cite.com/platform/evidence-gaps" },
    ],
    links: [{ rel: "canonical", href: "https://1cite.com/platform/evidence-gaps" }],
  }),
  component: EvidenceGapsPage,
});

const gaps = [
  { icon: Quote, title: "Eksik karar kanıtı", body: "Yapay zeka hizmetinizi anlatan sayfaları bulur; ancak alıcının güveneceği sonuç, karşılaştırma veya vaka kanıtını bulamaz." },
  { icon: Network, title: "Kopuk varlık bağlamı", body: "Hizmet, sektör, lokasyon ve uzmanlık ilişkileri insanlar için görünürdür; ancak modellerin kullanacağı kadar bağlı değildir." },
  { icon: BookOpenCheck, title: "Dağınık otorite sinyali", body: "Yapay zeka kategori bilgisini markanın kendi kaynakları yerine sürekli üçüncü taraf listelerinden, incelemelerden veya rakip sayfalardan öğrenir." },
];

const actions = [
  { icon: FileStack, title: "Karşılaştırma içeriği", body: "Eksik değerlendirme kriterini ve kategori bağlamını görünür kılar." },
  { icon: SearchCheck, title: "Otorite kaynağı", body: "Vaka çalışması, yöntem sayfası veya veri odaklı rehber ile karar kanıtı üretir." },
  { icon: Network, title: "Varlık bağını güçlendirme", body: "Dağınık hizmet, konu ve kaynak sinyallerini sağlam bir yapı içinde birleştirir." },
];

function EvidenceGapsPage() {
  return (
    <MarketingShell>
      <VisualHero
        eyebrow="EVIDENCE GAP · MISSING SOURCE"
        title={<>Yapay zekanın sizi güvenle önermesi için <span className="text-cyan">hangi kanıtların eksik olduğunu</span> görün.</>}
        description="Eksik kanıt, bir modelin güvenle önermek için ihtiyaç duyduğu fakat sitenizde bulamadığı bilgi, kaynak veya bağlantıdır. OneCite bu eksikleri soru ve kaynak bağlamıyla görünür kılar."
        image={heroEvidenceGap}
        imageAlt="Bir parçası eksik olan ışıklı cam köprü; evidence gap kavramının görsel metaforu"
        visualLabel="EVIDENCE GAP / 02"
        secondaryHref="/platform/citation-share"
        secondaryLabel="Atıf payını incele"
      >
        <p className="text-sm text-slate-400">Soru → atıf → eksik kanıt → uygulama</p>
      </VisualHero>

      <section className="marketing-container py-16 md:py-24">
        <div className="marketing-copy">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Neyi arıyoruz?</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-5xl">Bir içerik listesi değil, seçim kararındaki eksik halka.</h2>
          <p className="mt-5 text-base leading-7 text-muted-foreground">OneCite her fırsatı aynı önemde ele almaz. Yapay zekanın seçim sürecini değiştirebilecek kanıtı, mevcut kaynaklar ve rakip bağlamıyla ilişkilendirir.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {gaps.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border border-border bg-background p-6">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-6 text-lg font-extrabold text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-background px-4 py-16 md:px-6 md:py-24">
        <div className="marketing-container grid min-w-0 items-center gap-12 lg:grid-cols-[minmax(0,.85fr)_minmax(360px,1.15fr)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Uygulama ekranı</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-4xl">Eksik kanıtı kısa bir iş listesine değil, ölçülebilir bir değişime çevirin.</h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">Öneri; hangi soru, hangi kaynak ve hangi eksik bağlamdan geldiğini kaybetmeden içerik fırsatı olarak izlenir.</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-secondary">
            <img src={shotContent} alt="OneCite içerik fırsatları ve eksik kanıt uygulamaları" className="h-auto w-full" />
          </div>
        </div>
      </section>

      <MarketingCta
        title="Önce hangi kanıtın eksik olduğunu görün."
        description="Ücretsiz ölçüm, herkese açık site verisiyle ilk atıf ve eksik kanıt çerçevenizi oluşturur."
      />
    </MarketingShell>
  );
}
