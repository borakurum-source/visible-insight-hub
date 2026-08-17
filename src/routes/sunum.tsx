import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import BrandLogo from "@/components/site/BrandLogo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sunum")({
  head: () => ({
    meta: [
      { title: "OneCite Sunum | Görünürlük ve Kanıt" },
      { name: "description", content: "OneCite'ın yapay zeka AI Citation Intelligence vizyonunu, ölçüm yaklaşımını ve FilmFolk vaka özetini slayt formatında keşfedin." },
      { property: "og:title", content: "OneCite Sunum | Görünürlük ve Kanıt" },
      { property: "og:description", content: "OneCite'ın kısa sunumunu keşfedin: ölçüm, kanıt ve aksiyon." },
      { property: "og:url", content: "https://1cite.com/sunum" },
    ],
    links: [{ rel: "canonical", href: "https://1cite.com/sunum" }],
  }),
  component: PresentationPage,
});

type Slide = { eyebrow: string; title: string; accent?: string; body: string; points: string[]; label: string };

const slides: Slide[] = [
  { eyebrow: "AI CITATION INTELLIGENCE", title: "Görünürlük ve kanıt.", accent: "OneCite", body: "Markanızın yapay zeka cevaplarında nerede kaynak olarak seçildiğini ölçün. Eksik kanıtı görün. Bir sonraki aksiyonu netleştirin.", points: ["ÖL", "KANITLA", "AKSİYON AL"], label: "01 / 08" },
  { eyebrow: "YENİ KEŞİF YÜZEYİ", title: "İnsanlar artık yalnızca Google’da aramıyor.", body: "Potansiyel müşteriler sorularını AI destekli arama ve cevap yüzeylerine taşıyor. Bu sistemler markaları yalnızca sıralamıyor; bağlam içinde öneriyor, karşılaştırıyor ve kaynak gösteriyor.", points: ["Arama", "Soru", "Seçilme"], label: "02 / 08" },
  { eyebrow: "PROBLEM", title: "Markanızın AI cevaplarında nerede durduğunu tahmin etmeyin.", body: "Doğru bilgiler web’de bulunuyor mu? AI sistemleri markayı hangi sorularda öneriyor? Hangi kaynaklar seçiliyor? Hangi kritik kanıtlar eksik?", points: ["Belirsizlik", "Ölçüm", "Karar"], label: "03 / 08" },
  { eyebrow: "PLATFORM", title: "OneCite, AI Citation Intelligence platformudur.", body: "Markaların yapay zeka cevaplarında ne kadar görünür olduğunu, hangi kaynaklarla desteklendiğini ve görünürlüğü artırmak için hangi kanıtların üretilmesi gerektiğini ölçmeye yardımcı olur.", points: ["Ölç", "Anla", "Kanıtla", "Aksiyon al"], label: "04 / 08" },
  { eyebrow: "SİNYAL → KANIT → AKSİYON", title: "Ölçüm, doğru sorularla başlar.", body: "Bağlamı kur, kaynakları tara, Marka Zekası’nı oluştur, satın alma niyetli soruları seç, ölç ve eksik kanıtı bir sonraki uygulamaya dönüştür.", points: ["Bağlam", "Kaynak", "Zeka", "Ölçüm", "Aksiyon"], label: "05 / 08" },
  { eyebrow: "İLK KULLANICI AKIŞI", title: "İlk kullanıcıyı keşif ekranlarında kaybetmeden ilk ölçüme götürürüz.", body: "Kullanıcı ilk oturumda tüm modülleri öğrenmek zorunda kalmaz; önce doğru bağlamı kurar, ilk güvenilir ölçümü alır ve sonraki karara döner.", points: ["Domain ekle", "Pazar ve dil", "Kaynağı tara", "Prompt seç", "İlk ölçüm"], label: "06 / 08" },
  { eyebrow: "ÖRNEK VAKA · FILMFOLK", title: "41 satın alma niyetli soruda gözlenen değişim.", body: "Aynı soru havuzundaki 286 ölçüm tekrarı, ilk ve son gözlem arasındaki AI kaynak payı değişimini görünür kıldı. Bu bir nedensellik veya performans garantisi değildir.", points: ["30,7% ilk AI kaynak payı", "58,9% son AI kaynak payı", "+28,1 puan net değişim"], label: "07 / 08" },
  { eyebrow: "BAŞLANGIÇ", title: "Markanızın ilk ölçümünü birlikte kuralım.", body: "Bir domain seçin. Hedef pazar ve ana dili netleştirin. Website kaynağını tarayın. Marka Zekası’nı oluşturun. İlk prompt setini seçin ve ölçümü başlatın.", points: ["Ölç", "Kanıtı gör", "Sonraki aksiyonu seç"], label: "08 / 08" },
];

