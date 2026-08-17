import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Filter,
  KanbanSquare,
  LineChart,
  Network,
  PenSquare,
  Quote,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { MarketingShell } from "@/components/site/MarketingShell";
import { MarketingCta } from "@/components/site/marketing-cta";
import { VisualHero } from "@/components/site/visual-hero";
import { FeatureShot, MiniMock, MockBars, MockRows, MockSpark } from "@/components/site/feature-shot";
import { Button } from "@/components/ui/button";
import heroSignalAction from "@/assets/landing/hero-signal-action.webp";
import shotDashboard from "@/assets/features/dashboard.webp.asset.json";
import shotPrompts from "@/assets/features/prompts.webp.asset.json";
import shotCompetitors from "@/assets/features/competitors.webp.asset.json";
import shotGraph from "@/assets/features/graph.webp.asset.json";
import shotContent from "@/assets/features/content.webp.asset.json";
import shotTasks from "@/assets/features/tasks.webp.asset.json";

const TITLE = "Özellikler | Yapay Zeka Görünürlük Platformu — OneCite";
const DESCRIPTION =
  "Prompt takibi, rakip karşılaştırması, marka zekası, GEO görevleri, içerik üretimi ve GA4/GSC/Bing raporlaması. OneCite'ın tüm özelliklerini ekran görüntüleriyle inceleyin.";

export const Route = createFileRoute("/ozellikler")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://1cite.com/ozellikler" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://1cite.com/ozellikler" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "OneCite",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: "https://1cite.com/ozellikler",
          description: DESCRIPTION,
          brand: { "@type": "Brand", name: "OneCite" },
          featureList: [
            "Yapay zeka yanıtlarında atıf payı ölçümü",
            "Prompt keşfi ve takibi",
            "Rakip karşılaştırmalı görünürlük trendi",
            "Marka zekası (RAG) ve bilgi bankası",
            "GEO görev listesi ve içerik üretimi",
            "GSC, GA4 ve Bing Webmaster raporlaması",
          ],
          offers: {
            "@type": "Offer",
            price: 69,
            priceCurrency: "USD",
            url: "https://1cite.com/fiyatlandirma",
            availability: "https://schema.org/InStock",
          },
        }),
      },
    ],
  }),
  component: FeaturesPage,
});

type MainFeature = {
  id: string;
  icon: typeof BarChart3;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  shot: string;
  alt: string;
  caption: string;
  href: string;
  hrefLabel: string;
};

