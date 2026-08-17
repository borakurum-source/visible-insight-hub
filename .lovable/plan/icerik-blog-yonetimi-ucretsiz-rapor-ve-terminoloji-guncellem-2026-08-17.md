# Icerik, blog yonetimi, ucretsiz rapor ve terminoloji guncellemesi

Dort is paketi. Sirayla uygulanabilir; 2 ve 4 birbirinden bagimsiz.

## 1. Turkce "ChatGPT'de gorunurluk" icerik kumesi (3 icerik)

Uc yeni icerik, mevcut makale altyapisi uzerinden yayinlanir (veritabanindaki blog kaydi + `/makaleler/<slug>`):

1. **ChatGPT'de marka gorunurlugu nasil olculur ve artirilir** (pillar rehber) — `/makaleler/chatgptde-marka-gorunurlugu`
2. **ChatGPT markanizi neden kaynak gostermiyor: nedenler ve cozumler** — `/makaleler/chatgpt-neden-kaynak-gostermiyor`
3. **ChatGPT'de gorunurluk icin 30 gunluk GEO plani** (uygulama plani, sablon tablolu) — `/makaleler/chatgpt-gorunurluk-30-gunluk-plan`

Her icerikte: tek H1, 2-3 cumlelik "kisa cevap" blogu (yapay zekanin secebilecegi ozet), soru bicimli H2'ler, karsilastirma tablosu, SSS, dis kaynak referanslari, Article + BreadcrumbList + FAQ yapisal verisi, kendi canonical ve sosyal onizleme etiketleri.

Ic linkleme: her icerikten `/solutions/agencies`, `/ozellikler`, `/fiyatlandirma` ve ucretsiz rapor sayfasina; segment sayfalarindan ve `/makaleler` hub'indan geri link. Uc icerik birbirine de baglanir (kume yapisi). Sitemap otomatik kapsar.

Iddialar yalnizca sitedeki dogrulanabilir bilgiye ve kaynak gosterilen dis referanslara dayanir; uydurma istatistik veya referans kullanilmaz.

## 2. Admin blog paneli

**Neden yazilar gorunmuyor:** mevcut dort makale kod icinde markdown dosyasi olarak duruyor (`src/content/articles/*.md`) ve `/makaleler` sayfasinda statik olarak render ediliyor. Admin paneli ise yalnizca veritabanindaki blog kayitlarini listeliyor, bu yuzden liste bos gorunuyor.

Yapilacaklar:
- Dort statik makale tum alanlariyla (baslik, meta, kategori, govde, SSS, kaynaklar) veritabanina tasinir; `/makaleler` ve detay sayfasi tek kaynaktan beslenir, kod icindeki kopyalar kaldirilir. Boylece hepsi admin panelinde duzenlenebilir olur.
- **Kapak gorseli yukleme:** PNG/JPG/WebP kabul eden yukleme alani (surukle-birak + dosya sec, tur ve boyut dogrulamasi, onizleme, kaldirma). Ayni bilesen sosyal onizleme gorseli icin de kullanilir; URL yapistirma secenegi korunur.
- **Zengin metin editoru:** duz markdown kutusu yerine arac cubuklu editor (baslik seviyeleri, kalin/italik, liste, alinti, baglanti, gorsel, tablo, kod) ve canli onizleme sekmesi. Icerik markdown olarak saklanmaya devam eder; boylece mevcut yayin gorunumu ve GEO yapisi bozulmaz, "markdown kaynagi" sekmesi kalir.
- Yazi listesine kapak gorseli kucuk onizlemesi, arama ve durum filtresi eklenir.

## 3. Ucretsiz rapor sayfasini SEO + GEO acisindan guclendirme

`/ucretsiz-yapay-zeka-gorunurluk-raporu` ve paylasilan rapor sayfasi `/r/<token>` icin:
- Baslik, meta aciklama ve H1 arama niyetine gore yeniden yazilir; sayfaya "kisa cevap" blogu, "kimin icin", "raporda ne cikiyor" ornek ciktisi ve gorsel ornek eklenir.
- SSS genisletilir; WebApplication + FAQPage + BreadcrumbList + HowTo (3 adim) yapisal verisi eklenir.
- Ic linkler: yeni uc icerige, ozellikler, fiyatlandirma ve segment sayfasina.
- Donusum: alan adi formu hem ust hem alt katta, giris dogrulama ve hata mesajlari, guven satiri (kredi karti yok, yalnizca herkese acik veri), bekleme ekraninda ne yapildiginin aciklamasi.
- Paylasilan rapor sayfasi: kendi basligi ve aciklamasi, dogru sosyal paylasim etiketleri, "kendi raporunu al" CTA'si. Rapor icerigi kisiye ozel oldugu icin arama motorlarina kapali kalir.
- Tum metinler 4. maddedeki yeni terminolojiyle yazilir.

## 4. Terminoloji: "atif" yerine "kaynak gosterilmek"

Arayuz, pazarlama metinleri, panel etiketleri, e-posta sablonlari ve yapay zeka cikti talimatlarinda su esleme uygulanir:

| Su an | Yeni |
|---|---|
| Atif payi / alinti payi | AI Kaynak Payi |
| Atif almak | Kaynak gosterilmek |
| Atiflanmak | Kaynak olarak secilmek |
| Atif kaynaklari | AI'in kullandigi kaynaklar / Secilen kaynaklar |
| Alintilanabilir icerik | Kaynak gosterilebilir icerik |
| Yapay Zeka Atif Zekasi | AI Citation Intelligence |
| Citation (arayuzde tek basina) | Kaynak gosterimi |

Uzman/teknik icerikte terim ilk gectiginde "kaynak gosterimi (citation)" bicimi kullanilir. Degisiklik yalnizca gorunur metinlerde yapilir; veritabani alan adlari, teknik anahtarlar ve mevcut URL'ler (ornegin `/platform/citation-share`) aynen kalir, boylece veri ve olcumler bozulmaz.

## Teknik notlar

- Statik makaleler icin tek seferlik veri tasima adimi yazilir; `makaleler.index.tsx` ve `makaleler.$slug.tsx` yalnizca veritabani kaynagini kullanacak sekilde sadelesir.
- Kapak gorselleri icin genel okunur bir depolama alani olusturulur; yukleme yalnizca yonetici oturumuyla yapilir, dosya turu ve boyutu sunucu tarafinda dogrulanir.
- Zengin editor markdown uretir; mevcut markdown render katmani ve yapisal veri uretimi degismez.
- Terminoloji degisikligi metin duzeyindedir; skor hesaplama, tablo kolonlari ve API alanlari ayni kalir.