import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { MarketingShell } from "@/components/site/MarketingShell";
import { Reveal } from "@/components/site/marketing-motion";
import { Button } from "@/components/ui/button";

const TITLE = "Ölçüm Metodolojisi | OneCite";
const DESCRIPTION =
  "OneCite yapay zeka görünürlük ölçümünün metodolojisi: prompt evreni, ölçüm protokolü, skor ağırlıkları, Marka Zekası RAG mimarisi ve yöntemin sınırları.";
const URL = "https://1cite.com/metodoloji";

export const Route = createFileRoute("/metodoloji")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "OneCite Ölçüm Metodolojisi",
          description: DESCRIPTION,
          inLanguage: "tr-TR",
          mainEntityOfPage: URL,
          author: { "@type": "Organization", name: "OneCite" },
          publisher: { "@type": "Organization", name: "OneCite" },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Ana sayfa", item: "https://1cite.com" },
            { "@type": "ListItem", position: 2, name: "Metodoloji", item: URL },
          ],
        }),
      },
    ],
  }),
  component: MetodolojiPage,
});

type Section = { id: string; eyebrow: string; title: string; body: string; points: string[] };

const SECTIONS: Section[] = [
  {
    id: "prompt-evreni",
    eyebrow: "01 · Örneklem",
    title: "Prompt evreni nasıl kuruluyor?",
    body: "Ölçüm, rastgele sorularla değil; markanın gerçek talep evrenini temsil eden yapılandırılmış bir prompt setiyle başlar. Set, ölçüm dönemi boyunca sabit tutulur; yalnızca böylece dönemler karşılaştırılabilir olur.",
    points: [
      "Kategori haritası: ürün, hizmet, problem ve karşılaştırma başlıkları ayrı ayrı çıkarılır.",
      "Huni aşaması: bilgi arama, değerlendirme ve satın alma niyeti soruları oranlanarak dağıtılır.",
      "Niyet sınıflandırması: her prompt bilgi / karşılaştırma / işlem niyetiyle etiketlenir.",
      "Örneklem büyüklüğü: marka başına en az 20, tipik olarak 40-60 prompt; kategori genelinde 10.000'den fazla prompt üzerinde kalibre edilmiştir.",
      "Dil ve pazar: Türkçe sorular Türkçe kaynak evreniyle, çok pazarlı markalarda her dil ayrı set olarak ölçülür.",
    ],
  },
  {
    id: "olcum-protokolu",
    eyebrow: "02 · Protokol",
    title: "Ölçüm protokolü ve tekrar",
    body: "Üretken motorlar aynı soruya her seferinde birebir aynı cevabı vermez. Bu nedenle tek bir sorgu sonucu veri sayılmaz; her prompt tekrarlı olarak çalıştırılır ve sonuçlar toplulaştırılır.",
    points: [
      "Motorlar: ChatGPT, Perplexity, Gemini, Copilot ve Claude davranışını temsil eden arama ve cevap sinyalleri.",
      "Tekrar sayısı: her prompt için çoklu çalıştırma; dönem sonunda toplam tekrar sayısı raporda açıkça belirtilir.",
      "Zaman aralığı: ölçümler düzenli aralıklarla alınır, tek güne sıkıştırılmaz.",
      "Varyans kontrolü: tekrarlar arası sapma izlenir; sapma yüksekse sonuç düşük güven etiketiyle işaretlenir.",
      "Kayıt: her çalıştırmanın ham cevabı, bahsedilen markalar ve gösterilen kaynaklar veritabanına yazılır.",
    ],
  },
  {
    id: "skor-modeli",
    eyebrow: "03 · Skor",
    title: "OneCite Score bileşenleri",
    body: "Skor tek bir sayı olarak sunulur ama beş ölçülebilir bileşenin ağırlıklı bileşkesidir. Her bileşen ayrı gösterilir; böylece skorun neden düştüğü veya çıktığı yoruma bırakılmaz.",
    points: [
      "Bahsedilme: markanın cevapta hiç anılıp anılmadığı.",
      "AI kaynak payı: cevaba kaynak olarak gösterilen alan adları içinde markanın payı.",
      "Sıralama kalitesi: markanın cevap içindeki konumu ve öne çıkarılma biçimi.",
      "Kanıt kapsamı: prompt için gereken kanıt türlerinin ne kadarının sitede karşılığı olduğu.",
      "İddia kanıtı: markanın öne sürdüğü iddiaların doğrulanabilir kaynağa bağlanma oranı.",
    ],
  },
  {
    id: "rag",
    eyebrow: "04 · Marka Zekası",
    title: "Marka Zekası ve RAG mimarisi",
    body: "Ölçüm sonucu tek başına aksiyon üretmez. OneCite, markanın kendi kanıt evrenini vektörleştirir ve ölçüm sonucuyla eşleştirir; eksik kanıt buradan çıkar.",
    points: [
      "Toplama: site sayfaları, sitemap, SSS, yapılandırılmış veri ve bağlı analitik kaynakları taranır.",
      "Parçalama: içerik başlık hiyerarşisine göre anlamlı parçalara bölünür ve gürültü oranı puanlanır.",
      "Vektörleştirme: her parça embedding olarak saklanır, kaynak türüne göre ağırlıklandırılır.",
      "Hibrit arama: vektör benzerliği ile tam metin araması birleştirilir (RRF füzyonu) ve kaynak başına çeşitlilik korunur.",
      "Eşleştirme: görünmediğiniz her prompt, eksik kanıt tipine ve önceliklendirilmiş bir göreve dönüştürülür.",
    ],
  },
  {
    id: "sinirlar",
    eyebrow: "05 · Şeffaflık",
    title: "Doğrulama, tekrarlanabilirlik ve sınırlar",
    body: "Metodolojinin en önemli parçası, neyi ölçmediğini de söylemesidir. Üretken motorlar kapalı sistemlerdir; bu gerçeği gizleyen hiçbir ölçüm güvenilir değildir.",
    points: [
      "Kapalı sistem uyarısı: motorların model ve sıralama mantığı kamuya açık değildir; tek bir cevabın nedeni kesin olarak bilinemez.",
      "Tekrarlanabilirlik: aynı prompt seti ve aynı protokolle ölçüm yeniden alınabilir; tüm ham veriler panelde kalır.",
      "Kişiselleştirme etkisi: kullanıcı geçmişi ve konum kaynaklı farklar tekrarlı ölçümle sönümlenir.",
      "Veri saklama: ölçüm verisi marka bazında izole tutulur, dışa aktarım marka sahibinin kontrolündedir.",
      "Yorum katmadan raporlama: rapor yalnızca ölçülen veriyi ve ondan türeyen görevleri içerir.",
    ],
  },
];

