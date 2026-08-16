import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketingShell } from "@/components/site/MarketingShell";
import { VisualHero } from "@/components/site/visual-hero";
import { Reveal, MotionPress } from "@/components/site/marketing-motion";
import heroCitationOrb from "@/assets/landing/hero-citation-orb.webp";
import generalAiVisibilityArticle from "@/content/articles/2026-en-iyi-10-ai-gorunurluk-araci.md?raw";
import agencyGeoArticle from "@/content/articles/ajanslar-icin-en-iyi-8-geo-ai-gorunurluk-araci.md?raw";
import contentTeamAiSearchArticle from "@/content/articles/icerik-ekipleri-icin-en-iyi-8-ai-arama-optimizasyon-araci.md?raw";
import aiVisibilityArticle from "@/content/articles/yapay-zeka-gorunurlugu-nedir.md?raw";

export type ArticleSlug =
  | "yapay-zeka-atif-payini-olcmek"
  | "kanit-acigi-nedir"
  | "ureten-motor-optimizasyonu-geo"
  | "filmfolk-vaka-incelemesi"
  | "en-iyi-ai-gorunurluk-araclari"
  | "ajanslar-icin-geo-ai-gorunurluk-araclari"
  | "icerik-ekipleri-icin-ai-arama-optimizasyon-araclari"
  | "yapay-zeka-gorunurlugu-nedir";

export type Article = {
  slug: ArticleSlug;
  category: string;
  title: string;
  description: string;
  readingTime: string;
  date: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
  markdown?: string;
};

