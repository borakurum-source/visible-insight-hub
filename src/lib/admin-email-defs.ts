// Yonetim panelinden duzenlenebilen e-posta sablonlari.
// body: basit HTML + {{degisken}} yer tutuculari.
export type EmailTemplateDef = {
  key: string;
  title: string;
  description: string;
  subject: string;
  body: string;
  variables: string[];
};

const shell = (inner: string) => `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#0B1220;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#111A2B;border:1px solid #1F2C42;border-radius:16px;padding:28px;color:#E6EDF7">
    <div style="font-size:18px;font-weight:700;color:#38E1D3;margin-bottom:16px">OneCite</div>
    ${inner}
    <p style="margin-top:28px;font-size:12px;color:#7C8CA6">OneCite · Yapay zeka görünürlük platformu<br/>1cite.com</p>
  </div>
</div>`;

export const TEMPLATE_DEFS: EmailTemplateDef[] = [
  {
    key: "subscription-welcome",
    title: "Abonelik hoş geldiniz",
    description: "Ödeme tamamlandığında gönderilir.",
    subject: "OneCite {{planName}} planınız aktif",
    variables: ["name", "planName", "email"],
    body: shell(`<h1 style="font-size:22px;margin:0 0 12px">Hoş geldiniz {{name}}</h1>
    <p style="line-height:1.6;color:#B9C6D9">{{planName}} planınız aktifleşti. Panelinize giriş yapıp ilk ölçümünüzü başlatabilirsiniz.</p>
    <p><a href="https://1cite.com/app" style="display:inline-block;margin-top:12px;background:#38E1D3;color:#06121C;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">Panele git</a></p>`),
  },
  {
    key: "trial-ending",
    title: "Deneme süresi bitiyor",
    description: "Deneme bitimine 2 gün kala gönderilir.",
    subject: "Deneme süreniz {{days}} gün içinde doluyor",
    variables: ["name", "days"],
    body: shell(`<h1 style="font-size:22px;margin:0 0 12px">Merhaba {{name}}</h1>
    <p style="line-height:1.6;color:#B9C6D9">OneCite deneme süreniz {{days}} gün içinde sona eriyor. Ölçümlerinizin kesintisiz devam etmesi için bir plan seçin.</p>
    <p><a href="https://1cite.com/fiyatlandirma" style="display:inline-block;margin-top:12px;background:#38E1D3;color:#06121C;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">Planları gör</a></p>`),
  },
  {
    key: "trial-expired",
    title: "Deneme süresi doldu",
    description: "Deneme bittiğinde gönderilir.",
    subject: "Deneme süreniz doldu",
    variables: ["name"],
    body: shell(`<h1 style="font-size:22px;margin:0 0 12px">Deneme süreniz sona erdi</h1>
    <p style="line-height:1.6;color:#B9C6D9">{{name}}, verileriniz duruyor. Plan seçtiğinizde ölçümler kaldığı yerden devam eder.</p>`),
  },
  {
    key: "plan-changed",
    title: "Plan değişikliği",
    description: "Yönetici veya müşteri plan değiştirdiğinde gönderilir.",
    subject: "Planınız {{planName}} olarak güncellendi",
    variables: ["name", "planName"],
    body: shell(`<h1 style="font-size:22px;margin:0 0 12px">Plan güncellendi</h1>
    <p style="line-height:1.6;color:#B9C6D9">{{name}}, hesabınız artık {{planName}} planında. Yeni limitleriniz hemen geçerli.</p>`),
  },
  {
    key: "payment-failed",
    title: "Ödeme alınamadı",
    description: "Paddle ödeme hatası bildirimi.",
    subject: "Ödemenizi alamadık",
    variables: ["name"],
    body: shell(`<h1 style="font-size:22px;margin:0 0 12px">Ödeme alınamadı</h1>
    <p style="line-height:1.6;color:#B9C6D9">{{name}}, son ödemeniz başarısız oldu. Ödeme yönteminizi güncellerseniz hizmet kesintisiz devam eder.</p>`),
  },
  {
    key: "account-suspended",
    title: "Hesap askıya alındı",
    description: "Yönetici hesabı askıya aldığında gönderilir.",
    subject: "Hesabınız askıya alındı",
    variables: ["name"],
    body: shell(`<h1 style="font-size:22px;margin:0 0 12px">Hesabınız askıya alındı</h1>
    <p style="line-height:1.6;color:#B9C6D9">{{name}}, hesabınız geçici olarak askıya alındı. Detay için destek@1cite.com adresine yazabilirsiniz.</p>`),
  },
  {
    key: "measurement-ready",
    title: "Ölçüm raporu hazır",
    description: "Ölçüm tamamlandığında gönderilir.",
    subject: "{{brandName}} için yeni görünürlük raporu hazır",
    variables: ["name", "brandName", "score"],
    body: shell(`<h1 style="font-size:22px;margin:0 0 12px">Yeni ölçüm tamamlandı</h1>
    <p style="line-height:1.6;color:#B9C6D9">{{brandName}} markanızın OneCite skoru: <strong style="color:#38E1D3">{{score}}</strong></p>
    <p><a href="https://1cite.com/app" style="display:inline-block;margin-top:12px;background:#38E1D3;color:#06121C;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">Raporu aç</a></p>`),
  },
];

export const TEMPLATE_DEF_MAP: Record<string, EmailTemplateDef> = Object.fromEntries(
  TEMPLATE_DEFS.map((def) => [def.key, def]),
);
