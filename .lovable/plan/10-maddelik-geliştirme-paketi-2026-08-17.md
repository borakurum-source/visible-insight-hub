# 10 maddelik geliştirme paketi

## 1. Google Analytics verisi gelmiyor
Şu an GA etiketi yalnızca çerez banner'ında "analitik" onayı verildikten sonra JavaScript ile yükleniyor. Google'ın doğrulama botu ve onay vermeyen ziyaretçiler etiketi hiç görmüyor; bu yüzden "Google tag wasn't detected" uyarısı çıkıyor ve veri akmıyor.

Yapılacak: gtag betiği sayfa head'ine her zaman eklenecek, Google Consent Mode v2 ile başlangıçta `analytics_storage: denied` olarak yüklenecek. Onay verilince `consent update` ile açılacak. Böylece etiket tespit edilir, KVKK/GDPR uyumu korunur, onay veren kullanıcılardan tam veri gelir.

## 2. Marka Zekası bilgi setini görünür ve düzenlenebilir yapmak
Marka Zekası sayfasına "Yapay zekaya verilen marka bilgi seti" bölümü eklenecek: özet, konumlandırma, ton, sektör, dil, lokasyon, ürünler, hedef kitleler, temel özellikler, anahtar kelimeler, rakipler. Her alan müşteri tarafından düzenlenip kaydedilebilecek (mevcut kayıt alanı zaten var). Kaydedince ölçüm ve içerik üretimi bu güncel setle çalışacak; "yeniden üret" butonu korunacak.

## 3. Bilgi Bankası sıralaması
Liste iki net bloğa ayrılacak:
- "Sizin kaynaklarınız" (elle veya site haritasından eklenen, indekslenen kaynaklar) üstte,
- "Ölçümden gelen aday kaynaklar" (atıf adayları) altta, tek tıkla kaynağa dönüştürme ile.

## 4. Site haritasından hızlı kaynak ekleme
Bilgi Bankası'na "Site haritasından ekle" paneli: alan adı girilince robots.txt + sitemap.xml taranır, bulunan sayfalar listelenir. Gereksiz sayfalar otomatik elenir (sepet, ödeme, giriş, hesap, etiket/arşiv/sayfalama, arama sonucu, çerez/yasal tekrarları, medya dosyaları, çok kısa içerikler). Kalan sayfalar öncelik sırasıyla gösterilir, toplu seçilip eklenir.

## 5. Admin panel açık tema
Yönetim paneli koyu (#0B1220) yüzeyden okunaklı açık temaya geçirilecek: beyaz/açık gri zemin, koyu metin, ince gri kenarlıklar, marka mavisi vurgular. Tüm admin sayfaları (genel bakış, müşteriler, abonelikler, API, hatalar, e-posta, sistem talimatları, ayarlar) ve giriş ekranı dahil.

## 6. "â" karakterinin tamamen kaldırılması
Arayüz metinleri, e-posta şablonları ve sistem talimatlarındaki "â" karakterleri "a" ile değiştirilecek. Ayrıca AI ile üretilen içerik (içerik taslakları, özetler, aksiyonlar) kaydedilmeden önce normalize edilecek ve sistem talimatlarına "â kullanma" kuralı eklenecek.

## 7. "Komuta Merkezi" adı "Dashboard" olacak
Sol menü, sayfa başlığı, sekme başlığı ve geri dönüş bağlantıları güncellenecek.

## 8. Bing kartı kaldırılıyor
Dashboard'daki "Bing AI Performansı (Copilot ve iş ortakları)" kartı kaldırılacak; ilgili veri çağrısı da yalnızca bu kart için kullanılıyorsa devre dışı bırakılacak.

## 9. Müşteri bazında API harcaması
- Müşteriler listesine "30 günlük API maliyeti" sütunu,
- Müşteri detayında sağlayıcı kırılımı (DeepSeek, Perplexity, Firecrawl, embedding) ve son 30 gün trendi,
- API sayfasına "en çok harcayan müşteriler" tablosu eklenecek.

## 10. Admin blog modülü (SEO + GEO uyumlu)
Blog yazıları veritabanına taşınacak ve panelden yönetilecek:
- Liste, yeni yazı, düzenle, taslak/yayında, silme,
- Markdown editörü + canlı önizleme, kapak görseli yükleme, içeriğe görsel/video (YouTube/Vimeo/mp4) gömme,
- SEO alanları: slug, başlık, meta açıklama, canonical, OG görseli, kategori, etiketler, okuma süresi, yayın tarihi,
- GEO alanları: kısa "cevap özeti" (AI'ların alıntılayacağı net paragraf), SSS blokları, kaynak/veri referansları,
- Otomatik Article + FAQPage + BreadcrumbList JSON-LD, sitemap.xml ve llms.txt'e otomatik dahil olma.
Mevcut 4 markdown makale ilk kurulumda veritabanına aktarılacak; /makaleler ve /makaleler/{slug} bu kayıtlardan render edilecek.

## Teknik notlar
- GA: `src/routes/__root.tsx` head'ine gtag script + Consent Mode default; `src/lib/analytics.ts` onayda `gtag('consent','update')` gönderecek.
- Marka zekası düzenleme: mevcut `brand_intelligence` tablosu ve upsert server fn'i kullanılacak; yeni migration gerekmez.
- Site haritası: `src/lib/ai.server.ts` içindeki sitemap/robots keşif fonksiyonu üzerine filtre + yeni server fn.
- Blog: yeni `blog_posts` tablosu (GRANT + RLS: anon yalnızca yayında olanları okur, admin tam yetki) ve görseller için public storage bucket; public sayfalar publishable key ile server fn üzerinden okur.
- API maliyeti: mevcut `api_usage_log` tablosundan `user_id`/`brand_id` kırılımıyla toplanacak.