export const articles: Article[] = [
  {
    slug: "yapay-zeka-gorunurlugu-nedir", category: "Yapay zeka arama rehberleri", title: "Yapay Zeka Görünürlüğü Nedir? Kapsamlı Rehber", description: "Markanızın ChatGPT, Perplexity ve diğer AI yanıtlarında nasıl göründüğünü ölçmek için kapsamlı rehber.", readingTime: "14 dk okuma", date: "16 Ağustos 2026", sections: [], markdown: aiVisibilityArticle,
  },
  {
    slug: "yapay-zeka-atif-payini-olcmek", category: "Atıf ve kaynak analizi", title: "Yapay zeka atıf payı nasıl ölçülür?", description: "Marka adının geçmesinden fazlasını ölçmek için arama sorusu, seçilen kaynak ve sonuç bağlamını birlikte okuyun.", readingTime: "6 dk okuma", date: "14 Ağustos 2026",
    sections: [
      { heading: "Atıf payı nedir?", paragraphs: ["Atıf payı, seçilen bir arama sorusu setinde yapay zeka yanıtlarının markanızı kaynak olarak seçme oranıdır. Bu oran, yalnızca marka adının geçtiği yanıtları değil; yanıtı destekleyen kaynak bağlantılarını ve kaynak türünü dikkate alır.", "Bu nedenle atıf payı, klasik sıralama metriklerinin birebir karşılığı değildir. Aynı marka bir yanıtta olumlu biçimde anılabilir ancak kaynak olarak seçilmeyebilir. OneCite bu iki durumu ayrı sinyaller olarak ele alır."] },
      { heading: "Ölçüm için doğru soru seti", paragraphs: ["Anlamlı bir başlangıç ölçümü, müşterinin karar anına yakın sorulardan oluşur. Sorular; problem araştırması, çözüm değerlendirmesi, karşılaştırma ve satın alma niyeti gibi farklı aşamaları temsil etmelidir.", "Soru seti sabit kalmalıdır. Aksi halde zaman içindeki değişimin içerikten mi, soru kapsamından mı kaynaklandığını ayırmak zorlaşır."] },
      { heading: "Oranın arkasındaki kanıt", paragraphs: ["Atıf payı tek başına bir karar verdirmez. Hangi soruda kaynak seçildiği, hangi sayfanın seçildiği, rakibin hangi kaynakla öne çıktığı ve yanıtın kullandığı kanıt türü birlikte okunmalıdır.", "Bir sonraki uygulama buradan çıkar: eksik olan şey yeni bir sayfa mı, daha iyi bir vaka çalışması mı, güncellenmiş teknik bilgi mi yoksa üçüncü taraf otorite mi? Doğru cevap, ölçüm bağlamında görünür olur."] },
    ],
  },
  {
    slug: "kanit-acigi-nedir", category: "Kanıt ve içerik", title: "Eksik kanıt nedir ve neden önemlidir?", description: "Yapay zekanın markanıza güvenerek kaynak vermesi için eksik kalan bilgi, ilişki veya otorite sinyalini görün.", readingTime: "5 dk okuma", date: "14 Ağustos 2026",
    sections: [
      { heading: "Eksik kanıtı tanımlamak", paragraphs: ["Eksik kanıt, bir yapay zeka modelinin markanızı güvenle önermek veya kaynak göstermek için ihtiyaç duyduğu bilgiyi, kaynağı ya da bağlantıyı bulamamasıdır.", "Bu durum her zaman içerik eksikliği değildir. Bir hizmet sayfası bulunabilir, ancak müşterinin değerlendirme ihtiyacını karşılayacak örnek, sonuç, yöntem veya karşılaştırma kanıtı eksik kalabilir."] },
      { heading: "Üç yaygın eksik kanıt", paragraphs: ["Karar kanıtı eksikliği, ziyaretçiye ve modele sonucun nasıl üretildiğini gösteren vaka çalışması, veri veya yöntem bilgisinin bulunmamasıdır. Varlık bağlamı eksikliği, hizmet, konu, lokasyon ve uzmanlık ilişkilerinin dağınık kalmasıdır.", "Otorite sinyali eksikliği ise modelin markanın kendi kaynakları yerine sürekli üçüncü taraf liste, inceleme veya rakip sayfa üzerinden kategori bilgisini öğrenmesidir."] },
      { heading: "Açığı aksiyona dönüştürmek", paragraphs: ["Öncelik, en çok sayıda içerik üretmek değildir. Önce yüksek niyetli sorularda kaynak seçimini değiştirebilecek eksik halka bulunur.", "Bu halka bir karşılaştırma rehberi, sonuç odaklı vaka çalışması, güncel teknik doküman veya daha tutarlı bir bilgi mimarisi olabilir. OneCite, eksik kanıtı soru ve kaynak bağlamından koparmadan öneri listesine taşır."] },
    ],
  },
  {
    slug: "ureten-motor-optimizasyonu-geo", category: "Yapay zeka arama rehberleri", title: "Üretken motor optimizasyonu (GEO) nedir?", description: "GEO, yapay zeka arama motorlarının marka ve kaynak seçimini anlamaya yönelik ölçüm ve uygulama disiplinidir.", readingTime: "7 dk okuma", date: "14 Ağustos 2026",
    sections: [
      { heading: "GEO neyi değiştirir?", paragraphs: ["Üretken motor optimizasyonu, yapay zeka tabanlı cevap sistemlerinde markanın nasıl anıldığını, hangi kaynakların seçildiğini ve hangi içeriklerin öneri bağlamına girdiğini anlamaya odaklanır.", "GEO, arama motoru optimizasyonunun yerine geçen bağımsız bir kanal olarak görülmemelidir. Teknik erişilebilirlik, içerik kalitesi ve konu otoritesi gibi SEO temelleri hala önemlidir; ancak yapay zeka yanıtları yeni bir ölçüm yüzeyi oluşturur."] },
      { heading: "GEO ölçümü hangi sorularla başlar?", paragraphs: ["İlk soru markanın yapay zeka yanıtlarında geçip geçmediği değildir. Daha yararlı sorular şunlardır: Hangi karar sorularında kaynak seçiliyoruz? Rakip hangi kaynakla öne çıkıyor? Yanıtın güvenmek için bulamadığı bilgi nedir?", "Bu sorular görünürlüğü, kaynak kalitesini ve aksiyonu aynı çalışma döngüsüne bağlar."] },
      { heading: "Sürdürülebilir GEO çalışma ritmi", paragraphs: ["Sürdürülebilir bir çalışma; sabit soru seti, kaynak ve rakip izlemesi, eksik kanıt analizi ve içerik uygulamasından oluşur. Düzenli ölçüm olmadan yalnızca tekil ekran görüntülerinden karar vermek kolaylaşır.", "OneCite bu ritmi Kaynak, Sinyal ve Uygulama akışıyla yapılandırır: önce marka kanıtını görünür kılar, sonra yapay zeka seçimlerini ölçer, ardından en yüksek etkili uygulamayı önceliklendirir."] },
    ],
  },
  {
    slug: "en-iyi-ai-gorunurluk-araclari", category: "Yapay zeka arama rehberleri", title: "2026’da En İyi 10 AI Görünürlük Aracı: İncelendi ve Karşılaştırıldı", description: "AI görünürlük araçlarını prompt, citation, rakip analizi, kaynak bağlamı ve fiyat açısından karşılaştırın.", readingTime: "18 dk okuma", date: "15 Ağustos 2026", sections: [], markdown: generalAiVisibilityArticle,
  },
  {
    slug: "ajanslar-icin-geo-ai-gorunurluk-araclari", category: "Ajanslar", title: "Ajanslar İçin En İyi 8 GEO ve AI Görünürlük Aracı 2026", description: "Çoklu müşteri, prompt, citation, raporlama, API ve GEO hizmeti üretimi için araçları karşılaştırın.", readingTime: "16 dk okuma", date: "15 Ağustos 2026", sections: [], markdown: agencyGeoArticle,
  },
  {
    slug: "icerik-ekipleri-icin-ai-arama-optimizasyon-araclari", category: "Kanıt ve içerik", title: "İçerik Ekipleri İçin En İyi 8 AI Arama Optimizasyon Aracı 2026", description: "İçerik araştırması, citation gap, teknik denetim ve AI arama uygulama akışlarını karşılaştırın.", readingTime: "15 dk okuma", date: "15 Ağustos 2026", sections: [], markdown: contentTeamAiSearchArticle,
  },
  {
    slug: "filmfolk-vaka-incelemesi", category: "Vaka incelemesi", title: "FilmFolk: Atıf payında +28,1 puan", description: "41 satın alma niyetli soru ve 286 ölçüm tekrarı üzerinden atıf payı değişimini, kazanan ve gerileyen niyetleri birlikte inceleyin.", readingTime: "12 dk vaka incelemesi", date: "14 Ağustos 2026",
    sections: [],
  },
];

