# Marka Zekası motoru: scraping → chunking → embedding → retrieval kalite yükseltmesi

## Bugünkü durum (kodda doğrulandı)

- **Scraping** (`fetchPageText`, `fetchSiteText`): HTML'i regex ile temizliyor. Sadece `script`, `style`, `nav`, `footer` çıkarılıyor. Çerez bandı, menü, sidebar, "bültene abone ol", cookie/KVKK metinleri, JSON-LD, iframe ve SVG içeriği metne karışıyor. Ana içerik (`main`/`article`) tespiti yok, başlık hiyerarşisi (H1/H2) kayboluyor. Sayfa 40.000 karakterde kesiliyor.
- **Chunking** (`chunkText`): sabit 1000 karakter, 150 karakter örtüşme, cümle/başlık sınırı gözetmiyor. En fazla 40 parça — uzun sayfalarda sonrası tamamen atılıyor. Parça içinde sayfa başlığı/URL bağlamı yok, yani embedding "bu metin hangi sayfadan" bilgisini taşımıyor.
- **Embedding**: Perplexity `pplx-embed-v1-4b` (2560 boyut), önbellekli, batch 32 — bu kısım sağlam.
- **Retrieval** (`match_kb_chunks`): saf vektör benzerliği × kaynak ağırlığı × tazelik. Benzerlik eşiği yok (alakasız parça da dönebilir), aynı sayfadan gelen parçalar listeyi domine edebiliyor, anahtar kelime/marka adı eşleşmesi (hybrid) yok, yeniden sıralama (rerank) yok.
- **Kalite geri bildirimi yok**: bir kaynağın indeks kalitesi (boilerplate oranı, tekrar oranı, kaç parçanın işe yaradığı) ölçülmüyor.

## Yapılacaklar

### 1. Temiz içerik çıkarımı (boilerplate ve çerez temizliği)
`src/lib/extract.server.ts` adında yeni bir çıkarım katmanı:
- Önce `<main>`, `<article>`, `[role=main]`, `#content` bloklarını arar; bulursa sadece onu kullanır.
- Gürültü bloklarını siler: `nav, header, footer, aside, form, iframe, svg, noscript, template, dialog` ve `class/id` içinde `cookie, consent, gdpr, kvkk, banner, popup, modal, newsletter, subscribe, breadcrumb, sidebar, menu, social, share, comment, related, promo` geçen bölümler.
- Başlıkları korur: `h1-h3` metnini `## Başlık` olarak metne yazar (chunking bunu sınır olarak kullanır).
- `<title>`, `meta description` ve JSON-LD `@type: Organization/Product/FAQPage` verisini yapılandırılmış özet olarak ayrı toplar (bu veri en yüksek ağırlıklı parça olur).
- Kalıp cümle temizliği: aynı markanın birden fazla sayfasında birebir tekrarlanan satırlar (menü, footer sloganı, çerez metni) indeksleme sırasında tespit edilip düşürülür.
- Karakter limiti 40.000 → 120.000, ama temizlik sonrası.