const mainFeatures: MainFeature[] = [
  {
    id: "gorunurluk",
    icon: BarChart3,
    eyebrow: "AI Görünürlük Takibi",
    title: "Markanızın yapay zeka cevaplarında tam olarak nerede geçtiğini görün",
    body: "Satın alma niyetli sorularda hangi modelin sizi seçtiğini, hangisinin görmezden geldiğini tek skorda okuyun. OneCite Score, atıf payınızı beş bileşene bölerek nerede kaybettiğinizi söyler.",
    points: [
      "Perplexity ve DeepSeek üzerinde düzenli prompt ölçümü",
      "OneCite Score: bahsedilme, alıntı payı, sıralama kalitesi, kanıt kapsamı, iddia kanıtı",
      "Zaman içindeki görünürlük trendi ve zayıf bileşen için doğrudan aksiyon butonu",
    ],
    shot: shotDashboard.url,
    alt: "OneCite komuta merkezi: OneCite Score kırılımı ve görünürlük metrikleri",
    caption: "Komuta Merkezi — OneCite Score ve görünürlük kırılımı",
    href: "/platform/citation-share",
    hrefLabel: "Atıf payını incele",
  },
  {
    id: "promptlar",
    icon: Search,
    eyebrow: "Prompt Keşfi ve Takibi",
    title: "Müşterilerinizin yapay zekaya sorduğu soruları bulun ve izlemeye alın",
    body: "Marka profilinizden yola çıkarak gerçek satın alma sorularını üretiriz. Her prompt için yanıtın tamamını, kullanılan kaynakları ve 'bu soruda görünmek için' adımlarını görürsünüz.",
    points: [
      "Huni aşamasına göre etiketlenmiş prompt seti (üst, orta, alt huni)",
      "Yanıtın tamamı ve atıf kaynakları tek ekranda",
      "Görünmediğiniz sorular için tek tıkla görev oluşturma",
    ],
    shot: shotPrompts.url,
    alt: "OneCite prompt takip ekranı: izlenen sorular ve yanıt detayları",
    caption: "Promptlar — izlenen sorular, yanıtlar ve kaynaklar",
    href: "/platform/evidence-gaps",
    hrefLabel: "Eksik kanıtları gör",
  },
  {
    id: "rakipler",
    icon: Users,
    eyebrow: "Rakip Analizi",
    title: "Rakibinizin göründüğü, sizin görünmediğiniz soruları bulun",
    body: "Aynı promptlarda kimin seçildiğini alan adı bazında sayarız. Karşılaştırmalı trend grafiği, kaybettiğiniz payı ve kapatmanız gereken boşluğu net gösterir.",
    points: [
      "Alan adı bazlı rakip eşleştirme — isim benzerliğine değil, gerçek atıflara bakar",
      "Rakiplerle karşılaştırmalı görünürlük trendi",
      "Sorgu sonuçlarından çıkan yeni rakip adaylarını tek tıkla takibe alma",
    ],
    shot: shotCompetitors.url,
    alt: "OneCite rakip takibi ekranı: rakip listesi ve karşılaştırmalı görünürlük",
    caption: "Rakip Takibi — pay dağılımı ve aday rakipler",
    href: "/fiyatlandirma",
    hrefLabel: "Plan limitlerine bak",
  },
  {
    id: "marka-zekasi",
    icon: Network,
    eyebrow: "Marka Zekası ve Bilgi Bankası",
    title: "Yapay zekanın sizi anlaması için gereken kanıtı tek yerde toplayın",
    body: "Site içeriğiniz, SSS'leriniz, PDF'leriniz ve marka iddialarınız vektörlenir. Yakın noktalar benzer konuları, seyrek bölgeler kanıt boşluklarını gösterir — bu katman tüm ölçüm ve içerik üretiminin beslendiği yerdir.",
    points: [
      "3D vektör haritasında canlı bilgi grafiği",
      "Marka iddiaları ve kanıt bağlantıları ile alıntılanabilirlik",
      "RAG altyapısı: her içerik ve analiz kendi bilgi bankanızdan beslenir",
    ],
    shot: shotGraph.url,
    alt: "OneCite marka zekası ekranı: 3D vektör haritası ve bilgi parçaları",
    caption: "Marka Zekası — canlı 3B vektör haritası",
    href: "/platform/evidence-gaps",
    hrefLabel: "Kanıt boşluklarını gör",
  },
  {
    id: "icerik",
    icon: PenSquare,
    eyebrow: "İçerik Üretimi",
    title: "Kanıt boşluğunu kapatan, alıntılanabilir içerik üretin",
    body: "Görünürlük verinize dayanarak brief üretir, ardından kendi bilgi bankanız ve marka iddialarınızla desteklenmiş taslağı yazarız. Genel yapay zeka metni değil, kaynak gösterilebilir içerik.",
    points: [
      "Görünürlük boşluğuna göre otomatik içerik brief'i",
      "Marka iddiaları ve kanıt bağlantılarıyla desteklenen taslak",
      "AEO uyumlu SSS bloğu ve iç linkleme önerileri",
    ],
    shot: shotContent.url,
    alt: "OneCite içerik üretimi ekranı: taslak oluşturma ve kaynaklar",
    caption: "İçerik Üretimi — brief'ten alıntılanabilir taslağa",
    href: "/makaleler",
    hrefLabel: "Örnek içerikleri oku",
  },
  {
    id: "raporlama",
    icon: LineChart,
    eyebrow: "Raporlama ve Entegrasyonlar",
    title: "Yapay zeka görünürlüğünüzü gerçek trafiğe ve gelire bağlayın",
    body: "GA4, Google Search Console ve Bing Webmaster Tools'u markaya özel bağlarsınız. ChatGPT, Perplexity, Copilot, Gemini ve Claude'dan gelen trafiği ayrı ayrı görürsünüz.",
    points: [
      "AI platform kırılımlı trafik: ChatGPT, Perplexity, Copilot, Gemini, Claude",
      "AI trafiğinden gelen dönüşüm ve gelir analizi (GA4)",
      "Paylaşılabilir müşteri raporu ve günlük otomatik veri yenileme",
    ],
    shot: shotTasks.url,
    alt: "OneCite GEO görevleri ekranı: öncelikli aksiyon listesi",
    caption: "GEO Görevleri — ölçümden çıkan öncelikli aksiyonlar",
    href: "/solutions/agencies",
    hrefLabel: "Ajans kullanımını gör",
  },
];

