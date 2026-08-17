# Sitenin İngilizce Versiyonu (TR + EN)

Site iki dilli olacak: Türkçe kök adreste kalır, İngilizce `/en/...` altında yayınlanır. Kapsam: landing + alt sayfalar, panel arayüzü ve blog.

## 1. Dil altyapısı

- Hafif, bağımlılıksız bir sözlük katmanı: `src/i18n/` altında `tr.ts` ve `en.ts` anahtar-değer dosyaları, `useT()` hook'u ve `LocaleProvider`.
- Aktif dil URL'den belirlenir (`/en` öneki varsa EN, yoksa TR). Sunucu tarafında da aynı şekilde okunur, böylece SSR çıktısı doğru dilde gelir.
- Seçim `localStorage` + çerezde saklanır; sonraki ziyaretlerde otomatik yönlendirme buna saygı duyar.

## 2. URL yapısı ve yönlendirme

- TR: `1cite.com/ozellikler`, `1cite.com/fiyatlandirma` ... (değişmez, mevcut SEO korunur)
- EN: `1cite.com/en/features`, `/en/pricing`, `/en/about`, `/en/articles`, `/en/articles/:slug`, `/en/free-ai-visibility-report` vb. İngilizce slug'lar okunabilir olacak, TR slug'ın kopyası olmayacak.
- İlk ziyarette tarayıcı dili Türkçe değilse ve kullanıcı daha önce dil seçmemişse `/en` karşılığına yönlendirme yapılır (bot'lar yönlendirilmez, arama motorları her iki sürümü de tarayabilir).
- Header'a sade bir dil değiştirici (TR / EN) eklenir; kullanıcı bulunduğu sayfanın karşılığına gider.

## 3. Çevrilecek sayfalar

Pazarlama: ana sayfa, özellikler, fiyatlandırma, hakkımızda, ajanslar için çözümler, ücretsiz rapor, atıf payı / kanıt boşlukları sayfaları, makaleler listesi ve detay, vaka çalışması.
Yasal: kullanım koşulları, gizlilik, KVKK (EN'de "Data Protection" olarak uyarlanır), iade politikası, veri işleme.
Panel: yan menü, dashboard, promptlar, rakipler, marka zekası, bilgi bankası, görevler, ölçüm, entegrasyonlar, ayarlar, plan/fatura, onboarding sihirbazı, hint metinleri, hata ve boş durum mesajları.

Metinleri ben yazacağım (pazarlama tonuna uygun serbest çeviri); ayrı dosyalarda tutulacağı için sonradan tek yerden düzeltebilirsin.

## 4. Blog / içerik

- `blog_posts` tablosuna `locale` alanı eklenir; her yazı TR veya EN olarak işaretlenir ve isteğe bağlı olarak karşılık yazıya bağlanır (`translation_of`).
- Admin blog modülünde dil seçimi ve "karşılık yazı" alanı eklenir.
- Mevcut yazılar TR olarak işaretlenir; EN tarafı boş başlar, sen ekledikçe `/en/articles` dolar.

## 5. SEO

- Her sayfada `hreflang` etiketleri (tr, en, x-default) ve kendine dönen `canonical`.
- `head()` başlık/açıklama/OG metinleri dile göre.
- Sitemap TR ve EN URL'lerini birlikte, hreflang eşlemesiyle listeler.
- `<html lang>` aktif dile göre; `llms.txt` ve JSON-LD şemaları da iki dilli olur.
- Ücretsiz rapor akışı ve GA4 event'leri dil boyutuyla etiketlenir.

## 6. Uygulama sırası

1. i18n altyapısı, dil değiştirici, yönlendirme, hreflang/sitemap
2. Landing + alt sayfalar EN
3. Yasal sayfalar EN
4. Panel arayüzü EN
5. Blog dil alanı + admin desteği

## Teknik notlar

- `src/i18n/{index.ts,tr.ts,en.ts}`, `LocaleProvider` `__root.tsx` içine bağlanır.
- EN rotaları `src/routes/en/*` altında dosya bazlı olarak tanımlanır; sayfa gövdeleri ortak bileşenlere taşınır ki iki dil aynı tasarımı paylaşsın (kod kopyalanmaz).
- Yönlendirme `__root.tsx` `beforeLoad` içinde çerez + `Accept-Language` okunarak yapılır.
- Blog için tek migration: `locale text not null default 'tr'`, `translation_of uuid null`, ilgili index ve mevcut RLS politikalarının korunması.
