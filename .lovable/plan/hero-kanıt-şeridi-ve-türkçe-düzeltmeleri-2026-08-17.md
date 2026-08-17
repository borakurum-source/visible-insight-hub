# Hero kanıt şeridi ve Türkçe düzeltmeleri

## Sorunlar (doğrulandı)

1. **Veriler 0 görünüyor** — Ana sayfa hero'sundaki kanıt şeridi `MetricRise` ile animasyonlu sayıyor; ekran görüntüsünde 0'da kalmış. Ayrıca `Math.round` kullandığı için `28,1` gibi ondalıklı değerler zaten `28`'e yuvarlanıyor ve "+" işareti kayboluyor.
2. **Sola dayalı kalmış** — Hero ortalanmış olmasına rağmen kanıt şeridi (`text-left`) ve altındaki FilmFolk dipnotu sola yaslı. Aynı sorun paylaşılan `visual-hero.tsx` bileşeninde de var (alt sayfalar: özellikler, makaleler, çözümler, hakkımızda, proof/filmfolk).
3. **Türkçe büyük harf bozuk** — "SATIN ALMA NIYETLI SORU", "TRAFIK ENTEGRASYONU" gibi metinler CSS `text-transform: uppercase` ile büyütülüyor; sayfa dili `<html lang="en">` olduğu için tarayıcı `i → I` yapıyor, `İ` yerine. Türkçe karakter kaybı buradan geliyor.

## Yapılacaklar

**Kanıt şeridi (ana sayfa + paylaşılan hero)**
- Animasyonlu `MetricRise` yerine gerçek, Türkçe biçimli sabit değerler: `+28,1 puan`, `41`, `286`.
- Şeridi ortala: 3 sütun eşit genişlikte, her hücre içeriği ortalanmış; dipnot da ortalı.
- Mobilde tek sütun yerine 3 sütun kalacak şekilde daha küçük tipografi (taşma olmadan), `sm:` üstünde mevcut ölçek.
- Aynı düzeni `visual-hero.tsx` içindeki `proof` bloğuna uygula ki tüm alt sayfalarda tutarlı olsun.

**Türkçe**
- Kök layout'ta `<html lang="tr">` — tarayıcı büyük harf dönüşümünü Türkçe kurallarına göre yapar (`niyetli → NİYETLİ`).
- Büyük harfe çevrilen etiketleri gözden geçir; dönüşüme güvenmek istemediğimiz kritik etiketleri (ölçülen motorlar, eyebrow'lar) doğrudan doğru yazımla yaz.
- `proof.filmfolk` ve `makaleler` sayfalarındaki istatistik/etiket metinlerinde kalan bozuk Türkçe karakterleri düzelt.

**Tasarım rötuşu**
- Hero altındaki ayırıcı çizgi + istatistik bloğu arasındaki boşlukları dengele; şerit hero genişliğiyle hizalansın.
- FilmFolk dipnotunu şeridin altında ortalı, küçük ve okunur kontrastta ver.

## Teknik notlar

Dokunulacak dosyalar: `src/routes/index.tsx` (HERO_PROOF + Hero şeridi), `src/components/site/visual-hero.tsx` (proof bloğu), `src/routes/__root.tsx` (`lang="tr"`), `src/routes/proof.filmfolk.tsx` ve `src/routes/makaleler.$slug.tsx` (metin düzeltmeleri). `MetricRise` bileşeni yerinde kalır; hero'da kullanılmaz.