const deepFeatures = [
  {
    icon: Filter,
    title: "Huni bazlı takip",
    body: "Her promptu üst, orta ve alt huni olarak etiketleyin; hangi aşamada kaybettiğinizi görün.",
    mock: (
      <MockBars
        items={[
          { label: "Üst huni", value: 62 },
          { label: "Orta huni", value: 38 },
          { label: "Alt huni", value: 14, tone: "muted" },
        ]}
      />
    ),
  },
  {
    icon: LineChart,
    title: "AI trafik sayfa analizi",
    body: "Yapay zeka motorlarının kullanıcıyı hangi sayfanıza gönderdiğini görün.",
    mock: (
      <MockRows
        rows={[
          { left: "/hizmetler/kalip-tasarimi", right: "412" },
          { left: "/blog/abs-kor-kalip", right: "288" },
          { left: "/referanslar", right: "163" },
        ]}
      />
    ),
  },
  {
    icon: BarChart3,
    title: "AI gelir analizi",
    body: "GA4 dönüşüm ve gelir metriklerini yapay zeka kaynaklarına bağlayın.",
    mock: (
      <MockRows
        rows={[
          { left: "ChatGPT", right: "$4.320", badge: "AI" },
          { left: "Perplexity", right: "$1.180", badge: "AI" },
          { left: "Copilot", right: "$640", badge: "AI" },
        ]}
      />
    ),
  },
  {
    icon: Quote,
    title: "Atıf kaynakları",
    body: "Yanıtı besleyen her kaynağı listeleyin; kendi domaininiz mi, üçüncü taraf mı görün.",
    mock: (
      <MockRows
        rows={[
          { left: "abskorkalip.com.tr", right: "kendi", badge: "1." },
          { left: "sektorderneği.org", right: "3. taraf" },
          { left: "wikipedia.org", right: "3. taraf" },
        ]}
      />
    ),
  },
  {
    icon: ShieldCheck,
    title: "Marka iddiaları",
    body: "Kanıtsız iddia alıntılanmaz. Her iddiayı kanıt bağlantısıyla eşleştirin.",
    mock: (
      <MockRows
        rows={[
          { left: "20 yıllık üretim tecrübesi", right: "kanıtlı", badge: "✓" },
          { left: "ISO 9001 sertifikası", right: "kanıtlı", badge: "✓" },
          { left: "Türkiye'de lider", right: "kanıtsız" },
        ]}
      />
    ),
  },
  {
    icon: Search,
    title: "Prompt niyet analizi",
    body: "Sorunun ticari, bilgilendirici veya yönlendirici olduğunu ayırt edin.",
    mock: (
      <MockRows
        rows={[
          { left: "En iyi kalıp üreticisi?", right: "Ticari", badge: "BOF" },
          { left: "Kalıp nasıl seçilir?", right: "Bilgi", badge: "TOF" },
          { left: "ABS kalıp fiyatları", right: "Ticari", badge: "MOF" },
        ]}
      />
    ),
  },
  {
    icon: LineChart,
    title: "Trend analizi",
    body: "Görünürlüğünüzün zaman içindeki değişimini ve yaptığınız işin etkisini ölçün.",
    mock: <MockSpark label="Son 90 gün · atıf payı" points={[6, 8, 7, 11, 14, 13, 18, 22, 27, 31]} />,
  },
  {
    icon: KanbanSquare,
    title: "Paylaşılabilir rapor",
    body: "Müşteriniz veya yönetiminiz için tek bağlantılı, açıklamalı görünürlük raporu üretin.",
    mock: (
      <MockRows
        rows={[
          { left: "Ağustos raporu", right: "yayında", badge: "link" },
          { left: "Temmuz raporu", right: "arşiv" },
          { left: "Q2 özeti", right: "arşiv" },
        ]}
      />
    ),
  },
];

const workModel = [
  {
    number: "01",
    icon: Network,
    label: "Kaynak",
    title: "Marka kanıtınızı modelleyin",
    body: "Hizmetleriniz, SSS'leriniz, referanslarınız ve güven sinyalleriniz ölçümün referans katmanına dönüşür.",
  },
  {
    number: "02",
    icon: BarChart3,
    label: "Sinyal",
    title: "Yapay zekanın seçimini okuyun",
    body: "Satın alma niyetli sorularda hangi modelin sizi, rakibinizi ya da üçüncü taraf bir kaynağı seçtiğini görün.",
  },
  {
    number: "03",
    icon: Target,
    label: "Uygulama",
    title: "Doğru kanıtı önce üretin",
    body: "Eksik kanıt; içerik, vaka çalışması, üçüncü taraf otorite veya teknik iyileştirme görevine bağlanır.",
  },
];

const integrations = [
  "Google Search Console",
  "Google Analytics 4",
  "Bing Webmaster Tools",
  "Perplexity",
  "DeepSeek",
  "ChatGPT trafiği",
  "Copilot trafiği",
  "Gemini trafiği",
];

