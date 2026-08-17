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

## Çıktı

- Ana sayfa hero bölümü ortalanmış, daha dengeli ve az boşluklu görünecek.
- Mevcut metin, CTA ve sosyal kanıt içeriği korunacak.
- Sağdaki yaltaşan görsel panel kalkacak; yerine ince, atmosferik bir arka plan vurgusu gelecek.
