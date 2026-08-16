import { createFileRoute, Link } from "@tanstack/react-router";
import BrandLogo from "@/components/site/BrandLogo";

const SELLER_NAME = "Bora Kurum";
const CONTACT_EMAIL = "info@ragsignal.com";
const LAST_UPDATED = "16 Ağustos 2026";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "İade Politikası | OneCite" },
      { name: "description", content: "OneCite 30 günlük koşulsuz iade garantisi: iade talebinizi nasıl oluşturacağınızı ve süreci öğrenin." },
      { property: "og:title", content: "İade Politikası | OneCite" },
      { property: "og:description", content: "30 gün içinde koşulsuz iade. İade talepleri Paddle üzerinden işlenir." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "https://1cite.com/refund-policy" },
    ],
    links: [{ rel: "canonical", href: "https://1cite.com/refund-policy" }],
  }),
  component: RefundPolicyPage,
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

function RefundPolicyPage() {
  return (
    <LegalShell title="İade Politikası">
      <Section title="30 günlük iade garantisi">
        <p>
          OneCite aboneliklerinde 30 günlük koşulsuz iade garantisi sunuyoruz. Hizmetten memnun kalmazsanız,
          sipariş tarihinizden itibaren 30 gün içinde talep etmeniz halinde ödemenizin tamamını iade ediyoruz.
          Gerekçe belirtmeniz gerekmez.
        </p>
      </Section>

      <Section title="Nasıl iade talep edilir">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Ödemeleriniz, Kayıtlı Satıcımız (Merchant of Record) Paddle tarafından işlenir. İade talebinizi{" "}
            <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              paddle.net
            </a>{" "}
            üzerinden, sipariş e-postanızla oluşturabilirsiniz.
          </li>
          <li>
            Dilerseniz{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-foreground">{CONTACT_EMAIL}</a>{" "}
            adresine yazın; talebinizi sizin adınıza Paddle'a iletelim.
          </li>
          <li>Onaylanan iadeler, ödemeyi yaptığınız yönteme banka sürelerine bağlı olarak 5–10 iş gününde yansır.</li>
        </ul>
      </Section>

      <Section title="Yenileme ve iptaller">
        <p>
          Abonelikler dönem sonunda otomatik yenilenir. Panelinizdeki plan sayfasından dilediğiniz zaman iptal
          edebilirsiniz; erişiminiz ödemesi yapılmış dönemin sonuna kadar devam eder. Yenileme ödemesi
          beklenmedik şekilde alındıysa, yenileme tarihinden sonraki 30 gün içinde iade talep edebilirsiniz.
        </p>
      </Section>

      <Section title="Paddle iade koşulları">
        <p>
          Bu politikaya ek olarak Paddle'ın iade politikası uygulanır:{" "}
          <a href="https://www.paddle.com/legal/refund-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            paddle.com/legal/refund-policy
          </a>
          . Ayrıntılı sözleşme şartları için{" "}
          <Link to="/terms" className="underline hover:text-foreground">Kullanım Koşulları</Link> sayfamıza bakınız.
        </p>
        <p>Satıcı: {SELLER_NAME}</p>
      </Section>
    </LegalShell>
  );
}