const REFERENCES = [
  "Generative Engine Optimization (GEO) literatürü — üretken cevaplarda kaynak seçimi üzerine akademik çalışmalar.",
  "Retrieval-Augmented Generation (RAG) — bilgi getirimi destekli üretim mimarisi üzerine temel yayınlar.",
  "Reciprocal Rank Fusion — çoklu sıralama listelerinin birleştirilmesi yöntemi.",
  "Bilgi getirimi değerlendirme metrikleri — örneklem, tekrar ve varyans üzerine standart yaklaşımlar.",
];

function MetodolojiPage() {
  return (
    <MarketingShell>
      <section className="visual-hero-surface relative isolate overflow-hidden border-b border-[#26302E]">
        <div className="visual-hero-grid pointer-events-none absolute inset-0 -z-10 opacity-40" aria-hidden="true" />
        <div className="marketing-container py-16 text-white md:py-20">
          <p className="visual-source-label text-cyan">METODOLOJİ</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] md:text-[52px]">
            Yapay zeka görünürlüğünü nasıl ölçüyoruz?
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            Görünürlük iddiası ancak yöntemi açıklandığında bir anlam taşır. Aşağıda prompt evreninden skor ağırlıklarına,
            RAG mimarisinden yöntemin sınırlarına kadar OneCite ölçümünün tamamı yer alıyor.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-cyan/60 hover:text-white"
              >
                {section.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-16 md:py-24">
        <div className="marketing-container space-y-14 md:space-y-20">
          {SECTIONS.map((section) => (
            <Reveal key={section.id} id={section.id} className="scroll-mt-24 border-t border-border pt-8 first:border-t-0 first:pt-0">
              <p className="editorial-eyebrow text-primary">{section.eyebrow}</p>
              <h2 className="mt-4 max-w-2xl text-2xl font-extrabold tracking-[-0.03em] text-foreground md:text-3xl">
                {section.title}
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">{section.body}</p>
              <ul className="mt-6 grid gap-3 md:grid-cols-2">
                {section.points.map((point) => (
                  <li key={point} className="rounded-xl border border-border bg-secondary p-4 text-sm leading-6 text-foreground">
                    {point}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}

          <div className="border-t border-border pt-8">
            <p className="editorial-eyebrow text-primary">Kaynakça</p>
            <h2 className="mt-4 text-2xl font-extrabold tracking-[-0.03em] text-foreground md:text-3xl">
              Yöntemin dayandığı alanlar
            </h2>
            <ul className="mt-5 space-y-2 text-sm leading-6 text-muted-foreground">
              {REFERENCES.map((reference) => (
                <li key={reference} className="flex gap-2">
                  <span className="text-primary">·</span>
                  {reference}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary py-16 md:py-20">
        <div className="marketing-container flex flex-col items-start gap-5">
          <h2 className="max-w-2xl text-2xl font-extrabold tracking-[-0.03em] text-foreground md:text-3xl">
            Metodolojiyi kendi markanızda çalıştırın.
          </h2>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            İlk ölçüm herkese açık web verileriyle başlar; kredi kartı gerekmez.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/ucretsiz-yapay-zeka-gorunurluk-raporu">
                Ücretsiz ölçümü başlatın <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/ozellikler">Ürünü inceleyin</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
