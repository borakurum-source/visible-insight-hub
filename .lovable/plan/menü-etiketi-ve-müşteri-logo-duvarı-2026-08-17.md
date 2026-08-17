# Menü etiketi ve müşteri logo duvarı

## 1. Menü: "Ürün" -> "Özellikler"

Üst menüdeki "Ürün" etiketi "Özellikler" olarak değişir (link aynı kalır: `/ozellikler`). Mobil menüde de aynı etiket kullanılır. Footer'daki "Ürün" sütun başlığı değişmez; o bir kategori başlığı, navigasyon linki değil.

## 2. Müşteri logoları

Yüklenen logo sayfasındaki 28 logo tek tek kırpılır, beyaz zeminden arındırılıp şeffaf PNG olarak CDN'e yüklenir ve iki yerde kullanılır.

Ayrıştırılacak markalar (tekrar eden "fikirmod" bir kez alınır, toplam 27):

```text
ATO Ankara Ticaret Odası   KPMG              Fuga            Sarızeybek
İstanbul Bilgi Üni.        BAU               AvivaSA         Farmasi
Işıklar                    PE Energy         BilgeAdam       one&zero
Quiet Blue                 Venice Swap       fikirmod        faselis
Simple Living Eco          maslife           Hicret Cam      Enkronos
Hypatia                    Booking.com       Azra Kohen      FILMFOLK
BKIW                       Secret Brokerage  VoiceCrafters
```

### Yerleşim A — Hero altı kayan şerit

Hero'nun hemen altında, "Bizi tercih eden markalar" üst başlığıyla yatay olarak yavaşça kayan kompakt bir logo şeridi. Fare üzerine gelince durur, `prefers-reduced-motion` açıksa hiç hareket etmez ve sade bir ızgaraya döner.

### Yerleşim B — Referans bölümünde tam logo duvarı

Mevcut "Sonuç veren uygulamalar" bölümündeki metin kartları, tüm logoları gösteren duvara dönüşür (mobilde 2, tablette 3, masaüstünde 5 sütun). FilmFolk vaka kartı bu bölümde ayrı bir vurgulu kart olarak kalmaya devam eder.

### Görünüm

Tüm logolar gri tonlamalı ve tek renk yoğunluğunda; hover'da renk değişmez, yalnızca hafif bir opaklık artışı olur. Koyu hero şeridinde logolar açık gri, açık zeminli referans bölümünde koyu gri görünecek şekilde ayarlanır.

## Notlar

- KPMG, Booking.com, AvivaSA gibi kurumsal markalar için logo kullanım izniniz olduğunu varsayıyorum; sonradan çıkarmak istediğiniz olursa tek satırlık bir liste düzenlemesiyle kalkar.
- Şeridin başlığı "Bizi tercih eden markalar" olacak. Farklı bir ifade isterseniz söylemeniz yeterli.

## Teknik detaylar

- Yüklenen görsel PIL ile ızgara koordinatlarına göre kırpılır, her karonun etrafındaki boşluk kırpılır (bbox trim) ve beyaz zemin şeffaflaştırılır.
- Her logo `lovable-assets create` ile CDN'e yüklenir; repoya ikili dosya girmez, yalnızca `src/assets/logos/*.png.asset.json` işaretçileri commit edilir.
- Yeni `src/lib/clientLogos.ts`: marka adı + asset pointer listesi (tek kaynak).
- Yeni `src/components/site/client-logos.tsx`: `<ClientLogoStrip />` (kayan şerit) ve `<ClientLogoWall />` (ızgara) bileşenleri; kayma animasyonu `src/styles.css` içinde bir keyframe ile tanımlanır.
- `src/routes/index.tsx`: Hero altına şerit eklenir, `SonucVerenMarkalar` bölümü duvarı kullanacak şekilde güncellenir; `src/lib/trustSignals.ts` içindeki metin tabanlı `REFERENCE_BRANDS` listesi kaldırılır.
- `src/components/site/MarketingShell.tsx`: `primaryLinks` içindeki "Ürün" etiketi "Özellikler" olur.
- Her `img` için `alt="<Marka adı> logosu"`, `loading="lazy"` ve `decoding="async"` verilir; dekoratif tekrar eden şerit kopyası `aria-hidden` olur.