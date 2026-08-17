# Site, Funnel ve Hiyerarşi Değerlendirmesi + Sadeleştirme Planı

## Kısa cevap: Evet, "Özellikler" ve "Platform" aynı işi yapıyor
İki sayfa da aynı çerçeveyi (Source → Signal → Action), aynı modülleri (Atıf Payı, Eksik Kanıtlar, Marka Zekası) ve aynı kapanış CTA'sını anlatıyor. Sadece hero başlığı ve görsel yoğunluğu farklı. Ziyaretçi için ayrım yok; SEO açısından da iki sayfa aynı niyet için birbiriyle yarışıyor (keyword cannibalization).

## İki persona gözüyle mevcut durum

**Pazarlama uzmanı (bir üstüne rapor verecek):**
- Ne ölçüldüğünü anlıyor ama "haftalık iş akışım nasıl olacak, ekrana ne gelecek, patronuma ne göstereceğim" cevabı yok.
- Ürün ekran görüntüleri az ve yüzeysel; panelin gerçek gücü (OneCite Score, rakip trend grafiği, GA4/GSC/Bing AI trafiği, görev listesi) landing'de neredeyse hiç görünmüyor.
- Tek vaka var (FilmFolk) ve ana sayfada bir kez geçiyor; sosyal kanıt zayıf.

**İşletme sahibi (kendi işini yapıyor):**
- "Bu bana ne kazandırır" cümlesi yerine bolca jargon var: Source/Signal/Action, GEO, atıf payı, kanıt katmanı. İlk 5 saniyede iş sonucu yok.
- Fiyat/plan farkı ana sayfada özet, fakat "hangi plan bana uygun" kararı için kullanım limiti dilinde açıklama eksik.
- Deneme sürecinin ne kadar sürdüğü, ne kadar emek istediği, ilk sonucun ne zaman geleceği belirsiz.

## Funnel değerlendirmesi
Şu anki akış: Ana sayfa → (Özellikler | Platform | Ajanslar | Vaka | Fiyatlandırma | Kaynaklar) → Ücretsiz rapor → /auth → onboarding.

Sorunlar:
1. Üst menüde 6 link var, ikisi aynı içerik. Karar yükü fazla.
2. İki farklı birincil CTA dolaşımda: "Ücretsiz ölçüm" ve "Panele git/Giriş". Tek bir birincil aksiyon olmalı.
3. Ücretsiz rapor sayfası funnel'ın kalbi ama menüde birinci sınıf link değil; sadece butondan erişiliyor.
4. Rapor → hesap açma arasında köprü zayıf: raporu gören kişi neden kayıt olsun sorusu cevapsız.
5. Eski `SiteHeader` / `SiteFooter` bileşenleri hâlâ duruyor ve `/app`, `/sunum` gibi farklı linkler içeriyor — tutarsızlık kaynağı.
6. Fiyatlandırmaya giden yol çok geç; işletme sahibi tipi ziyaretçi fiyatı erken arar.

## Yapılacaklar

### 1. Sayfa birleştirme
- `/ozellikler` tek "ürün" sayfası olur: özellikler + platform çalışma modeli + ekran görüntüleri burada toplanır.
- `/platform` sayfası kaldırılır ve `/ozellikler`'e kalıcı yönlendirilir; `/platform/citation-share` ve `/platform/evidence-gaps` derin sayfaları korunur (bunlar SEO için ayrı niyet), ama üst menüde değil, ürün sayfasından linklenir.
- Sitemap, footer ve iç linkler güncellenir.

### 2. Navigasyon sadeleştirme (6 → 4 link)
`Ürün` · `Çözümler` (Ajanslar + Vaka) · `Fiyatlandırma` · `Kaynaklar` + sağda tek birincil CTA "Ücretsiz ölçüm" ve ikincil "Giriş".
Kullanılmayan `SiteHeader`/`SiteFooter` bileşenleri silinir.

### 3. Ana sayfa mesaj hiyerarşisi
- Hero: jargonsuz sonuç cümlesi + tek CTA + "1 dakika, kredi kartı yok" güven satırı.
- Hemen altına "Ne göreceksiniz" ürün ekran şeridi (Score kartı, rakip trend grafiği, görev listesi).
- Sonra: problem → nasıl çalışır (3 adım) → vaka → plan özeti → SSS → CTA.
- Her bölüm tek ana fikir; tekrar eden CTA metinleri tekleştirilir.

### 4. Funnel köprüleri
- Ücretsiz rapor sonucunun altına net "hesap aç ve takibe başla" bloğu: raporda görülen eksiklerin panelde nasıl takip edileceği.
- Fiyatlandırma sayfasına "hangi plan size uygun" karar yardımcısı (kullanım diliyle: kaç marka, kaç prompt, kaç rakip).
- Ürün sayfasının her modül kartından ilgili derin sayfaya ve ücretsiz ölçüme çıkış.

### 5. Dil ve terminoloji
- "Source → Signal → Action" gibi İngilizce çerçeve arka plana alınır; başlıklarda Türkçe iş dili kullanılır ("Hangi soruda kaynak olarak seçiliyorsunuz?").
- Tekrarlayan jargon terimleri için ilk geçtiği yerde tek cümlelik açıklama.

## Teknik notlar
- Kaldırılan `/platform` için `src/routes/platform.index.tsx` yerine `/ozellikler`'e redirect (`beforeLoad` + `redirect`), `platform.tsx` layout korunur.
- `MarketingShell` içindeki `primaryLinks` ve `footerGroups` yeniden düzenlenir.
- `sitemap[.]xml.tsx` içindeki URL listesi ve `/platform` canonical/JSON-LD referansları güncellenir.
- `src/components/site/SiteHeader.tsx` ve `SiteFooter.tsx` silinir; import eden kalan dosyalar taranır.
- Ana sayfa ve ürün sayfası bölümleri mevcut `VisualHero`, `FeatureShot`, `MarketingCta` bileşenleriyle kurulur; yeni tasarım sistemi eklenmez.

## Bu planın kapsamadığı
Panel (app) içi değişiklik yok; sadece pazarlama sitesi yapısı, kopya ve funnel.
