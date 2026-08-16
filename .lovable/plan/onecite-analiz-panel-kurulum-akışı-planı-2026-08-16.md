# OneCite: Analiz + Panel Kurulum Akışı Planı

## Bugünkü durum (kod okumasıyla doğrulandı)

- 21 marketing + 20 panel rotası portlandı; panel tamamen `src/lib/panel-mock/*` içindeki sahte veriyle çalışıyor.
- `/app` altında **hiçbir giriş koruması yok** — `src/routes/app.tsx` içinde auth/redirect kodu bulunmuyor. Giriş yapmamış herkes paneli görüyor.
- Google girişi `/auth` sayfasında çalışıyor ama oturum panelde kullanılmıyor (kullanıcı adı hâlâ mock "Elif Aydın").
- Rol/yetki tablosu yok; `/app/admin` herkese açık.
- Kurulum sayfası (`/app/onboarding`) sadece statik bir kontrol listesi; marka ekleme formu yok.
- Şema Neon'da; uygulama tarafında kullanılmıyor. Karar: gerçek veri Lovable Cloud'a taşınacak.

## Analiz ve geliştirme önerileri

### Landing + alt sayfalar
- Tek gerçek dönüşüm yolu net değil: "Giriş yap", "Ücretsiz rapor", "Demo" CTA'ları yarışıyor. Öneri: tek birincil CTA = "Ücretsiz AI görünürlük raporu" (domain input), ikincil = giriş.
- `/free-ai-readiness-report` formu şu an sonuç üretmiyor; e-posta altyapısı kurulu olduğu için lead → e-posta → panel davetine bağlanmalı.
- Alt sayfalarda (platform, solutions, makaleler) sayfa sonu CTA'ları ve iç linkleme zayıf; her sayfaya bağlama uygun tek CTA bloğu.
- SEO: makale detayında yazar/tarih/JSON-LD (Article), platform sayfalarında FAQ şeması eksik.
- Fiyatlandırma: plan farkları özellik bazlı değil; "kaç marka / kaç prompt / kaç tarama" gibi ölçülebilir limitler.

### Panel
- 20 ekran, 6 nav grubu — yeni kullanıcı için fazla. Öneri: kurulum tamamlanmadan yalnızca Komuta Merkezi + Kurulum görünsün, diğerleri kilitli/gri.
- Nav sadeleştirme: "Prompt Keşfi" ve "Kaynak Keşfi" ilgili ana sayfaların sekmesi olsun; "İddialar" + "Bilgi Grafiği" Bilgi Bankası altına.
- Boş durum ekranları yok (mock veri her yerde dolu). Her ekrana "henüz veri yok + tek aksiyon" durumu.
- Marka seçici (workspace switcher) header'da yok; çoklu marka desteği görünmüyor.
- Admin ekranı rol kontrolü olmadan açık — güvenlik açığı.

## Yapılacak iş

### 1. Auth ve roller (Lovable Cloud)
- Panel rotalarını korumalı düzene taşı; giriş yapmamış kullanıcı `/auth`'a gitsin.
- `profiles` (kullanıcı adı/e-posta/avatar) ve ayrı `user_roles` tablosu (`admin` / `member`) + `has_role()` güvenlik fonksiyonu.
- `bora@1cite.com` ilk girişte otomatik `admin` (e-posta eşleşmesiyle tetikleyici) — Admin menüsü sadece adminlere.
- Header'daki kullanıcı bilgisi ve çıkış gerçek oturumdan gelsin.

### 2. Veri modeli (Cloud'a taşınan çekirdek)
Neon şemasının panelde gerçekten kullanılan çekirdeği: `brands`, `brand_domains`, `brand_intelligence`, `knowledge_sources`, `prompts`, `prompt_runs`, `citations`, `claims`, `geo_tasks`, `reports`. Hepsi marka üyeliğine göre RLS ile korunur.

### 3. Kurulum sihirbazı — gerçek yol
Giriş sonrası markası olmayan kullanıcı doğrudan `/app/onboarding` sihirbazına düşer. Dört adım, her adımda AI üretir + kullanıcı onaylar:

```text
1. MARKA          domain + marka adı  → kaydet
2. MARKA ZEKÂSI   AI: site taraması → konum, ürünler, kitle, rakipler, ton
                  kullanıcı düzenler/onaylar
3. BİLGİ BANKASI  AI: sitemap/öne çıkan sayfalar önerir + manuel URL/metin
                  kullanıcı seçer → kaynak olarak kaydedilir
4. PROMPTLAR      AI: 20-30 aday prompt (marka zekâsı + KB'den)
                  kullanıcı toplu onay/çıkarma → ilk tarama tetiklenir
                  → Komuta Merkezi'ne yönlendirme
```

Kurallar: her adım kaydedilir, sihirbaz yarıda bırakılıp devam edilebilir; ilerleme çubuğu 4 adım; teknik terim yerine sade Türkçe açıklama; "Neden soruyoruz?" mikro metinleri; hiçbir adımda kullanıcıdan boş sayfaya yazı yazması istenmez.

### 4. Panelin gerçek veriye bağlanması
Komuta Merkezi, Promptlar, Bilgi Bankası, İddialar ilk turda mock'tan çıkar; kalan ekranlar (Grafik, İçerik, Görevler, Rapor, Entegrasyonlar) mock kalmaya devam eder ve sırayla bağlanır.

## Teknik notlar
- Auth gate `_authenticated` düzeninde, `ssr: false`; panel rotaları oraya taşınır (URL'ler `/app/...` olarak korunur).
- Veri erişimi `createServerFn` + `requireSupabaseAuth` ile; tablolarda RLS marka üyeliğine bağlı.
- AI adımları (marka zekâsı, prompt üretimi) Lovable AI Gateway üzerinden, ayrı anahtar gerekmez.
- Neon'daki tablolar bozulmadan kalır; uygulama Cloud'u kullanır.

## Sıralama
1. Auth gate + roller + admin ataması
2. Çekirdek tablolar + RLS
3. Kurulum sihirbazı (4 adım, AI + onay)
4. Komuta Merkezi ve ilk 3 ekranın gerçek veriye bağlanması
5. Nav sadeleştirme, boş durumlar, marka seçici
6. Landing/CTA ve SEO iyileştirmeleri
