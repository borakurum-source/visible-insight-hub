# Hero düzeni: merkezi lockup

Seçilen yön: **Centered balance lockup** — sağdaki büyük görsel paneli kaldırıp içeriği ortalayacağız; görsel destek yerine yumuşak bir arka plan ambient glow ile verilecek.

## Yapılacaklar

1. `src/routes/index.tsx` içindeki `Hero` bileşenini iki sütunlu grid'den tek sütunlu, ortalanmış yapıya çevir.
   - Sağdaki `HeroVisual` paneli kaldır.
   - Başlık, alt metin, rapor CTA, motor rozetleri ve kanıt sayıları ortalanmış sırada kalsın.
2. Arka plana ambient glow ekle.
   - Mevcut `visual-hero-surface` ve grid dokusunu koru.
   - Ortada büyük, soluk cyan/blur glow ve ince bir pulse halkası ekle; görseli boğmayacak şekilde `opacity` düşük tut.
3. CTA ve form stilini seçilen prototipe yakınlaştır.
   - `PublicReportAnalyzer` yerleşimini merkezi, cam kart içinde göster.
   - Buton ve input rounded-xl, border-white/10, backdrop-blur tarzında.
4. Motor rozetleri ve kanıt sayılarını seçilen düzene uydur.
   - Motor rozetleri CTA'nın hemen altına, tek satırda.
   - Kanıt sayıları alt çizgiyle ayrılmış, 3 sütunlu, sola hizalı metin bloğu.
5. Mobil ve tablet uyumluluğunu koru.
   - `md:` ve `lg:` kırılımlarında yazı ölçeği ve padding ayarla.
   - Ambient glow mobilde ekranı daraltmasın; `max-w` ve `overflow-hidden` ile sınırla.
6. Gerekirse `src/styles.css` içinde yeni utility veya token ekle (örn. `.glow-ambient`), ancak mevcut cyan/primary tokenlerini kullan.

## Alt sayfalar: aynı formata geçiş

Tüm pazarlama alt sayfaları `src/components/site/visual-hero.tsx` içindeki paylaşılan `VisualHero` bileşenini kullanıyor. Bu bileşeni bir kez merkezi düzene çevirince tüm sayfalar aynı formata gelir.

7. `VisualHero` bileşenini iki sütunlu grid'den tek sütunlu, ortalanmış lockup'a çevir.
   - Sağdaki `HeroVisual` paneli kaldır; yerine ana sayfadakiyle aynı ambient glow arka planı kullan.
   - Logo, eyebrow, başlık, açıklama, CTA butonları, kanıt sayıları ve not sırasıyla ortalanmış akışta kalsın.
   - Kanıt sayıları alt çizgiyle ayrılmış 3 sütunlu blok olarak, ana sayfayla aynı stilde.
   - `children` slotu (sayfaya özel ek içerik) ortalanmış konteynerin içinde kalmaya devam etsin.
8. `image` / `imageAlt` / `visualLabel` / `visualCaption` proplarını opsiyonel yap.
   - Görsel artık render edilmediği için çağrı yerlerinde tip hatası çıkmasın; proplar geriye dönük uyumlu kalsın.
   - İleride görsel gerekirse tek bir merkezi opsiyon olarak eklenebilecek şekilde bırak.
9. Etkilenen sayfaları kontrol et ve düzeni doğrula:
   `/ozellikler`, `/ucretsiz-yapay-zeka-gorunurluk-raporu`, `/makaleler`, `/makaleler/$slug`,
   `/solutions/agencies`, `/proof/filmfolk`, `/platform/citation-share`,
   `/platform/evidence-gaps`, `/hakkimizda`.
   - Her sayfada başlık uzunluğu ortalanmış düzende dengeli görünsün.
   - Artık kullanılmayan hero görsel importlarını temizle.

## Çıktı

- Ana sayfa ve tüm pazarlama alt sayfalarının hero bölümü ortalanmış, dengeli ve tutarlı olacak.
- Mevcut metin, CTA ve sosyal kanıt içeriği korunacak.
- Sağdaki yaltaşan görsel panel kalkacak; yerine ince, atmosferik bir arka plan vurgusu gelecek.
