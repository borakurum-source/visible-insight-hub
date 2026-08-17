import { createFileRoute, Link } from "@tanstack/react-router";
import BrandLogo from "@/components/site/BrandLogo";
import { Button } from "@/components/ui/button";
import { openConsentPreferences } from "@/lib/consent";

const LAST_UPDATED = "17 Ağustos 2026";
const CONTROLLER_NAME = "OneCite adına Bora Kurum";
const CONTACT_EMAIL = "info@ragsignal.com";

export const Route = createFileRoute("/data-processing")({
  head: () => ({
    meta: [
      { title: "Veri İşleme Metni | OneCite" },
      {
        name: "description",
        content:
          "OneCite'ın Perplexity, DeepSeek, Firecrawl, Google ve Bing gibi sağlayıcılarla veri işleme amaçları, hukuki dayanakları ve veri sorumlusu/işleyen rol tanımları.",
      },
      { property: "og:title", content: "Veri İşleme Metni | OneCite" },
      {
        property: "og:description",
        content: "İşleme amaçları, aktarılan veri türleri ve sağlayıcı rol tanımları (sorumlu/işleyen).",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://1cite.com/data-processing" },
    ],
    links: [{ rel: "canonical", href: "https://1cite.com/data-processing" }],
  }),
  component: DataProcessingPage,
});

type Row = {
  provider: string;
  purpose: string;
  data: string;
  role: string;
  location: string;
};

const PROVIDERS: Row[] = [
  {
    provider: "Perplexity AI",
    purpose:
      "Takip edilen promptların yapay zeka yanıtlarında ölçülmesi, kaynak gösterimi listelerinin çıkarılması ve metin embedding üretimi.",
    data: "Prompt metinleri, marka ve rakip adları, taranan sayfa içerikleri (kişisel veri içermemesi hedeflenir), hesap kimliği içermeyen teknik meta veriler.",
    role: "Veri işleyen (OneCite talimatıyla çalışır)",
    location: "ABD",
  },
  {
    provider: "DeepSeek",
    purpose:
      "İçerik önerisi, aksiyon planı ve marka iddialarına dayalı metin üretimi; sınıflandırma ve özetleme.",
    data: "Prompt metinleri, bilgi bankası pasajları, marka iddiaları ve ölçüm çıktıları.",
    role: "Veri işleyen",
    location: "Çin / bölgesel uç noktalar",
  },
  {
    provider: "Firecrawl",
    purpose:
      "JavaScript ile üretilen sayfaların render edilerek metne dönüştürülmesi (statik tarama başarısız olduğunda yedek).",
    data: "Taranacak URL'ler ve dönen sayfa içerikleri.",
    role: "Veri işleyen",
    location: "ABD",
  },
  {
    provider: "Google (Search Console, Analytics 4, OAuth)",
    purpose:
      "Bağladığınız mülklere ait arama ve trafik metriklerinin okunması, yapay zeka kaynaklı referans trafiğinin sınıflandırılması ve hesap doğrulaması.",
    data: "OAuth erişim/yenileme anahtarları, mülk kimlikleri, sorgu/tıklama/oturum metrikleri, referans alan adları.",
    role: "Bağımsız veri sorumlusu (Google kendi hizmetleri için) + OneCite yönünden veri işleyen ilişkisi",
    location: "AB / ABD",
  },
  {
    provider: "Bing Webmaster Tools (Microsoft)",
    purpose:
      "Bing organik performansı ile Copilot ve iş ortağı seçilen kaynaklarnın okunması.",
    data: "API anahtarı, site kimliği, sorgu ve tıklama metrikleri.",
    role: "Bağımsız veri sorumlusu (Microsoft) + OneCite yönünden veri işleyen ilişkisi",
    location: "AB / ABD",
  },
  {
    provider: "Lovable Cloud (Supabase altyapısı)",
    purpose: "Veritabanı, kimlik doğrulama, dosya saklama ve sunucu fonksiyonlarının çalıştırılması.",
    data: "Hesap bilgileri, marka ve ölçüm kayıtları, bilgi bankası içerikleri ve embedding vektörleri, entegrasyon anahtarları.",
    role: "Veri işleyen",
    location: "AB",
  },
  {
    provider: "Paddle",
    purpose: "Abonelik satışı, faturalandırma ve vergi yükümlülüklerinin yerine getirilmesi.",
    data: "Ad, e-posta, fatura ve ödeme bilgileri (kart verisi OneCite'a iletilmez).",
    role: "Kayıtlı satıcı (Merchant of Record) — kendi işleme faaliyetlerinde bağımsız veri sorumlusu",
    location: "AB / İngiltere",
  },
];

const PURPOSES = [
  {
    title: "Hesap ve erişim yönetimi",
    body: "Kayıt, giriş, plan/kota kontrolü ve destek taleplerinin yürütülmesi.",
    basis: "Sözleşmenin ifası (KVKK m.5/2-c, GDPR m.6/1-b)",
  },
  {
    title: "Site tarama, chunking ve embedding",
    body:
      "Bildirdiğiniz alan adlarının taranması, içeriğin bölümlenmesi ve marka zekası için vektörleştirilmesi. Ziyaretçi tarafındaki tetikleme yalnızca açık onay verildiğinde başlar.",
    basis: "Açık rıza (ziyaretçi) / sözleşmenin ifası (müşteri hesabı)",
  },
  {
    title: "Yapay zeka görünürlük ölçümü",
    body: "Promptların yapay zeka motorlarına gönderilmesi, kaynak gösterimi analizinin yapılması, skor üretilmesi.",
    basis: "Sözleşmenin ifası ve meşru menfaat",
  },
  {
    title: "Entegrasyon verilerinin senkronu",
    body: "GSC, GA4 ve Bing verilerinin günlük otomatik yenilenmesi ve panelde raporlanması.",
    basis: "Açık talimatınız ve sözleşmenin ifası",
  },
  {
    title: "Analitik ve ürün iyileştirme",
    body: "Kullanım ölçümü ve hata takibi. Onay vermediğiniz sürece izleme çağrısı tetiklenmez.",
    basis: "Açık rıza",
  },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function DataProcessingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 md:px-6">
          <BrandLogo variant="horizontal" size="sm" linkTo="/" />
          <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            ← Ana sayfaya dön
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
        <h1 className="mb-1 text-2xl font-semibold">Veri İşleme Metni</h1>
        <p className="mb-8 text-sm text-muted-foreground">Son güncelleme: {LAST_UPDATED}</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <Section title="1. Roller">
            <p className="text-muted-foreground">
              OneCite hizmetini {CONTROLLER_NAME} sunar. Hesap sahibi müşterilerimizin panellerine yükledikleri
              içerik, bilgi bankası ve entegrasyon verileri bakımından <strong>müşteri veri sorumlusudur</strong>,
              OneCite ise bu verileri yalnızca müşterinin talimatıyla işleyen <strong>veri işleyendir</strong>.
              OneCite kendi web sitesi ziyaretçileri, pazarlama ve faturalandırma faaliyetleri bakımından{" "}
              <strong>veri sorumlusu</strong> sıfatıyla hareket eder.
            </p>
          </Section>

          <Section title="2. İşleme amaçları ve hukuki dayanaklar">
            <div className="space-y-3">
              {PURPOSES.map((item) => (
                <div key={item.title} className="rounded-lg border border-border/60 p-3">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-muted-foreground">{item.body}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">Dayanak: {item.basis}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="3. Sağlayıcılar, aktarılan veriler ve rol tanımları">
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="p-3 font-medium">Sağlayıcı</th>
                    <th className="p-3 font-medium">Amaç</th>
                    <th className="p-3 font-medium">Aktarılan veri</th>
                    <th className="p-3 font-medium">Rol</th>
                    <th className="p-3 font-medium">Konum</th>
                  </tr>
                </thead>
                <tbody>
                  {PROVIDERS.map((row) => (
                    <tr key={row.provider} className="border-t border-border/60 align-top">
                      <td className="p-3 font-medium text-foreground">{row.provider}</td>
                      <td className="p-3 text-muted-foreground">{row.purpose}</td>
                      <td className="p-3 text-muted-foreground">{row.data}</td>
                      <td className="p-3 text-muted-foreground">{row.role}</td>
                      <td className="p-3 text-muted-foreground">{row.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              Yurt dışına aktarımlarda standart sözleşme hükümleri ve sağlayıcıların kendi veri işleme
              taahhütlerine dayanılır. Yapay zeka sağlayıcılarına gönderilen içeriklerin model eğitiminde
              kullanılmaması için kurumsal/API uç noktaları tercih edilir.
            </p>
          </Section>

          <Section title="4. Saklama süreleri">
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Hesap ve marka kayıtları: hesap aktif olduğu sürece, kapanıştan sonra 90 gün.</li>
              <li>Ölçüm sonuçları ve kaynak gösterimi kayıtları: 24 ay.</li>
              <li>Bilgi bankası içerikleri ve embedding vektörleri: siz silene kadar.</li>
              <li>Önbelleğe alınan yapay zeka yanıtları: 30 gün.</li>
              <li>Fatura kayıtları: mevzuat gereği 10 yıl (Paddle nezdinde).</li>
            </ul>
          </Section>

          <Section title="5. Onay yönetimi">
            <p className="text-muted-foreground">
              Analitik izleme ile ziyaretçi tarafındaki site tarama/embedding işlemleri yalnızca açık onayınızla
              çalışır. Onayınızı istediğiniz zaman geri alabilirsiniz; geri alma, önceki işlemelerin hukuka
              uygunluğunu etkilemez.
            </p>
            <Button variant="outline" size="sm" onClick={() => openConsentPreferences()}>
              Çerez tercihlerini yönet
            </Button>
          </Section>

          <Section title="6. Haklarınız ve iletişim">
            <p className="text-muted-foreground">
              KVKK m.11 ve GDPR m.15-22 kapsamındaki taleplerinizi{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-foreground">
                {CONTACT_EMAIL}
              </a>{" "}
              adresine iletebilirsiniz. Ayrıca{" "}
              <Link to="/privacy" className="underline hover:text-foreground">
                Gizlilik Politikası
              </Link>{" "}
              ve{" "}
              <Link to="/kvkk" className="underline hover:text-foreground">
                KVKK Aydınlatma Metni
              </Link>{" "}
              belgelerimizi inceleyebilirsiniz.
            </p>
          </Section>
        </div>
      </main>
    </div>
  );
}
