# Scraping katmanını "en iyisi" seviyesine çıkarma

## Bugünkü durum (kodda doğrulandı)

- Bağımlılık listesinde HTML parser yok; tüm çıkarım regex ile yapılıyor (`src/lib/extract.server.ts`).
- İki ayrı ve tutarsız çıkarım yolu var: bilgi bankası temiz katmanı (`fetchAndExtract`) kullanıyor, ancak marka zekası taraması `fetchSiteText` (`src/lib/ai.server.ts:22`) hâlâ eski, ham regex temizliğini kullanıyor ve 12.000 karakterde kesiyor. Yani onboarding'de markayı tanıyan analiz, en kirli metinle çalışıyor.
- `fetchSitemapUrls` (`src/lib/ai.server.ts:41`) `.xml` ile biten girdileri eliyor; bu yüzden `sitemap_index.xml` döndüren sitelerde sonuç boş kalıyor. Alt sitemap'lere inilmiyor.
- JavaScript ile render edilen siteler için hiçbir çözüm yok: `fetch` boş kabuk HTML alır, bilgi bankası sessizce boş kalır.
- `robots.txt` kontrolü, sayfa başına yeniden deneme, paralel indirme ve HTTP önbelleği (ETag/Last-Modified) yok.

## Yapılacaklar

### 1. Gerçek HTML parser'a geçiş (cheerio)
Regex tabanlı blok kesme yerine DOM tabanlı temizlik:
- `nav, header, footer, aside, form, iframe, svg, dialog` ve `class/id` içinde çerez/menü/popup kalıbı geçen düğümler `remove()` ile atılır — iç içe etiket sayma hatası biter.
- Ana içerik seçimi `main, article, [role=main]` seçicileriyle yapılır; yoksa en çok metin taşıyan blok "içerik yoğunluğu" puanıyla seçilir (menüler otomatik elenir).
- Başlık hiyerarşisi, liste ve tablo yapısı DOM'dan doğru okunur.
- JSON-LD ayrıştırma aynı kalır, `<script type=application/ld+json>` seçiciyle daha güvenilir toplanır.
- Cheerio Worker uyumlu ve ~30 KB; mevcut `ExtractedPage` arayüzü değişmez, çağıran kodlar aynı kalır.

### 2. Tek çıkarım yolu
`fetchSiteText` kaldırılır; marka zekası taraması da `fetchAndExtract` kullanır. Karakter limiti 12.000 → temizlenmiş metinde 40.000. Böylece onboarding analizi ile bilgi bankası aynı kaliteli metni görür.

### 3. Sitemap keşfi düzeltmesi
- `robots.txt` içindeki `Sitemap:` satırları okunur.
- `sitemap_index.xml` içindeki alt sitemap'lere bir seviye inilir.
- URL'ler önceliklendirilir: ana sayfa, `/hakkimizda`, `/urun`, `/fiyat`, `/sss`, `/cozumler` üste; `/kvkk`, `/gizlilik`, `/blog/etiket` gibi düşük değerli yollar sona veya dışarı.
- Sayfalar 4'lü paralel havuzla indirilir (tek tek beklemek yerine), sayfa başına 20 sn zaman aşımı ve tek yeniden deneme.

### 4. JS ile render edilen siteler için fallback
Temiz metin 500 karakterden azsa veya sayfada belirgin SPA kabuğu varsa, sayfa bir render servisine (Firecrawl) düşer. Bu yalnızca başarısız sayfalarda tetiklenir; statik siteler hiç maliyet üretmez. Firecrawl bağlantısı yoksa sistem sessizce mevcut davranışa döner ve kaynak "JS render gerekiyor" durumuyla işaretlenir; kullanıcı Bilgi Bankası ekranında bunu görür.

### 5. Tekrar taramada boşa iş yapmama
`knowledge_sources` üzerinde HTTP `ETag` / `Last-Modified` saklanır; yeniden indekslemede koşullu istek gönderilir, 304 dönerse sayfa yeniden işlenmez ve embedding ücreti çıkmaz.

### 6. Kalite görünürlüğü
Bilgi Bankası kaynak kartına eklenecek: çıkarım yöntemi (statik / JS render), gürültü oranı, kanıt puanı, son kontrol zamanı ve "boş içerik" uyarısı ile yeniden tarama aksiyonu.

## Teknik notlar

- Yeni bağımlılık: `cheerio`.
- Güncellenecek: `src/lib/extract.server.ts` (DOM tabanlı yeniden yazım, aynı dışa aktarımlar), `src/lib/ai.server.ts` (`fetchSiteText` kaldırılır, sitemap keşfi genişler), `src/lib/kb.server.ts` (fallback, ETag, durum alanları), `src/lib/embeddings.server.ts` (URL öncelik kuralları).
- Migrasyon: `knowledge_sources` tablosuna `etag text`, `last_modified text`, `extract_method text` alanları.
- Firecrawl bağlantısı fallback için gerekli; bağlanmazsa akış bozulmadan çalışmaya devam eder.
- Perplexity (embedding/ölçüm) ve DeepSeek (analiz/üretim) sağlayıcıları değişmiyor.
