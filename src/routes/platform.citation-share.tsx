import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Eye, MessageSquareText, Scale } from "lucide-react";
import { MarketingShell } from "@/components/site/MarketingShell";
import { VisualHero } from "@/components/site/visual-hero";
import { EngineRotator } from "@/components/site/citation-motion";
import heroCitationOrb from "@/assets/landing/hero-citation-orb.webp";

export const Route = createFileRoute("/platform/citation-share")({
  head: () => ({
    meta: [
      { title: "Atıf Payı | OneCite" },
      { name: "description", content: "Yapay zeka cevaplarında markanızın ne kadar sık kaynak olarak seçildiğini soru, atıf ve rakip bağlamıyla ölçün." },
      { property: "og:title", content: "Atıf Payı | OneCite" },
      { property: "og:description", content: "Yapay zeka cevaplarında markanızın kaynak olarak seçilme oranını ölçün." },
    ],
  }),
  component: CitationSharePage,
});

const anatomy = [
  { icon: MessageSquareText, title: "Soru seti", body: "Satın alma niyeti taşıyan, kategori ve marka bağlamı net sorgularla başlarsınız." },
  { icon: Eye, title: "Yanıt kanıtı", body: "Her yanıtta görünürlüğü, konumu, tonu ve seçilen kaynakları görürsünüz." },
  { icon: Scale, title: "Pay hesabı", body: "Markanızın seçilme oranını rakipler, modeller ve zaman içindeki değişimle birlikte okursunuz." },
];

function CitationSharePage() {
  return (
    <MarketingShell>
      <VisualHero
        eyebrow="ATIF PAYI · SORU → KAYNAK → PAY"
        title={<>Yapay zekanın sizi ne kadar sık <span className="text-[#3FBFB2]">kaynak seçtiğini</span> ölçün.</>}
        description="Atıf payı, görünürlükten daha dar ve daha yararlı bir sinyaldir: Yapay zeka cevaplarında markanızın kaynak olarak seçildiği soru payını gösterir."
        image={heroCitationOrb}
        imageAlt="Üç kaynak noktasını birleştiren ışıklı citation ağı taşıyan cam küre"
        visualLabel="CITATION SHARE / 01"
        secondaryHref="/platform/evidence-gaps"
        secondaryLabel="Eksik kanıtları görün"
      >
        <p className="text-sm text-slate-400">Örnek ölçüm yüzeyleri: <EngineRotator className="font-mono text-[#3FBFB2]" /></p>
      </VisualHero>

      <section className="marketing-container px-4 py-16 md:px-6 md:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1B7F86]">Metrik anatomisi</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-[#101211] md:text-5xl">Bir yüzde değil, karar verdiren bir bağlam.</h2>
          <p className="mt-5 text-base leading-7 text-[#6B6A61]">Atıf payı tek başına “iyi” ya da “kötü” değildir. OneCite metrikle birlikte hangi soru, kaynak ve rakip bağlamının sonucu oluşturduğunu gösterir.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {anatomy.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border border-[#E3E0D5] bg-[#FBFAF5] p-6">
              <Icon className="h-5 w-5 text-[#1B7F86]" />
              <h3 className="mt-6 text-lg font-extrabold text-[#101211]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#6B6A61]">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#E3E0D5] bg-[#FBFAF5] px-4 py-16 md:px-6 md:py-24">
        <div className="marketing-container grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1B7F86]">Nasıl okunur?</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-[#101211] md:text-4xl">Kaynak seçimi, rakip varlığı ve niyet aynı tabloda.</h2>
            <p className="mt-5 text-base leading-7 text-[#6B6A61]">Bir yapay zeka cevabında marka adınızın geçmesi yeterli değildir. OneCite, seçilen URL’leri ve kaynak tipini yanıt bağlamıyla birlikte izler.</p>
          </div>
          <div className="rounded-2xl border border-[#E3E0D5] bg-[#F5F3EC] p-5">
            <div className="flex items-center justify-between border-b border-[#E3E0D5] pb-4"><span className="font-mono text-xs text-[#1B7F86]">PROMPT-18</span><span className="text-xs font-bold text-emerald-700">Atıflandı</span></div>
            <p className="mt-5 font-mono text-sm leading-6 text-[#101211]">“B2B ürün lansmanı için video prodüksiyon ajansı nasıl seçilir?”</p>
            <div className="mt-5 space-y-3">
              <div className="rounded-xl bg-[#FBFAF5] p-3 text-sm"><span className="text-[#6B6A61]">Seçilen kaynak</span><p className="mt-1 font-semibold text-[#101211]">FilmFolk — vaka çalışması</p></div>
              <div className="rounded-xl bg-[#FBFAF5] p-3 text-sm"><span className="text-[#6B6A61]">Rakip kaynak</span><p className="mt-1 font-semibold text-[#101211]">Üçüncü taraf “en iyi ajanslar” listesi</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-container px-4 py-16 md:px-6 md:py-24">
        <div className="rounded-3xl bg-[#EDEFE9] p-8 md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1B7F86]">Sinyalden aksiyona</p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-[#101211] md:text-4xl">Sadece takip etmeyin; hangi atıf payı artışının gerçek büyüme potansiyeli taşıdığını anlayın.</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#57564E]">Atıf payı düştüğünde soru “hangi içerik yazılmalı?” değildir. Önce Yapay zekanın hangi kanıtı seçtiği veya görmediği belirlenir; aksiyon bunun ardından gelir.</p>
            </div>
            <div className="space-y-3">
              {["Soru bazında ölçüm", "Görünür atıf kanıtı", "Önceliklendirilmiş eksik kanıt"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-[#E3E0D5] bg-[#FBFAF5] p-4 text-sm font-bold text-[#101211]"><CheckCircle2 className="h-5 w-5 text-[#1B7F86]" />{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
