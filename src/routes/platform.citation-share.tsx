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
        title={<>Yapay zekanın sizi ne kadar sık <span className="text-[#35E1FF]">kaynak seçtiğini</span> ölçün.</>}
        description="Atıf payı, görünürlükten daha dar ve daha yararlı bir sinyaldir: Yapay zeka cevaplarında markanızın kaynak olarak seçildiği soru payını gösterir."
        image={heroCitationOrb}
        imageAlt="Üç kaynak noktasını birleştiren ışıklı citation ağı taşıyan cam küre"
        visualLabel="CITATION SHARE / 01"
        secondaryHref="/platform/evidence-gaps"
        secondaryLabel="Eksik kanıtları görün"
      >
        <p className="text-sm text-slate-400">Örnek ölçüm yüzeyleri: <EngineRotator className="font-mono text-[#35E1FF]" /></p>
      </VisualHero>

      <section className="marketing-container px-4 py-16 md:px-6 md:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#356AFF]">Metrik anatomisi</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-[#0B1020] md:text-5xl">Bir yüzde değil, karar verdiren bir bağlam.</h2>
          <p className="mt-5 text-base leading-7 text-[#667085]">Atıf payı tek başına “iyi” ya da “kötü” değildir. OneCite metrikle birlikte hangi soru, kaynak ve rakip bağlamının sonucu oluşturduğunu gösterir.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {anatomy.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border border-[#E6EAF2] bg-[#F7F9FC] p-6">
              <Icon className="h-5 w-5 text-[#356AFF]" />
              <h3 className="mt-6 text-lg font-extrabold text-[#0B1020]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#667085]">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#E6EAF2] bg-[#F7F9FC] px-4 py-16 md:px-6 md:py-24">
        <div className="marketing-container grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#356AFF]">Nasıl okunur?</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-[#0B1020] md:text-4xl">Kaynak seçimi, rakip varlığı ve niyet aynı tabloda.</h2>
            <p className="mt-5 text-base leading-7 text-[#667085]">Bir yapay zeka cevabında marka adınızın geçmesi yeterli değildir. OneCite, seçilen URL’leri ve kaynak tipini yanıt bağlamıyla birlikte izler.</p>
          </div>
          <div className="rounded-2xl border border-[#E6EAF2] bg-[#EEF2F9] p-5">
            <div className="flex items-center justify-between border-b border-[#E6EAF2] pb-4"><span className="font-mono text-xs text-[#356AFF]">PROMPT-18</span><span className="text-xs font-bold text-emerald-700">Atıflandı</span></div>
            <p className="mt-5 font-mono text-sm leading-6 text-[#0B1020]">“B2B ürün lansmanı için video prodüksiyon ajansı nasıl seçilir?”</p>
            <div className="mt-5 space-y-3">
              <div className="rounded-xl bg-[#F7F9FC] p-3 text-sm"><span className="text-[#667085]">Seçilen kaynak</span><p className="mt-1 font-semibold text-[#0B1020]">FilmFolk — vaka çalışması</p></div>
              <div className="rounded-xl bg-[#F7F9FC] p-3 text-sm"><span className="text-[#667085]">Rakip kaynak</span><p className="mt-1 font-semibold text-[#0B1020]">Üçüncü taraf “en iyi ajanslar” listesi</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-container px-4 py-16 md:px-6 md:py-24">
        <div className="rounded-3xl bg-[#EDEFE9] p-8 md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#356AFF]">Sinyalden aksiyona</p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-[#0B1020] md:text-4xl">Sadece takip etmeyin; hangi atıf payı artışının gerçek büyüme potansiyeli taşıdığını anlayın.</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#57564E]">Atıf payı düştüğünde soru “hangi içerik yazılmalı?” değildir. Önce Yapay zekanın hangi kanıtı seçtiği veya görmediği belirlenir; aksiyon bunun ardından gelir.</p>
            </div>
            <div className="space-y-3">
              {["Soru bazında ölçüm", "Görünür atıf kanıtı", "Önceliklendirilmiş eksik kanıt"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-[#E6EAF2] bg-[#F7F9FC] p-4 text-sm font-bold text-[#0B1020]"><CheckCircle2 className="h-5 w-5 text-[#356AFF]" />{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
