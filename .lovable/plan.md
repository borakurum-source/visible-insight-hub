# Landing + Alt Sayfalar: Satış Odaklı Tasarım ve Bütünlük Revizyonu

## Bulgular (koddan doğrulandı)

**1. Fiyatlandırma sayfası siteden kopuk.** `src/routes/fiyatlandirma.tsx` tek başına `SiteHeader`/`SiteFooter` kullanıyor; diğer tüm pazarlama sayfaları `MarketingShell` kullanıyor. Yani menü, navigasyon ve footer o sayfada tamamen farklı. Ayrıca `surface-panel`, `glow-ring` sınıfları ve `variant="hero" | "subtle"` buton varyantları projede tanımlı değil — sayfa stilsiz/kırık render oluyor.

**2. Üç farklı fiyat listesi var.**
- `src/routes/fiyatlandirma.tsx`: ₺2.900 / ₺7.900 / Görüşelim
- `src/lib/pricingData.ts`: Ücretsiz / ₺199 / ₺299 / ₺599 (limitler + özellikler tanımlı, hiçbir yerde kullanılmıyor)
- `src/lib/panel-mock/pricing.ts`: ₺1.490 / ₺3.990

Satış sayfası bu haliyle güvenilir değil. Tek doğru kaynak `pricingData.ts` olacak; panel de aynı listeyi gösterecek.

**3. Ana sayfa uzun ama satış hattı zayıf.** 10 bölüm var; ilk fiyat/plan teması ancak 8. bölümde geliyor, sayfada tek bir "kim için / ne kadar" cevabı yok, sosyal kanıt tek vaka (FilmFolk) ile sınırlı ve aynı metrikler üç ayrı yerde tekrar ediyor (ProofStrip, FilmFolkOrnegi, vaka sayfası).

**4. Renkler her yerde elle yazılmış.** `#0B1020`, `#F7F9FC`, `#356AFF`, `#E6EAF2`, `#667085` yüzlerce kez hardcode. Token'lar `src/styles.css` içinde zaten mevcut; bu yüzden ton değişikliği tek yerden yapılamıyor ve sayfalar arasında küçük renk kaymaları oluşuyor.

**5. SEO/paylaşım eksikleri.** Sadece `fiyatlandirma` ve `auth` sayfalarında `og:type` / `twitter:card` var; landing, platform, çözümler, vaka ve makale sayfalarında yok. Hiçbir sayfada `og:image` yok, fiyatlandırma için ürün/teklif JSON-LD yok, SSS'ler için FAQPage şeması yok.

## Yapılacaklar

### A. Fiyatlandırma sayfasını sıfırdan satış sayfası olarak kur
- `MarketingShell` ile aynı kabuğa alınır, `SiteHeader`/`SiteFooter` kaldırılır.
- Planlar `pricingData.ts`'ten okunur; aylık / yıllık geçişi (yıllıkta 2 ay bedava vurgusu) eklenir.
- 4 plan kartı: Ücretsiz, Başlangıç, Büyüme (öne çıkan), Ajans. Her kartta limitler + özellikler + tek net CTA.
- Altına: plan karşılaştırma tablosu, "hangi plan size uygun" 3 profil bloğu, fiyat itirazlarını karşılayan SSS, kapanış CTA.
- Ajans planı için "Görüşme planla" ikincil akışı.

### B. Ana sayfayı satış hattına göre yeniden sırala
Yeni ritim:
```text
1  Hero (ücretsiz ölçüm formu — mevcut haliyle kalır)
2  Kanıt şeridi (FilmFolk metrikleri)
3  Problem: SEO görünürlüğü ≠ atıf payı
4  Ürün akışı — kaynak / sinyal / uygulama
5  Ürün ekranları (4 satır → 3 satıra indirilir, tekrar azaltılır)
6  Koyu band: eksik kanıt metaforu
7  Vaka çalışması (metrik tekrarı temizlenir)
8  Kim için: KOBİ / marka ekibi / ajans — 3 kolon, her biri ilgili sayfaya
9  Plan önizlemesi: 3 fiyat kartı + "tüm planları karşılaştır"
10 SSS
11 Kapanış CTA
```
Fiyat, ana sayfada gerçek rakamla görünür hale gelir (şu an sadece metin linki var).

### C. Alt sayfa bütünlüğü
- Tüm pazarlama sayfalarında ortak bir kapanış CTA bloğu (`MarketingCta`) kullanılır; şu an platform, çözümler ve ücretsiz rapor sayfaları CTA'sız bitiyor.
- Platform alt sayfaları (`citation-share`, `evidence-gaps`) aynı bölüm iskeletine (hero → nasıl çalışır → ürün görseli → kanıt → CTA) hizalanır.
- `hakkimizda`, `solutions/agencies`, `proof/filmfolk`, `makaleler` sayfalarında başlık ölçeği, bölüm dolgusu ve eyebrow stilleri tek standarda çekilir.
- `MarketingShell` menüsü sadeleşir: 8 link → Platform / Çözümler / Vaka / Fiyatlandırma / Kaynaklar (5), gerisi footer'a taşınır. Footer çok sütunlu sitemap'e çevrilir.

### D. Tasarım sistemi hijyeni
- Hardcode hex değerleri semantik token'lara çevrilir (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-primary`, `bg-ink`).
- Koyu bantlar için `ink` yüzey yardımcı sınıfı, eyebrow için mevcut `editorial-eyebrow` kullanımı yaygınlaştırılır.
- Bölüm dolgusu tek ölçek: `py-16 md:py-24`.

### E. SEO ve dönüşüm ölçümü
- Her içerik rotasında `og:type` + `twitter:card` tamamlanır.
- Fiyatlandırmaya `Product`/`Offer`, ana sayfa ve fiyatlandırma SSS'lerine `FAQPage` JSON-LD eklenir.
- Tüm birincil CTA'lar tek hedefe toplanır: `/free-ai-readiness-report` (ana dönüşüm), ikincil `/auth`.

## Teknik notlar
- Dosyalar: `src/routes/fiyatlandirma.tsx` (yeniden yazım), `src/routes/index.tsx` (bölüm sırası + plan bölümü), `src/components/site/MarketingShell.tsx` (nav + footer), yeni `src/components/site/marketing-cta.tsx`, `src/lib/pricingData.ts` (yıllık/aylık alanları), `src/styles.css` (yüzey yardımcıları).
- `SiteHeader`/`SiteFooter` kullanımdan kalkar; `panel-mock/pricing.ts` yerine panel de `pricingData.ts` okur.
- Panel ekranları, ölçüm motoru ve sunucu fonksiyonları bu işte değişmez.

## Sıra
1. Token hijyeni + ortak CTA bileşeni + kabuk/nav/footer
2. Fiyatlandırma sayfası
3. Ana sayfa yeniden sıralama + plan bölümü
4. Alt sayfa hizalaması
5. SEO/JSON-LD

## Onayınız gereken tek konu
Fiyatlar `pricingData.ts` listesi (Ücretsiz / ₺199 / ₺299 / ₺599 aylık) baz alınarak yayınlanacak. Doğru liste bu değilse söyleyin, planı ona göre uygularım.
