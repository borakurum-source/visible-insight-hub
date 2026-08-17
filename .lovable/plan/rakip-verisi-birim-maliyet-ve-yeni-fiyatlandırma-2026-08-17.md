# Rakip verisi, birim maliyet ve yeni fiyatlandırma

## 1. Rakipler — alan adı desteği ve Türkçe düzeltmeler

Bugün rakipler `brand_intelligence.competitors` içinde sadece **metin adı** olarak tutuluyor
(`["Hipaş Plastik", ...]`). Bu yüzden:
- Atıf kaynaklarındaki alan adı ile rakip eşleşmesi zayıf tahminle yapılıyor (ad geçiyor mu diye string arama).
- "Sorgu sonuçlarından çıkan adaylar" listesinde çıkan domainler tek tıkla takibe alınamıyor.

Yapılacak:
- Rakip kaydı `{ name, domain }` yapısına geçer (aynı jsonb sütunu; eski düz metin kayıtları
  okunurken otomatik `{ name, domain: "" }` olarak normalize edilir — veri kaybı yok, migration gerekmez).
- Rakip ekleme formuna "Alan adı" alanı gelir; AI rakip arama zaten domain döndürüyor, artık kaydedilir.
- Ölçümde eşleşme domain öncelikli olur: yanıt metni + atıf domaini birlikte kontrol edilir →
  rakip görünürlük yüzdeleri belirgin şekilde doğrulaşır (Komuta Merkezi'ndeki karşılaştırmalı çizgi grafiği dahil).
- "Sorgu sonuçlarından çıkan adaylar" satırlarına **"Takibe al"** butonu eklenir (domain ile birlikte ekler).
- `app.competitors.tsx` ve `competitor-finder.tsx` içindeki bozuk Türkçe metinler düzeltilir:
  "Sorgu sonuclarindan çıkan adaylar", "kaynak gosterildi", "yukaridaki alandan ekleyin",
  "one çıkan", "Markani ekle", "calistirdiginizda" vb.

## 2. Birim maliyet hesabı (aylık, kullanıcı başına)

Ölçüm başına gerçekleşen maliyet kalemleri:

| Kalem | Varsayım | Birim maliyet |
|---|---|---|
| Perplexity `sonar` ölçüm sorgusu (arama + yanıt) | ~1.5K token + 1 arama | ~$0.012 / prompt çalıştırma |
| Perplexity embedding (bilgi bankası indeksleme) | ~50 parça / marka / ay | ~$0.01 / ay |
| DeepSeek (prompt üretimi, içerik, aksiyon) | ~4K token / üretim | ~$0.004 / üretim, makale ~$0.03 |
| Lovable Cloud (DB + fonksiyon + cron) | paylaşımlı | ~$0.30–0.60 / aktif marka / ay |
| Paddle (MoR komisyonu) | %5 + $0.50 işlem başına | fiyatın ~%5,5–6'sı |

Plan bazında aylık maliyet (ölçüm ayda 4 kez / haftalık çalışır varsayımıyla):

| Plan | Ölçülen yanıt / ay | AI maliyeti | Cloud | Paddle | Toplam maliyet | Öneri fiyat | Brüt marj |
|---|---|---|---|---|---|---|---|
| Ücretsiz | 5 prompt × 2 = 10 | ~$0,15 | ~$0,30 | – | ~$0,45 | $0 | pazarlama gideri |
| Başlangıç | 25 prompt × 4 = 100 | ~$1,35 | ~$0,50 | ~$4,3 | ~$6,2 | **$69** | ~%91 |
| Büyüme | 75 prompt × 4 = 300 (3 marka) | ~$4,60 | ~$1,20 | ~$11,0 | ~$16,8 | **$189** | ~%91 |
| Ajans | 250+ prompt, 5+ marka | ~$18 | ~$3 | ~%6 | ~$50 | Teklif ($499+) | ~%90 |

Sonuç: mevcut $49 / $149 fiyatlarda da marj sağlıklı; sorun maliyet değil **konumlandırma**.
Visby ($79 / $199) ile aynı işi yapan bir üründe çok düşük fiyat "daha zayıf ürün" algısı yaratıyor.
Ayrıca mevcut limitler (15 / 45 prompt) Visby'nin (15 / 90) altında kalıyor.

## 3. Visby.ai karşılaştırması ve yeni fiyatlandırma

Visby: Starter $79 (1 domain, 15 prompt, 45 yanıt/ay, 5 makale, 1 kullanıcı),
Growth $199 (3 domain, 90 prompt, 270 yanıt/ay, 15 makale, 3 kullanıcı),
Enterprise "Let's Talk" (5+ domain, 250+ prompt, 750+ yanıt, 25 makale, uzman denetimi, 10+ kullanıcı).

Önerilen OneCite fiyatlandırması (Visby'nin ~%10–15 altında, limitleri eşit veya üstün):

| | Ücretsiz | Başlangıç **$69** | Büyüme **$189** | Ajans (teklif) |
|---|---|---|---|---|
| Marka / domain | 1 | 1 | 3 | 5+ |
| Takipli prompt | 5 | 25 | 90 | 250+ |
| Analiz edilen AI yanıtı / ay | 20 | 100 | 360 | 1000+ |
| Rakip takibi | 1 | 3 | 10 | Sınırsız |
| İçerik üretimi / ay | – | 5 | 15 | 25 |
| Kullanıcı (koltuk) | 1 | 1 | 3 | 10+ |

Fiyatlandırma tablosuna eklenecek yeni satırlar (Visby'de olup bizde tabloda görünmeyenler):
- **Analiz edilen AI yanıtı / ay** (asıl maliyet kalemi — kotayı şeffaflaştırır)
- **Kullanıcı (koltuk) sayısı**
- **AI motoru sayısı** (Perplexity/DeepSeek tabanlı yanıt motorları)
- **Otomatik GEO görev üretimi**, **Marka Zekası (RAG)**, **GA4 / GSC / Bing entegrasyonu** satırları plan bazında işaretlenir
- Ajans planına: **uzman GEO denetimi** ve **danışmanlık görüşmesi**

Ayrıca: aylık/yıllık geçiş anahtarı (yıllıkta 2 ay hediye), "İstediğiniz zaman iptal" notu ve
Visby'deki gibi kısa bir **SSS** bloğu (iptal / plan değişikliği) fiyatlandırma sayfasına eklenir.

Kapsam dışı bırakılan Visby özellikleri (şimdilik yol haritası notu olarak): Reddit/G2/Trustpilot
sosyal kanıt takibi, funnel bazlı içerik takibi, AI trafiğinden gelir/dönüşüm ölçümü.

## Teknik notlar

- `src/lib/plan-limits.ts`: prompt/rakip/içerik limitleri yukarıdaki tabloya güncellenir,
  `maxAnswersPerMonth` ve `seats` alanları eklenir.
- `src/lib/pricingData.ts`: fiyatlar ($69/$189), yeni limit satırları, karşılaştırma tablosu alanları.
- Paddle: `starter_monthly` ve `growth_monthly` fiyat kayıtları yeni tutarla `PATCH` edilir
  (ekrandaki fiyat ile checkout'ta çekilen tutar aynı kalmalı).
- Rakip yapısı: `brand_intelligence.competitors` jsonb içinde `{name, domain}` — okuma tarafında
  geriye dönük normalize eden tek bir yardımcı fonksiyon; ölçüm/atıf eşleşmesi ve
  Komuta Merkezi karşılaştırma grafiği bu yapıyı kullanır.
