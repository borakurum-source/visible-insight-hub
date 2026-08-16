import { createFileRoute, Link } from "@tanstack/react-router";
import BrandLogo from "@/components/site/BrandLogo";

const CONTROLLER_NAME = "OneCite adına Bora Kurum";
const CONTROLLER_ADDRESS = "Kozyatağı Mah., Kaya Sultan Sok., Hayriye İş Merkezi No:83/3, Kadıköy, İstanbul, TR";
const CONTACT_EMAIL = "info@ragsignal.com";
const LAST_UPDATED = "12 Ağustos 2026";

export const Route = createFileRoute("/kvkk")({
  head: () => ({
    meta: [
      { title: "KVKK Aydınlatma Metni | OneCite" },
      { name: "description", content: "OneCite KVKK aydınlatma metni: veri sorumlusu, işlenen kişisel veriler, işleme amaçları ve haklarınız." },
      { property: "og:title", content: "KVKK Aydınlatma Metni | OneCite" },
      { property: "og:description", content: "OneCite'ın KVKK kapsamında kişisel verilerinizi nasıl işlediğini öğrenin." },
      { name: "robots", content: "noindex" },
      { property: "og:url", content: "https://1cite.com/kvkk" },
    ],
    links: [{ rel: "canonical", href: "https://1cite.com/kvkk" }],
  }),
  component: KvkkPage,
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

function KvkkPage() {
  return (
    <LegalShell title="KVKK Aydınlatma Metni">
      <Section title="1. Veri Sorumlusu">
        <p>
          6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu:{" "}
          <strong>{CONTROLLER_NAME}</strong>
        </p>
        <p>Adres: {CONTROLLER_ADDRESS}</p>
        <p>
          E-posta:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-foreground">{CONTACT_EMAIL}</a>
        </p>
      </Section>

      <Section title="2. İşlenen Kişisel Veriler">
        <ul className="list-disc pl-5 space-y-1">
          <li>Kimlik ve iletişim verisi: ad, e-posta adresi.</li>
          <li>Müşteri ilişkisi verisi: temsil ettiğiniz şirket adı, plan/abonelik bilgisi.</li>
          <li>İşlem güvenliği verisi: oturum ve giriş kayıtları (Clerk üzerinden).</li>
          <li>
            Not: Hizmete girdiğiniz müşteri marka/prompt verisi genellikle kurumsal niteliktedir; ancak marka adı
            veya prompt içeriği dolaylı olarak bir gerçek kişiyle ilişkilendirilebilirse (örn. serbest çalışan adı),
            bu veri de aynı koruma kapsamındadır.
          </li>
        </ul>
      </Section>

      <Section title="3. İşleme Amaçları">
        <ul className="list-disc pl-5 space-y-1">
          <li>Hizmetin sunulması: hesabınızın oluşturulması, oturum açma, plan/yetki yönetimi.</li>
          <li>AI görünürlük ölçümü: tanımladığınız promptların Perplexity Sonar API'si üzerinden çalıştırılması ve sonuçların panelinizde raporlanması.</li>
          <li>Faturalandırma ve plan takibi.</li>
          <li>Destek taleplerinin yanıtlanması.</li>
          <li>Hizmetin güvenliğinin ve sürekliliğinin sağlanması.</li>
        </ul>
      </Section>

      <Section title="4. İşlemenin Hukuki Sebebi">
        <p>
          Kişisel verileriniz, KVKK m.5/2 kapsamında "bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya
          ilgili olma" ve "veri sorumlusunun meşru menfaati" hukuki sebeplerine dayanılarak işlenmektedir.
          Yurt dışına aktarım söz konusu olduğunda (bkz. madde 6), açık rızanız alınır.
        </p>
      </Section>

      <Section title="5. Kişisel Verilerin Aktarıldığı Taraflar">
        <p>
          Verileriniz, hizmetin sunulması amacıyla sınırlı olarak Clerk (kimlik doğrulama/faturalandırma), Neon
          (veritabanı barındırma) ve Perplexity (Sonar API — prompt işleme) alt yüklenicileriyle paylaşılır.
          Verileriniz pazarlama amacıyla üçüncü taraflara satılmaz veya kiralanmaz.
        </p>
      </Section>

      <Section title="6. Yurt Dışına Aktarım">
        <p>
          Madde 5'te sayılan alt yükleniciler altyapılarını Türkiye dışında (AB ve/veya ABD) barındırdığından,
          kişisel verileriniz KVKK m.9 kapsamında yurt dışına aktarılabilir. Hizmete kayıt olarak bu aktarıma
          açık rıza vermiş olursunuz.
        </p>
      </Section>

      <Section title="7. Haklarınız (KVKK m.11)">
        <p>İlgili kişi olarak aşağıdaki haklara sahipsiniz:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Kişisel verinizin işlenip işlenmediğini öğrenme,</li>
          <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
          <li>İşleme amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
          <li>Yurt içinde/dışında aktarıldığı üçüncü kişileri bilme,</li>
          <li>Eksik/yanlış işlenmişse düzeltilmesini isteme,</li>
          <li>Silinmesini veya yok edilmesini isteme,</li>
          <li>Bu işlemlerin aktarılan üçüncü kişilere bildirilmesini isteme,</li>
          <li>Otomatik sistemlerle analiz sonucu aleyhinize bir sonuç çıkmasına itiraz etme,</li>
          <li>Zarara uğramanız halinde zararın giderilmesini talep etme.</li>
        </ul>
        <p>
          Bu haklarınızı kullanmak için{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-foreground">{CONTACT_EMAIL}</a>{" "}
          adresine yazılı olarak başvurabilirsiniz. Başvurunuz en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.
        </p>
      </Section>
    </LegalShell>
  );
}
