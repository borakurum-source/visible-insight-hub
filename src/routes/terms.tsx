import { createFileRoute, Link } from "@tanstack/react-router";
import BrandLogo from "@/components/site/BrandLogo";

const SELLER_NAME = "Bora Kurum";
const SELLER_ADDRESS = "Kozyatağı Mah., Kaya Sultan Sok., Hayriye İş Merkezi No:83/3, Kadıköy, İstanbul, TR";
const CONTACT_EMAIL = "info@ragsignal.com";
const LAST_UPDATED = "16 Ağustos 2026";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Kullanım Koşulları | OneCite" },
      { name: "description", content: "OneCite kullanım koşulları: hizmet kapsamı, ödeme ve abonelik şartları, fikri mülkiyet, sorumluluk ve fesih hükümleri." },
      { property: "og:title", content: "Kullanım Koşulları | OneCite" },
      { property: "og:description", content: "OneCite hizmetini kullanırken geçerli olan sözleşme şartları." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "https://1cite.com/terms" },
    ],
    links: [{ rel: "canonical", href: "https://1cite.com/terms" }],
  }),
  component: TermsPage,
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

function TermsPage() {
  return (
    <LegalShell title="Kullanım Koşulları">
      <Section title="1. Taraflar ve kabul">
        <p>
          Bu Kullanım Koşulları, OneCite markası altında hizmet veren {SELLER_NAME} ({SELLER_ADDRESS}) ile
          hizmeti kullanan kişi veya kurum ("Kullanıcı") arasındaki sözleşmeyi oluşturur. Hizmete kaydolarak,
          giriş yaparak veya kullanmaya devam ederek bu koşulları kabul etmiş olursunuz. Bir şirket adına
          kullanıyorsanız o şirketi bağlama yetkisine sahip olduğunuzu; bireysel kullanıyorsanız reşit
          olduğunuzu beyan edersiniz.
        </p>
      </Section>

      <Section title="2. Hizmet tanımı">
        <p>
          OneCite, markanızın yapay zeka yanıt motorlarındaki (LLM/AI arama) görünürlüğünü ölçen, atıf
          kaynaklarını listeleyen, içerik ve aksiyon önerileri üreten bir SaaS platformudur. Seçtiğiniz plan
          kapsamında, sınırlı, münhasır olmayan ve devredilemez bir kullanım hakkı verilir.
        </p>
      </Section>

      <Section title="3. Hesap ve doğru bilgi">
        <p>
          Giriş bilgilerinizin gizliliğinden ve hesabınız altında gerçekleşen tüm işlemlerden siz
          sorumlusunuz. Kayıt sırasında doğru bilgi vermeli ve güncel tutmalısınız.
        </p>
      </Section>

      <Section title="4. Kötüye kullanım yasağı">
        <p>Hizmeti aşağıdaki amaçlarla kullanamazsınız:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Yürürlükteki mevzuata aykırı her türlü faaliyet;</li>
          <li>Dolandırıcılık, yanıltıcı içerik üretimi veya spam;</li>
          <li>Üçüncü kişilerin fikri mülkiyet, kişilik veya gizlilik haklarının ihlali;</li>
          <li>Güvenliği tehdit eden davranışlar: zararlı yazılım yükleme, sistem tarama/sızma denemesi,
              izinsiz veri kazıma (scraping), teknik limitlerin aşılması;</li>
          <li>Hizmetin tersine mühendisliği, yeniden satışı veya yetkisiz dağıtımı.</li>
        </ul>
      </Section>

      <Section title="5. Yapay zeka çıktıları ve sorumlu kullanım">
        <ul className="list-disc pl-5 space-y-1">
          <li>Girdiğiniz prompt, marka ve içerik verilerinden; bu verileri kullanma hakkına sahip olmanızdan ve
              çıktıları nasıl kullandığınızdan siz sorumlusunuz.</li>
          <li>Yapay zeka çıktıları hatalı, eksik veya güncel olmayabilir. Hukuki, mali, tıbbi veya diğer
              düzenlemeye tabi profesyonel tavsiye yerine geçmez; yayımlamadan önce doğrulamanız gerekir.</li>
          <li>Yasa dışı içerik, nefret söylemi, yanıltıcı taklit (deepfake), zararlı yazılım üretimi ve model
              güvenlik önlemlerinin aşılması (jailbreak) yasaktır.</li>
          <li>Girdi ve çıktılara ilişkin fikri mülkiyet hakları, ilgili hak sahibine aittir. Hak ihlali
              iddianızı {CONTACT_EMAIL} adresine bildirebilirsiniz; haklı bildirimler üzerine içerik kaldırılır,
              tekrarlayan ihlallerde hesap askıya alınır veya kapatılır.</li>
          <li>İçeriği kaldırma, kısıtlama, çıktıları filtreleme ve hesapları askıya alma hakkımız saklıdır.</li>
        </ul>
      </Section>

      <Section title="6. Fikri mülkiyet">
        <p>
          Hizmete ilişkin tüm yazılım, arayüz, dokümantasyon ve marka unsurlarının mülkiyeti {SELLER_NAME}'a
          aittir. Hizmete yüklediğiniz içerik size ait kalır; yalnızca hizmeti sunabilmek amacıyla bu içeriği
          barındırma ve işleme lisansı verirsiniz.
        </p>
      </Section>

      <Section title="7. Ödeme, abonelik ve satıcı bilgisi">
        <p>
          Sipariş sürecimiz, çevrimiçi bayimiz Paddle.com tarafından yürütülmektedir. Paddle.com tüm
          siparişlerimiz için Kayıtlı Satıcıdır (Merchant of Record). Paddle, tüm müşteri hizmetleri
          taleplerini yanıtlar ve iadeleri yönetir.
        </p>
        <p>
          Ödeme, faturalandırma, vergi, abonelik yenileme, iptal ve iade mekanikleri Paddle'ın alıcı şartlarına
          tabidir:{" "}
          <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            paddle.com/legal/checkout-buyer-terms
          </a>
          . Abonelikler, iptal edilmedikçe seçtiğiniz dönem (aylık/yıllık) sonunda otomatik yenilenir. İptal
          ettiğinizde erişiminiz, ödemesi yapılmış dönemin sonuna kadar devam eder.
        </p>
      </Section>

      <Section title="8. İade">
        <p>
          İade koşulları için <Link to="/refund-policy" className="underline hover:text-foreground">İade Politikası</Link>{" "}
          sayfamıza bakınız.
        </p>
      </Section>

      <Section title="9. Hizmet seviyesi ve garanti reddi">
        <p>
          Hizmetin kesintisiz veya hatasız çalışacağı garanti edilmez. Yürürlükteki mevzuatın izin verdiği azami
          ölçüde, satılabilirlik ve belirli bir amaca uygunluk dahil olmak üzere tüm zımni garantiler reddedilir.
        </p>
      </Section>

      <Section title="10. Sorumluluğun sınırı">
        <p>
          Toplam sorumluluğumuz, talebin doğduğu tarihten önceki 12 ay içinde tarafımıza ödediğiniz ücretlerle
          sınırlıdır. Kar kaybı, veri kaybı veya itibar kaybı gibi dolaylı ve netice kabilinden zararlardan
          sorumlu değiliz. Kasıt, ağır kusur, ölüm ve bedensel zarar halleri ile mevzuatın sınırlamaya izin
          vermediği durumlar bu kapsamın dışındadır.
        </p>
      </Section>

      <Section title="11. Tazminat">
        <p>
          Yüklediğiniz içerikten, hukuka aykırı kullanımınızdan veya bu koşulları ihlalinizden doğan üçüncü kişi
          taleplerine karşı bizi tazmin etmeyi kabul edersiniz.
        </p>
      </Section>

      <Section title="12. Askıya alma ve fesih">
        <p>
          Esaslı ihlal, ödeme yapılmaması, güvenlik/dolandırıcılık riski veya tekrarlayan politika ihlalleri
          halinde erişiminizi askıya alabilir veya sözleşmeyi feshedebiliriz. Fesih sonrası verilerinizi dışa
          aktarmanız için makul bir süre tanınır; ardından veriler silinir. Hizmeti dilediğiniz zaman
          panelinizden iptal edebilirsiniz.
        </p>
      </Section>

      <Section title="13. Devir, mücbir sebep ve uygulanacak hukuk">
        <p>
          Bu sözleşmeden doğan haklarınızı onayımız olmadan devredemezsiniz; birleşme veya devralma halinde biz
          devredebiliriz. Makul kontrolümüz dışındaki olaylar süresince edimlerimiz askıya alınır. Bu koşullara
          Türkiye Cumhuriyeti hukuku uygulanır ve uyuşmazlıklarda İstanbul (Anadolu) mahkemeleri ile icra
          daireleri yetkilidir.
        </p>
      </Section>

      <Section title="14. İletişim">
        <p>
          {SELLER_NAME} — {SELLER_ADDRESS} ·{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-foreground">{CONTACT_EMAIL}</a>
        </p>
      </Section>
    </LegalShell>
  );
}
