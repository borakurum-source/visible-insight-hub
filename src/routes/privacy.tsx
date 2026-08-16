import { createFileRoute, Link } from "@tanstack/react-router";
import BrandLogo from "@/components/site/BrandLogo";

const CONTROLLER_NAME = "OneCite adına Bora Kurum";
const CONTROLLER_ADDRESS = "Kozyatağı Mah., Kaya Sultan Sok., Hayriye İş Merkezi No:83/3, Kadıköy, İstanbul, TR";
const CONTACT_EMAIL = "info@ragsignal.com";
const LAST_UPDATED = "12 Ağustos 2026";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Gizlilik Politikası | OneCite" },
      { name: "description", content: "OneCite gizlilik politikası: hangi verileri topladığımızı, kimlerle paylaştığımızı ve haklarınızı öğrenin." },
      { property: "og:title", content: "Gizlilik Politikası | OneCite" },
      { property: "og:description", content: "OneCite'ın kişisel verilerinizi nasıl işlediğini öğrenin." },
      { name: "robots", content: "noindex" },
      { property: "og:url", content: "https://1cite.com/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://1cite.com/privacy" }],
  }),
  component: PrivacyPolicyPage,
});

function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <BrandLogo variant="horizontal" size="sm" linkTo="/" />
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Ana sayfaya dön
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-14">
        <h1 className="text-2xl font-semibold mb-1">{title}</h1>
        <p className="text-sm text-muted-foreground mb-8">Son güncelleme: {LAST_UPDATED}</p>
        <div className="prose-legal space-y-6 text-sm leading-relaxed">{children}</div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}

function PrivacyPolicyPage() {
  return (
    <LegalShell title="Gizlilik Politikası">
      <Section title="1. Kapsam">
        <p>
          Bu Gizlilik Politikası, OneCite ({CONTROLLER_NAME}) tarafından işletilen AI görünürlük ölçüm
          platformunun web sitesini ve uygulamasını ("Hizmet") kullanan ziyaretçi, kullanıcı ve müşterilerin
          kişisel verilerinin nasıl işlendiğini açıklar.
        </p>
      </Section>

      <Section title="2. Hangi verileri topluyoruz">
        <ul className="list-disc pl-5 space-y-1">
          <li>Hesap bilgileri: ad, e-posta adresi, organizasyon/şirket adı — Clerk üzerinden hesap oluştururken alınır.</li>
          <li>Müşteri/marka verisi: Hizmete eklediğiniz müşteri firmaların web sitesi adresi, sektör bilgisi ve izlemek istediğiniz sorgu (prompt) metinleri.</li>
          <li>Kullanım verisi: hangi sayfaları ziyaret ettiğiniz, hangi özellikleri kullandığınız (ürünü iyileştirmek için, reklam amaçlı değil).</li>
          <li>Fatura/plan bilgisi: hangi plana kayıtlı olduğunuz. Kredi kartı numaranızı biz görmüyor ve saklamıyoruz — ödeme işlemleri Clerk Billing altyapısı üzerinden yürütülür.</li>
        </ul>
      </Section>

      <Section title="3. Verilerinizi kimle paylaşıyoruz">
        <p>Verileriniz yalnızca hizmeti sunmak için gerekli alt yüklenicilerle paylaşılır:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Clerk</strong> — kimlik doğrulama, oturum yönetimi ve faturalandırma altyapısı.</li>
          <li><strong>Neon (PostgreSQL, AB/Frankfurt bölgesi)</strong> — uygulama veritabanının barındırılması.</li>
          <li><strong>Perplexity Sonar API</strong> — izlemek istediğiniz prompt metinleri, marka bahsi/atıf ölçümü yapılması amacıyla bu API'ye gönderilir ve analiz edilir.</li>
          <li><strong>Google (opsiyonel)</strong> — Search Console/Analytics entegrasyonunu kendi hesabınızla bağlarsanız, yalnızca kendi sitenize ait arama performansı verisi okunur.</li>
        </ul>
        <p>Verileriniz hiçbir şekilde reklam ağlarına satılmaz veya pazarlama amacıyla üçüncü taraflarla paylaşılmaz.</p>
      </Section>

      <Section title="4. Yurt dışına veri aktarımı">
        <p>
          Yukarıda sayılan alt yükleniciler (Clerk, Neon, Perplexity) altyapılarını Türkiye dışında (AB ve/veya ABD)
          barındırabilir. Hizmeti kullanarak verilerinizin bu kapsamda yurt dışına aktarılmasına onay verirsiniz.
          Bu aktarımlar, ilgili alt yüklenicilerin kendi veri koruma taahhütleri çerçevesinde yürütülür.
        </p>
      </Section>

      <Section title="5. Çerezler">
        <p>Hizmet, reklam veya izleme amaçlı hiçbir üçüncü taraf çerezi (Google Analytics, Meta Pixel vb.) kullanmaz. Kullanılan tek çerezler:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Oturum çerezi (Clerk)</strong> — giriş yapmış olduğunuzu hatırlamak için zorunludur.</li>
          <li><strong>Arayüz tercihi çerezi</strong> — kenar çubuğunun açık/kapalı durumunu hatırlar, kişisel veri içermez.</li>
        </ul>
        <p>Bu iki çerez de hizmetin çalışması için zorunlu/işlevsel nitelikte olduğundan ayrıca onay bannerı gerektirmez.</p>
      </Section>

      <Section title="6. Veri saklama süresi">
        <p>
          Verileriniz, hesabınız aktif olduğu sürece saklanır. Hesap silme talebinde bulunduğunuzda, yasal
          saklama zorunluluğu bulunan (örn. faturalandırma) veriler hariç, verileriniz makul bir süre içinde silinir.
        </p>
      </Section>

      <Section title="7. Haklarınız ve iletişim">
        <p>
          Verilerinize erişim, düzeltme veya silme talepleri için{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-foreground">{CONTACT_EMAIL}</a>{" "}
          adresinden bizimle iletişime geçebilirsiniz. Detaylı haklarınız için KVKK Aydınlatma Metni'ne bakınız.
        </p>
        <p>Veri sorumlusu: {CONTROLLER_NAME} — {CONTROLLER_ADDRESS}</p>
      </Section>
    </LegalShell>
  );
}