function FeaturesPage() {
  return (
    <MarketingShell>
      <VisualHero
        eyebrow="ÜRÜN · KAYNAK → SİNYAL → UYGULAMA"
        title={
          <>
            Yapay zeka cevaplarında görünmek için <span className="text-cyan">gereken her şey</span>.
          </>
        }
        description="OneCite; prompt takibi, rakip analizi, marka zekası, GEO görevleri, içerik üretimi ve trafik raporlamasını tek panelde birleştirir. Tahminle değil, ölçümle çalışırsınız."
        image={heroSignalAction}
        imageAlt="Işık huzmelerinin tek kaynak noktasında birleştiği soyut prizma görseli"
        visualLabel="TEK PANEL · TÜM GEO İŞ AKIŞI"
        primaryHref="/ucretsiz-yapay-zeka-gorunurluk-raporu"
        primaryLabel="Ücretsiz raporunu al"
        secondaryHref="/fiyatlandirma"
        secondaryLabel="Planları karşılaştır"
        proof={[
          { value: "5", label: "OneCite Score bileşeni" },
          { value: "3", label: "Trafik entegrasyonu" },
          { value: "7 gün", label: "Ücretsiz deneme" },
        ]}
      />

      <section className="border-b border-border bg-secondary/30 px-4 py-16 md:px-6 md:py-20">
        <div className="marketing-container">
          <div className="max-w-2xl">
            <p className="editorial-eyebrow text-primary">Çalışma modeli</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-4xl">
              Kaynak, sinyal ve uygulama tek döngüde.
            </h2>
            <p className="mt-4 max-w-prose text-base leading-7 text-muted-foreground">
              OneCite yalnızca bir panel değil: yapay zekanın seçebileceği kanıtı kurar, seçim davranışını ölçer ve sonucu
              uygulanabilir bir iş listesine çevirir.
            </p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {workModel.map((step) => (
              <article key={step.number} className="rounded-2xl border border-border bg-background p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-primary">{step.number}</span>
                  <step.icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="mt-8 editorial-eyebrow text-muted-foreground">{step.label}</p>
                <h3 className="mt-3 text-xl font-extrabold text-foreground">{step.title}</h3>
                <p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-container px-4 py-16 md:px-6 md:py-20">
        <div className="max-w-2xl">
          <p className="editorial-eyebrow text-primary">Yapay zeka araması için kuruldu</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-5xl">
            Markanızın yapay zeka aramasında kazanması için gereken tüm modüller.
          </h2>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            Ölçüm, rakip analizi, kanıt yönetimi, GEO görevleri ve içerik üretimi birbirine bağlı çalışır. Her ekran bir sonraki adımı söyler.
          </p>
        </div>

        <div className="mt-14 space-y-16 md:space-y-24">
          {mainFeatures.map((feature, index) => {
            const Icon = feature.icon;
            const reversed = index % 2 === 1;
            return (
              <article key={feature.id} id={feature.id} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
                <div className={reversed ? "lg:order-2" : undefined}>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <p className="editorial-eyebrow text-primary">{feature.eyebrow}</p>
                  </div>
                  <h3 className="mt-5 text-2xl font-extrabold tracking-[-0.03em] text-foreground md:text-3xl">{feature.title}</h3>
                  <p className="mt-4 text-base leading-7 text-muted-foreground">{feature.body}</p>
                  <ul className="mt-6 space-y-3">
                    {feature.points.map((point) => (
                      <li key={point} className="flex gap-3 text-sm leading-6 text-foreground">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" className="mt-7">
                    <Link to={feature.href}>
                      {feature.hrefLabel} <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className={reversed ? "lg:order-1" : undefined}>
                  <FeatureShot src={feature.shot} alt={feature.alt} caption={feature.caption} />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/30 px-4 py-16 md:px-6 md:py-24">
        <div className="marketing-container">
          <div className="max-w-2xl">
            <p className="editorial-eyebrow text-primary">Daha derine</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-4xl">
              Her modülün bir katman altı.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Yapay zeka görünürlüğünüzün tam resmini veren detay ekranları.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {deepFeatures.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="flex flex-col rounded-2xl border border-border bg-background p-5">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-4 text-base font-extrabold text-foreground">{item.title}</h3>
                  <p className="mt-2 flex-1 text-[13px] leading-6 text-muted-foreground">{item.body}</p>
                  <div className="mt-4">
                    <MiniMock>{item.mock}</MiniMock>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="marketing-container px-4 py-16 md:px-6 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="editorial-eyebrow text-primary">Entegrasyonlar</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-4xl">
              Kullandığınız araçlarla çalışır.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Her marka kendi Google ve Bing hesabını bağlar. Veriler markalar arasında karışmaz, her gece otomatik yenilenir.
            </p>
            <Button asChild className="mt-7">
              <Link to="/fiyatlandirma">
                Planları karşılaştır <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
            {integrations.map((name) => (
              <li key={name} className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-[13px] font-semibold text-foreground">
                <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{name}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <MarketingCta
        title="Markanızın yapay zeka görünürlüğünü bugün ölçün."
        description="Ücretsiz raporla başlayın, 7 günlük denemede tüm panele erişin. Kredi kartı istemiyoruz."
        primaryLabel="Ücretsiz raporunu al"
        secondaryHref="/fiyatlandirma"
        secondaryLabel="Planlara bak"
      />
    </MarketingShell>
  );
}