### 2. Anlamlı chunking
- Başlık-farkında bölme: metin önce `##` başlıklarına göre bölünür, uzun bölümler cümle sınırından ~1100 karaktere kırpılır, ~180 karakter örtüşme.
- Her parçanın başına bağlam satırı eklenir: `Kaynak: {sayfa başlığı} — {bölüm başlığı}` (embedding'in ne hakkında olduğunu bilmesini sağlar).
- Çok kısa parçalar (<180 karakter) bir sonrakiyle birleştirilir; anlamsız gezinti kırıntıları atılır.
- Parça üst sınırı 40 → 120, ama sayfa başına değil kaynak başına.

### 3. Öncelik ve ağırlık modeli
Kaynak ağırlıkları içerik tipine göre yeniden tanımlanır:
- Marka iddiası / manuel not: 1.6
- Yapılandırılmış veri (JSON-LD, ürün/fiyat tablosu): 1.4
- SSS: 1.3 · Ürün ve fiyatlandırma sayfası: 1.25 · Vaka/referans: 1.15
- Genel sayfa/blog: 1.0 · PDF: 0.9 · Hukuki/politika sayfası: 0.4
URL kalıbından otomatik sınıflama (`/fiyat`, `/urun`, `/sss`, `/hakkimizda`, `/blog`, `/kvkk`).

### 4. Daha iyi geri getirme (retrieval)
`match_kb_chunks` fonksiyonu güncellenir ve üstüne bir getirme katmanı gelir:
- Minimum benzerlik eşiği (varsayılan 0.22) — alakasız parça dönmez.
- Kaynak çeşitliliği: aynı kaynaktan en fazla 2-3 parça (MMR benzeri basit kural).
- Hibrit arama: vektör sonucu + Postgres tam metin araması (Türkçe/simple config) birleştirilir, RRF ile tek listeye indirilir. Marka adı, ürün adı, sayı içeren sorgularda fark yaratır.
- Getirilen bağlam, DeepSeek'e `[1] [2]` numaralı ve kaynak başlıklı olarak verilir; taslakta atıf numarası zorunlu kılınır.

### 5. Sistem promptlarını güçlendirme
`src/lib/system-prompts.ts` içindeki 6 talimat, "kanıt zorunluluğu" çerçevesiyle yeniden yazılır:
- Ortak kurallara eklenir: bağlamda olmayan hiçbir sayı/tarih/isim üretilmez; her iddia bir `[n]` alıntısına bağlanır; bağlam yetersizse ilgili alan boş bırakılır ve `confidence` düşük işaretlenir.
- `brand_intelligence`: çıktıya `evidence` (hangi cümleden çıkarıldı) ve `confidence` alanları eklenir; çerez/hukuki metinden çıkarım yapması yasaklanır.
- `knowledge_source_pick`: öncelik listesi yukarıdaki ağırlık modeliyle eşitlenir.
- `content_draft`: alıntı numarası zorunlu, ilk paragraf 40-60 kelimede doğrudan cevap (alıntılanabilirlik), kanıtsız övgü yasak.
- `measurement_answer`: marka sıralaması ve kaynak alan adı çıkarımı netleştirilir.
- Yeni talimat: `chunk_quality` — bir sayfanın gerçekten kanıt değeri taşıyıp taşımadığını (0-100) puanlar; düşük puanlı sayfalar indekslenmez.

### 6. Kalite görünürlüğü (panelde)
Bilgi Bankası ekranına kaynak başına küçük bir kalite rozeti: temizlenen gürültü oranı, parça sayısı, ortalama parça uzunluğu, "kanıt değeri" puanı ve son indeksleme zamanı. Düşük kaliteli kaynaklar için "yeniden indeksle" ve "hariç tut" aksiyonu.

## Teknik notlar

- Yeni dosya: `src/lib/extract.server.ts` (HTML → temiz metin + başlık ağacı + JSON-LD).
- Güncellenecek: `src/lib/embeddings.server.ts` (chunking, ağırlıklar), `src/lib/kb.server.ts` (indeksleme akışı, boilerplate tespiti, kalite metrikleri), `src/lib/kb.functions.ts` (retrieval katmanı), `src/lib/ai.server.ts` (site metni çıkarımı yeni katmanı kullanır), `src/lib/system-prompts.ts`.
- Migrasyon: `kb_chunks` tablosuna `heading text`, `token_estimate int`, `tsv tsvector` (generated) + GIN index; `knowledge_sources` tablosuna `quality_score int`, `noise_ratio numeric`. `match_kb_chunks` fonksiyonu eşik + kaynak çeşitliliği parametreleriyle yeniden oluşturulur, yanına `match_kb_hybrid` eklenir.
- Yeniden indeksleme: mevcut kaynaklar için `content_hash` değişeceğinden ilk çalıştırmada tüm parçalar yeniden üretilir (embedding önbelleği aynı metinler için tekrar ücret çıkarmaz).
- Sağlayıcılar değişmiyor: embedding ve ölçüm Perplexity, analiz/üretim DeepSeek.
