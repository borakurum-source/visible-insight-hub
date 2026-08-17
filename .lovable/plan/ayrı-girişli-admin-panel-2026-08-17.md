# Ayrı girişli Admin Panel

Mevcut `/app/admin` sayfası kaldırılıp, müşteri panelinden tamamen ayrı bir yönetim paneli kurulacak: kendi giriş ekranı (`/admin/login`), kendi kabuğu (menü, üst bar) ve yalnızca admin rolü olan hesaplara açık rotalar.

## Giriş ve erişim

- `/admin/login`: e-posta + parola ile ayrı giriş ekranı. Panelin markalı arayüzünden farklı, sade ve koyu bir yönetim görünümü.
- Giriş sonrası admin rolü kontrol edilir; rol yoksa oturum kapatılır ve "yetkiniz yok" mesajı gösterilir.
- `/admin/*` altındaki tüm sayfalar rol kontrollü bir katman altında toplanır.
- Tüm yönetim sunucu fonksiyonları kendi içinde ayrıca admin rolünü doğrular (arayüz kontrolü tek başına güvenlik değildir).
- Eski `/app/admin` sayfası silinir, müşteri panelinin yan menüsünden "Admin" grubu kaldırılır; eski adres `/admin` adresine yönlendirilir.

## Sayfalar

### 1. Genel bakış (`/admin`)
Toplam müşteri, aktif abonelik, deneme süresi bitenler, bu ay yapılan ölçüm sayısı, son 24 saatteki hata sayısı, tahmini API maliyeti. Son kayıtlar ve son hatalar listesi.

### 2. Müşteriler (`/admin/customers`)
- Hesap listesi: e-posta, ad, plan, deneme bitişi, marka sayısı, kayıt tarihi; arama ve plana göre filtreleme.
- Müşteri detayı: markalar, üyeler, kullanım (prompt / rakip / içerik / aylık yanıt), abonelik geçmişi, entegrasyon durumu (GSC, GA4, Bing), son hatalar.
- İşlemler: bedelsiz plan değişikliği (plan + bitiş tarihi ile), deneme süresi uzatma, hesabı askıya alma, hesabı ve verilerini kalıcı silme (yazarak onay), kullanıcı adına oturum açmadan destek notu ekleme.

### 3. Abonelikler (`/admin/subscriptions`)
Ödeme sağlayıcısından gelen abonelikler: durum, dönem bitişi, iptal işaretli olanlar, test/canlı ayrımı. Manuel plan atamalarının abonelikten bağımsız izlenmesi.

### 4. API yönetimi (`/admin/api`)
- Sağlayıcı kartları (Perplexity, DeepSeek, Lovable AI, Firecrawl, Google, Bing): anahtar tanımlı mı, son çağrı, sağlık durumu, açma/kapatma anahtarı.
- Kullanım ve maliyet: sağlayıcı bazlı çağrı sayısı, token tahmini, tahmini tutar; müşteri ve tarih kırılımı; grafikli günlük seyir.
- Hata ve limit: başarısız çağrılar, oran sınırı uyarıları, ortalama ve en yavaş yanıt süreleri.

### 5. Hata logları (`/admin/logs`)
Sunucu ve tarayıcı hataları veritabanına yazılır. Filtreler: seviye, kaynak, müşteri, tarih, çözüldü/çözülmedi. Detayda mesaj, yığın izi, istek yolu, kullanıcı. "Çözüldü" işaretleme ve toplu temizleme.

### 6. E-posta (`/admin/email`)
- Gönderim logları: alıcı, şablon, durum, hata; yeniden gönderme.
- Şablon düzenleme: bildirim ve hesap e-posta şablonlarının panelden düzenlenmesi, önizleme ve test gönderimi.
- Toplu duyuru: plana/duruma göre alıcı seçimi, önizleme, gönderim.
- Kullanıcı işlemleri: doğrulama linkini yeniden gönderme, parola sıfırlama linki, e-posta adresi güncelleme.

### 7. Sistem talimatları (`/admin/system-prompts`)
Mevcut talimat düzenleme ekranı yönetim paneline taşınır: sürüm bilgisi, varsayılana dönme, değişiklik geçmişi.

### 8. Ayarlar (`/admin/settings`)
Plan limitleri ve fiyat tanımlarının görünümü, bakım modu bayrağı, yönetici kullanıcı listesi (rol verme / alma).

## Teknik notlar

- Yeni tablolar: `admin_audit_log` (kim, ne zaman, hangi hesapta ne yaptı), `error_logs` (seviye, kaynak, mesaj, yığın, yol, kullanıcı, çözüldü), `api_usage_log` (sağlayıcı, işlem, müşteri, token, süre, maliyet, hata), `email_logs` (alıcı, şablon, durum, hata), `email_templates` (şablon içeriği ve sürümü), `admin_notes`.
- Tüm tablolar yalnızca servis rolüne açılır; erişim admin doğrulaması yapan sunucu fonksiyonları üzerinden olur.
- API çağrı katmanları (Perplexity, DeepSeek, Lovable AI, Firecrawl, embedding) ortak bir kayıt yardımcısıyla sarılır; her çağrı süre, token ve hata bilgisiyle loglanır.
- Hata yakalama: sunucu tarafında mevcut hata yakalayıcı log tablosuna yazacak şekilde genişletilir; tarayıcı tarafında global hata dinleyicisi eklenir.
- Plan değişikliği, silme ve rol değişikliği gibi hassas işlemler denetim kaydına yazılır.
- Yönetim rotaları arama motorlarına kapalı (`noindex`) olur.

## Uygulama sırası

1. Veritabanı tabloları ve erişim kuralları.
2. Kayıt yardımcıları (hata, API kullanımı, denetim) ve mevcut çağrı katmanlarına bağlanması.
3. Yönetim kabuğu, giriş ekranı ve rol katmanı; eski `/app/admin` kaldırma ve yönlendirme.
4. Müşteriler, abonelikler, genel bakış.
5. API yönetimi ve hata logları.
6. E-posta ve sistem talimatları, ayarlar.
