# Hero'yu Satış Odaklı Yeniden Yazma + Alt Sayfa Tasarım Birliği

## 1. Ana sayfa hero: net değer teklifi

Şu anki hero soru soruyor ("...kaynak olarak seçiliyor mu?") — merak uyandırır ama ne sattığımızı söylemez. Yeni hero, ilk ekranda üç şeyi net verir: ne yapıyoruz, kime, ne kazandırıyor.

Yeni yapı (sol kolon):
```text
ETİKET      AI CITATION INTELLIGENCE
H1          ChatGPT, Perplexity ve Gemini cevaplarında
            markanızın atıf payını ölçün ve artırın.
ALT METİN   OneCite, satın alma niyetli sorularda hangi markanın
            kaynak olarak seçildiğini ölçer, eksik kanıtı gösterir
            ve önce hangi içeriği üretmeniz gerektiğini söyler.
FORM        Ücretsiz ölçüm (mevcut PublicReportAnalyzer, korunur)
GÜVEN       Kredi kartı yok · 2 dakikada rapor · Ölçülen yüzeyler: [rotator]
SONUÇ ŞERİDİ  3 mikro kanıt: "6 ayda +28,1 puan atıf payı" ·
              "41 niyet sorusu" · "286 ölçüm tekrarı"
```
- H1 soru cümlesinden fayda cümlesine döner; motor isimleri geçtiği için arama/GEO tarafında da kazanç var.
- Alt metin "ölç → kanıt → aksiyon" vaadini tek cümlede kapatır.
- ProofStrip'in rakamları hero'nun altına mikro şerit olarak taşınır; ayrı bölüm olarak tekrar edilmez (bir bölüm eksilir, ilk ekran daha ikna edici olur).
- Sağdaki görsel panel ve dark yüzey aynı kalır; sadece alt etiket metni değer teklifiyle hizalanır.

## 2. Alt sayfaları ana sayfa diline getirme

Tespit: `platform`, `platform/citation-share`, `platform/evidence-gaps`, `solutions/agencies`, `proof/filmfolk`, `hakkimizda`, `makaleler/$slug` sayfaları `VisualHero` kullanıyor; `fiyatlandirma` ve `free-ai-readiness-report` kendi elle yazılmış hero'larını kullanıyor. Kapanış CTA'sı ise yalnızca `fiyatlandirma` ve `free-ai-readiness-report` sayfalarında var.

Yapılacaklar:
- **Hero birliği:** `VisualHero` bileşeni, ana sayfanın yeni hero ritmine göre güncellenir (etiket + kılcal çizgi, aynı başlık ölçeği/izleme değerleri, isteğe bağlı 3'lü kanıt şeridi slotu). `fiyatlandirma` ve `free-ai-readiness-report` hero'ları da bu bileşene (veya aynı sınıf setine) taşınır — fiyatlandırmadaki aylık/yıllık anahtarı hero'nun `children` slotunda kalır.
- **Kapanış CTA birliği:** CTA'sı olmayan tüm pazarlama sayfalarına (`platform` ve iki alt sayfası, `solutions/agencies`, `proof/filmfolk`, `hakkimizda`, `makaleler` liste ve detay) `MarketingCta` eklenir; her sayfaya bağlama uygun başlık/açıklama.
- **Ritim birliği:** Tüm bölüm dolguları `py-16 md:py-24`, koyu/açık bant sırası ana sayfayla aynı (koyu hero → açık → koyu → açık → koyu CTA), eyebrow'lar `editorial-eyebrow`, kart kenarları tek `border-border` standardı.
- **Token temizliği:** Kalan hardcode hex değerleri (`#26302E` vb.) semantik token/utility'ye çevrilir.
- **Head kontrolü:** Her sayfada `og:type` ve `twitter:card` tamamlanır (şu an bazı alt sayfalarda eksik).

## Teknik notlar
- Dosyalar: `src/routes/index.tsx` (hero + ProofStrip birleşimi), `src/components/site/visual-hero.tsx` (kanıt şeridi slotu + ritim), `src/components/site/marketing-cta.tsx` (değişiklik gerekmez, sadece kullanım yayılır), yukarıda sayılan rota dosyaları, `src/styles.css` (gerekirse tek-iki yardımcı sınıf).
- Panel (`_authenticated/*`), ölçüm motoru, fiyat verisi ve sunucu fonksiyonları bu işte değişmez.
- Metinler Türkçe kalır; mevcut görseller yeniden kullanılır, yeni görsel üretilmez.
