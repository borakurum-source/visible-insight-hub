# Landing Page: Perplexity-esintili tasarım dili

## Analiz — o tarzı ne oluşturuyor?

Perplexity'nin ürün sayfalarındaki his birkaç net karardan geliyor:

1. **Kağıt zemin, mürekkep yazı.** Beyaz değil, hafif sıcak kırık-beyaz (#FBFAF4 tonu) + neredeyse siyah metin. Ekran değil, basılı sayfa hissi.
2. **Tek bir sakin aksan rengi.** Petrol/teal yeşili yalnızca linklerde, küçük etiketlerde ve tek bir butonda. Gradyan yok, parlama yok.
3. **İri, sıkı başlıklar.** 56-96px, `tracking-tight`, 2-3 satırı geçmeyen kısa cümleler. Alt metin tek satır, gri.
4. **Kılcal çizgiler, kutu yok.** Bölümler 1px hairline ile ayrılır; gölgeli kartlar yerine çizgiyle bölünmüş ızgara.
5. **Mono mikro-etiketler.** Bölüm başlıkları küçük, harf aralığı açık, monospace: `01 / GÖRÜNÜRLÜK`.
6. **Ürün görseli kahraman.** Süslü illüstrasyon değil; gerçek arayüz ekranı, yumuşak köşeli, geniş boşluk içinde ortalanmış.
7. **Bir koyu bölüm.** Sayfanın ortasında tam genişlikte koyu bir band ritmi kırar.
8. **Kısıtlı hareket.** Sadece scroll'da yumuşak fade/rise; parallax, sayaç animasyonu, dönen orb yok.

Mevcut OneCite sistemi (Manrope + DM Mono + Evidence Cyan) bu dile şaşırtıcı derecede yakın; asıl fark **zemin sıcaklığı, tipografi ölçeği ve gölge/kart kullanımı**. Yani sıfırdan tema değil, kalibrasyon gerekiyor.

## Önerim

Birebir kopya değil; "OneCite kanıt gazetesi" yorumu:

- Perplexity'nin kağıt zemini + editoryal sükûneti alınır.
- Aksan olarak Perplexity teal'ı yerine **kendi Evidence Cyan / Signal Blue** ikilimiz korunur (marka kimliği kaybolmasın).
- Farklılaştırıcımız: alıntı/kaynak estetiği — hairline çizgiler, dipnot numaraları, `[1]` `[2]` kaynak rozetleri, monospace domain adları. Perplexity "cevap" görünür; biz "kanıt" görünürüz.

### Renk (src/styles.css içinde token güncellemesi)
```text
background   #FBFAF5  sıcak kağıt
surface      #FFFFFF  yalnızca ürün görseli/kart yüzeyi
foreground   #101211  neredeyse siyah mürekkep
muted-fg     #6B6F6C  gri alt metin
border       #E4E1D8  kılcal çizgi
primary      Evidence Cyan (mevcut) — tek aksan
dark band    #101211 zemin, üzerinde kağıt rengi yazı
```
Gradyan ve renkli gölge tokenları kaldırılır; `--shadow-*` tek bir çok yumuşak değere iner.

### Tipografi
- Başlıklar: Manrope 700, `tracking-[-0.03em]`, clamp(2.75rem, 6vw, 5.5rem).
- Gövde: 17-18px, satır yüksekliği 1.6, ölçülü genişlik (65ch).
- Mikro etiket: DM Mono, 11px, uppercase, `tracking-[0.18em]`.

### Ana sayfa yeni ritmi
```text
1  Üst bar        şeffaf, hairline alt çizgi, tek CTA
2  Hero           iri başlık + tek satır alt metin + domain input
                  altında monospace "ChatGPT · Gemini · Perplexity · Copilot"
3  Ürün görseli   tam genişliğe yakın, yumuşak köşe, gölgesiz, kağıt üzerinde
4  Kanıt şeridi   hairline ile bölünmüş 3 metrik, kart yok
5  Nasıl çalışır  4 adım, numaralı mono etiketler, sol hizalı, çizgiyle bölünmüş
6  KOYU BAND      "Cevaplarda görünmüyorsan yoksun" + alıntı görselleştirmesi
7  Kullanım       2 sütun asimetrik (60/40), metin + arayüz detayı
8  SSS            sade accordion, hairline, ikon yok
9  Kapanış CTA    tek cümle + tek buton, geniş boşluk
10 Footer         mono, çok satırlı sitemap, sade
```

### Hareket
Yalnızca `opacity + translateY(12px)` giriş animasyonu, 400ms, stagger 60ms. `prefers-reduced-motion` desteklenir.

## Kapsam
- `src/styles.css`: renk/gölge/tipografi tokenları + editoryal yardımcı sınıflar (`hairline`, `micro-label`, `editorial-h1`).
- `src/routes/index.tsx`: yukarıdaki 10 bölümlük ritme göre yeniden düzenlenir (içerik/metin korunur, sunum değişir).
- `src/components/site/MarketingShell.tsx`, header/footer: hairline ve mono stiline uyarlanır.
- Alt sayfalar (platform, çözümler, fiyatlandırma, makaleler) aynı token'ları otomatik alır; ana sayfa onaylandıktan sonra tek tek geçirilir.
- Panel teması değişmez (koyu/veri yoğun kimliği korunur).

## Sıra
1. Token ve tipografi kalibrasyonu
2. Ana sayfa yeniden düzeni + koyu band
3. Header/footer uyarlaması
4. Onay sonrası alt sayfalara yayma

## Not — devam eden iş
Panel tarafında onaylanan plan (auth kapısı, roller, çekirdek tablolar, kurulum sihirbazı) yarım kaldı: veritabanı ve sunucu fonksiyonları hazır, kurulum sihirbazı ekranı ve gerçek veriye bağlanma kaldı. Bu tasarım işi onaylanınca hangisinden devam edeyim — önce paneli bitirip sonra landing'e mi geçelim, yoksa landing tasarımı öncelikli mi?
