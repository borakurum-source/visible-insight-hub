# Blog yazılarını /makaleler'e bağlama

Veritabanındaki (`blog_posts`) yazılar şu an hiçbir yerde görünmüyor; `/makaleler` ve `/makaleler/:slug` yalnızca kod içindeki statik makaleleri kullanıyor. Tablo şu anda boş, bu yüzden ilk yazı `/admin/blog` üzerinden eklendiğinde akış test edilebilir olacak.

## 1. Detay sayfası: /makaleler/$slug

- Route'a bir loader eklenir: önce statik makale listesine bakılır, bulunamazsa `getBlogPost` ile veritabanından yayınlanmış yazı çekilir.
- Veritabanı yazısı Markdown gövdesiyle mevcut `MiniMarkdown` bileşeni üzerinden render edilir; kapak görseli, kategori, etiketler, okuma süresi, yayın tarihi ve yazar başlıkta gösterilir.
- Cevap özeti (answer_summary) yazının başında öne çıkan blok olarak, SSS listesi gövdenin altında açılır liste olarak, kaynaklar ise sonda bağlantı listesi olarak gösterilir.
- Meta alanları loader verisinden üretilir: title, description, og:title/og:description, og:type=article, twitter:card; varsa `og_image_url` (yoksa `cover_image_url`) mutlak URL olarak og:image ve twitter:image'e yazılır; canonical alanı doluysa o, değilse `https://1cite.com/makaleler/<slug>`.
- JSON-LD: Article (yayın/güncelleme tarihi, yazar, görsel) ve BreadcrumbList; SSS varsa FAQPage şeması da eklenir.
- Bulunamayan slug'da `notFound()` fırlatılır ve route'un `notFoundComponent`'i mevcut "Makale bulunamadı" ekranını 404 olarak gösterir; bu durumda meta `robots: noindex` olur.

## 2. Liste sayfası: /makaleler

- Route loader'ı `listBlogPosts` ile yayınlanmış yazıları çeker ve statik makalelerle tek bir listede birleştirir (tarihe göre yeniden eskiye).
- Mevcut kategori filtresi korunur, kategoriler birleşik listeden benzersizleştirilir.
- Sayfalama: sayfa başına 9 kart, URL arama parametresi `?sayfa=2` ile; önceki/sonraki ve sayfa numaraları. Sayfa 2 ve sonrası `noindex` olmaz ama canonical kendi sayfasına verilir.
- Durum filtresi: taslak yazılar herkese açık listede görünmez (yayında olmayan içerik indekslenmemeli). Bunun yerine giriş yapmış admin için `?durum=taslak` ile taslakları da listeleyen bir önizleme modu ve kartlarda "Taslak" rozeti olur; detay sayfası da admin için taslağı önizleyebilir. Taslak sayfalar her zaman `noindex`.

## 3. Sitemap

- `sitemap.xml` statik slug listesine ek olarak yayınlanmış veritabanı yazılarının slug'larını da ekler, `lastmod` olarak `updated_at` kullanılır.

## Teknik notlar

- Yeni sunucu fonksiyonları `src/lib/blog.functions.ts` içine eklenir: sayfalı liste (limit/offset + toplam sayı) ve admin taslak erişimi için oturum doğrulamalı ayrı bir fonksiyon.
- Liste ve detay okumaları route loader + TanStack Query `ensureQueryData` ile yapılır; admin taslak sorgusu yalnızca istemcide, oturum varsa çalışır.
- Statik makale tipi ile veritabanı satırı ortak bir görünüm tipine map'lenir, böylece kart ve detay bileşenleri tek kod yolunu kullanır.