export const Route = createFileRoute("/makaleler/")({
  head: () => ({
    meta: [
      { title: "Makaleler | OneCite Kaynak Merkezi" },
      { name: "description", content: "Yapay zeka arama, atıf payı, eksik kanıt ve GEO hakkında Türkçe OneCite rehberleri." },
      { property: "og:title", content: "Makaleler | OneCite Kaynak Merkezi" },
      { property: "og:description", content: "Atıf payı, eksik kanıt, kaynak seçimi ve GEO hakkında Türkçe rehberler." },
    ],
  }),
  component: ArticlesPage,
});

function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  return (
    <MotionPress className="block h-full">
      <Link
        to="/makaleler/$slug"
        params={{ slug: article.slug }}
        className={`group flex h-full flex-col rounded-2xl border p-6 transition-[box-shadow,border-color] duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${featured ? "border-[#C9C5B6] bg-muted" : "border-border bg-background hover:border-[#C9C5B6] hover:shadow-[0_14px_32px_rgba(11,16,32,0.06)]"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <Badge variant="outline" className="border-border bg-background text-primary">{article.category}</Badge>
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <h2 className="mt-7 text-2xl font-extrabold tracking-[-0.03em] text-foreground">{article.title}</h2>
        <p className="mt-4 flex-1 text-sm leading-7 text-muted-foreground">{article.description}</p>
        <div className="mt-7 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{article.readingTime}</span>
          <span className="flex items-center gap-1 font-semibold text-primary">
            {article.category === "Vaka incelemesi" ? "Vaka incelemesini aç" : "Makaleyi aç"} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
          </span>
        </div>
      </Link>
    </MotionPress>
  );
}

function ArticlesPage() {
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const categories = useMemo(() => ["Tümü", ...articles.map((article) => article.category)], []);
  const visibleArticles = selectedCategory === "Tümü" ? articles : articles.filter((article) => article.category === selectedCategory);
  const featured = articles[0]!;

  return (
    <MarketingShell>
      <VisualHero
        eyebrow="SOURCE LIBRARY · ONECITE INSIGHTS"
        title={<>Yapay zeka arama için <span className="text-cyan">ölçülebilir bilgi.</span></>}
        description="Atıf payı, eksik kanıt, kaynak seçimi ve GEO hakkında karar vermeyi kolaylaştıran Türkçe rehberler."
        image={heroCitationOrb}
        imageAlt="Citation ağı taşıyan cam küre; OneCite kaynak merkezi için editorial görsel"
        visualLabel="SOURCE LIBRARY / 05"
      >
        <p className="text-sm text-slate-400">
          Öne çıkan rehber: <Link className="font-semibold text-cyan hover:text-white" to="/makaleler/$slug" params={{ slug: featured.slug }}>{featured.title}</Link>
        </p>
      </VisualHero>

      <section className="marketing-container px-4 py-16 md:px-6 md:py-24">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Rehberler</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-4xl">Kavramı anlayın, sonra ölçün.</h2>
          </div>
          <Link to="/free-ai-readiness-report" className="text-sm font-bold text-primary hover:text-foreground">Ücretsiz raporu başlat →</Link>
        </div>
        <div className="mt-8 flex flex-wrap gap-2" aria-label="Makale kategorileri">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.98] motion-reduce:transition-none ${selectedCategory === category ? "border-primary bg-primary text-white" : "border-border bg-background text-muted-foreground hover:border-[#C9C5B6] hover:text-foreground"}`}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="mt-10 grid gap-4 opacity-100 transition-opacity duration-200 md:grid-cols-3">
          {visibleArticles.map((article, index) => (
            <Reveal key={article.slug} delay={index * 0.06}>
              <ArticleCard article={article} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-muted px-4 py-16 md:px-6">
        <div className="marketing-container flex flex-col items-start justify-between gap-6 rounded-2xl border border-border bg-background p-7 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground">Okuduklarınızı kendi markanızla test edin.</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Ücretsiz hazırlık raporu, ilk kaynak ve kanıt çerçevenizi verir.</p>
          </div>
          <Button asChild><Link to="/free-ai-readiness-report">Ücretsiz ölçüm başlat <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
        </div>
      </section>
    </MarketingShell>
  );
}
