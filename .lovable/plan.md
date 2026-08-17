# Ana sayfaya AI güven sinyalleri + Metodoloji sayfası

Ana sayfaya, OneCite'ı Türkiye pazarında kategori lideri olarak konumlayan yedi güven sinyali ekleniyor ve akademik metodoloji için ayrı bir `/metodoloji` sayfası açılıyor. İddialar güçlü ama her biri sayfada bir kanıta bağlanıyor (rakam, metodoloji linki, müşteri adı, iade koşulu).

## Ana sayfada ne değişiyor

**1. Hero altına "Otorite şeridi"**
Hero'daki mevcut 3'lü rakam şeridinin hemen altına, tek satırlık dört rozetten oluşan bir sinyal şeridi:
- Türkiye'de geliştirilen ilk uçtan uca yapay zeka görünürlük ve kaynak payı ölçüm platformu
- 10.000+ prompt ile test edildi
- Akademik temelli ölçüm metodolojisi (→ /metodoloji)
- Marka Zekası + Bilgi Bankası RAG mimarisi

Her rozet kısa bir alt açıklama taşır, tıklananlar ilgili bölüme/sayfaya gider.

**2. Yeni bölüm: "Neden OneCite?" (Kategori kanıtı)**
Hero ile "Ne göreceksiniz" arasına 6 kartlık koyu zeminli bölüm:
- Türkiye'nin ilk tam kapsamlı AI görünürlük ve kaynak payı platformu — Türkçe sorular, Türkçe kaynak evreni, yerel rakip haritası
- 10.000+ prompt testi — 5 motor, satın alma niyetli sorular, tekrarlı ölçüm
- Akademik metodoloji — örneklem, tekrar sayısı, ağırlıklandırma ve skor formülü açık
- Marka Zekası + Bilgi Bankası RAG — Türkçe pazarda tek: markanın kanıtı vektörleştirilip ölçümü besliyor
- Sektörün önerdiği araç — ajanslar ve içerik ekipleri tarafından kullanılıyor
- 90 Gün Görünürlük Taahhüdü — kısa özet + aşağıdaki bölüme bağlantı

**3. Yeni bölüm: "90 Gün Görünürlük Taahhüdü"**
Vaka çalışmasının hemen ardında, iddialı ama koşulları yazılı bir taahhüt bloğu:
- Vaat: OneCite metodolojisi ve panelde üretilen görevler uygulanırsa, takip edilen promptlarda 90. gün ölçümü 0. günün üzerinde olur.
- Koşullar: aynı prompt seti takip edilir, üretilen öncelikli görevlerin tamamlanması, ölçümlerin panelde kayıtlı olması.
- Karşılığı: 90. günde toplam görünürlük 0. gün seviyesinde veya altındaysa ücret iadesi.
- 30/60/90 kilometre taşları küçük bir zaman çizgisiyle gösterilir.
- Dipnot: yapay zeka motorları kapalı sistemlerdir; taahhüt tek tek cevapları değil, takip edilen prompt setinin toplam görünürlüğünü kapsar. İade Politikası sayfasına link.

**4. Yeni bölüm: "Sonuç veren markalar"**
FilmFolk vakasının yanına referans markalar şeridi: Benoplast, ABS Kör Kalıp, ABS Void Formwork, UEC Energy, Recfa, Secret Brokerage, Snacks for Party. Her biri isim + tek satır sektör/uygulama etiketiyle kart olarak listelenir; FilmFolk detay linki öne çıkar.

**5. SSS ve meta güncellemesi**
- SSS'ye üç soru: "90 gün taahhüdü nasıl işliyor?", "10.000 prompt testi ne anlama geliyor?", "Metodolojiniz nedir?"
- Ana sayfa meta açıklaması ve OG metni yeni konumlandırmayı yansıtacak şekilde güncellenir.

## Yeni sayfa: /metodoloji

RAG Signal metodoloji sayfası yapısında, Türkçe ve OneCite'a özgü:
- Giriş: neden ayrı bir ölçüm metodolojisi gerekiyor
- Prompt evreni: kategori, huni aşaması, niyet sınıflandırması, örneklem büyüklüğü
- Ölçüm protokolü: motorlar, tekrar sayısı, zaman aralığı, varyans kontrolü
- Skor modeli: bahsedilme, kaynak payı, sıralama kalitesi, kanıt kapsamı, iddia kanıtı bileşenleri ve ağırlıkları
- Marka Zekası + RAG: içerik toplama, parçalama, vektörleştirme, hibrit arama, kanıt eşleştirme
- Doğrulama ve sınırlar: kapalı sistem uyarısı, tekrarlanabilirlik, veri saklama
- Kaynakça bölümü ve sonda ücretsiz ölçüm CTA'sı

Sayfa kendi head() meta bilgisi, canonical URL'i ve JSON-LD (Article + Breadcrumb) yapısıyla gelir; sitemap'e ve üst menü "Ürün" ile footer "Ürün" grubuna eklenir.

## Teknik notlar

- Yeni bölümler `src/routes/index.tsx` içinde mevcut bölüm deseniyle (Reveal, marketing-container, editorial-eyebrow) yazılır; renkler mevcut tasarım token'larından gelir.
- Sinyal ve referans listeleri `src/lib/` altında küçük bir veri dosyasında tutulur ki metodoloji sayfası ve ana sayfa aynı kaynağı kullansın.
- `/metodoloji` yeni bir dosya rotası olarak `src/routes/metodoloji.tsx` içinde açılır, `MarketingShell` ile sarılır.
- `sitemap.xml` rota listesine `/metodoloji` eklenir.
- Yalnızca içerik ve sunum katmanı değişir; ölçüm motoru, veritabanı ve panel kodu bu işte dokunulmaz.