function PresentationPage() {
  const [active, setActive] = useState(0);
  const slide = slides[active]!;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === " ") setActive((value) => Math.min(value + 1, slides.length - 1));
      if (event.key === "ArrowLeft") setActive((value) => Math.max(value - 1, 0));
      if (event.key === "Home") setActive(0);
      if (event.key === "End") setActive(slides.length - 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-screen overflow-hidden bg-ink text-white selection:bg-cyan selection:text-foreground">
      <header className="relative z-10 border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <BrandLogo variant="horizontal" tone="dark" size="sm" linkTo="/" />
          <div className="flex items-center gap-2">
            <Link to="/" className="hidden items-center gap-1 text-sm text-slate-400 transition hover:text-white md:inline-flex"><ArrowLeft className="h-4 w-4" /> 1cite.com</Link>
            <Button asChild size="sm" className="bg-cyan text-foreground hover:bg-[#B8F4FF]"><Link to="/ucretsiz-yapay-zeka-gorunurluk-raporu">İlk ölçümü başlat</Link></Button>
          </div>
        </div>
      </header>
      <main className="relative mx-auto flex min-h-[calc(100vh-145px)] max-w-7xl items-center px-5 py-10 md:px-8 md:py-16">
        <div className="pointer-events-none absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-cyan/10 blur-3xl" />
        <div className="relative grid w-full gap-12 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
          <section className="max-w-4xl">
            <p className="font-mono text-xs font-medium tracking-[0.2em] text-cyan">{slide.eyebrow}</p>
            <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-[1.03] tracking-[-0.055em] text-white md:text-7xl">{slide.accent && <span className="mb-2 block text-cyan">{slide.accent}</span>}{slide.title}</h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 md:text-xl">{slide.body}</p>
            <div className="mt-10 flex flex-wrap gap-2">{slide.points.map((point, index) => <div key={point} className={`rounded-full border px-4 py-2 font-mono text-xs ${index === 0 ? "border-cyan/50 bg-cyan/10 text-cyan" : "border-white/15 bg-background/[0.04] text-slate-300"}`}>{point}</div>)}</div>
          </section>
          <aside className="relative overflow-hidden rounded-3xl border border-white/10 bg-background/[0.05] p-6 md:p-8">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan/10 blur-3xl" />
            <div className="relative">
              <p className="font-mono text-xs tracking-[0.2em] text-slate-500">ONECITE / PRESENTATION</p>
              <div className="mt-10 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan/40 bg-cyan/10 font-mono text-xl text-cyan">{String(active + 1).padStart(2, "0")}</div>
                <div><p className="text-sm text-slate-400">Aktif bölüm</p><p className="mt-1 text-xl font-bold text-white">{slide.eyebrow}</p></div>
              </div>
              <div className="mt-12 space-y-3">{slide.points.map((point, index) => <div key={point} className="flex items-center gap-3 border-b border-white/10 pb-3 text-sm text-slate-300"><span className="font-mono text-xs text-cyan">0{index + 1}</span>{point}</div>)}</div>
            </div>
          </aside>
        </div>
      </main>
      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setActive((value) => Math.max(value - 1, 0))} disabled={active === 0} aria-label="Önceki slayt" className="rounded-full border border-white/15 p-2 text-slate-300 transition hover:border-cyan hover:text-cyan disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" onClick={() => setActive((value) => Math.min(value + 1, slides.length - 1))} disabled={active === slides.length - 1} aria-label="Sonraki slayt" className="rounded-full border border-white/15 p-2 text-slate-300 transition hover:border-cyan hover:text-cyan disabled:cursor-not-allowed disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            <span className="ml-2 font-mono text-xs text-slate-500">{slide.label}</span>
          </div>
          <div className="flex items-center gap-2" aria-label="Sunum ilerlemesi">{slides.map((item, index) => <button key={item.label} type="button" onClick={() => setActive(index)} aria-label={`${index + 1}. slayta git`} className={`h-1.5 rounded-full transition-all ${index === active ? "w-8 bg-cyan" : "w-3 bg-background/20 hover:bg-background/40"}`} />)}</div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1 text-xs text-slate-500 md:inline-flex"><Maximize2 className="h-3.5 w-3.5" /> Klavye ile gezin</span>
            <Link to="/ucretsiz-yapay-zeka-gorunurluk-raporu" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan hover:text-white">İlk ölçümü başlat <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
