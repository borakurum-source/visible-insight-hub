# Onboarding'i Visby tarzı 6 adımlı sihirbaza dönüştürme

Şu an kurulum 3 adım (Marka → Marka profili → Promptlar) ve tek sayfada ilerliyor. Ekran görüntülerindeki akış daha iyi: her adım tek bir işe odaklı, her ekranda AI'ın hazırladığı taslak düzenlenebilir halde geliyor, sonunda "analiz tamamlandı" özeti gösteriliyor.

## Yeni akış (6 adım + özet)

```text
1 Alan adı + dil  ->  2 Site taranıyor  ->  3 Marka kitabı  ->
4 Önerilen promptlar (funnel)  ->  5 Rakipler (ad + domain + tip)  ->
6 AI motorları  ->  Analiz tamamlandı özeti  ->  Komuta Merkezi
```

1. **Hoş geldiniz** — sadece alan adı ve birincil dil. Tek alan, tek buton.
2. **Site taranıyor** — aynı ekranda buton "Siteniz taranıyor…" durumuna geçer; arka planda site analizi ve marka zekası üretilir (mevcut üretim fonksiyonu kullanılır).
3. **Marka kitabını gözden geçirin** — Marka adı, sektör, dil, ana lokasyon, kısa açıklama, öne çıkan özellikler, detaylı açıklama alanları düzenlenebilir. Üstte "bilgiler yanlışsa düzeltin (Cloudflare vb. koruma sitenizi okumamızı engellemiş olabilir)" uyarı kutusu.
4. **Önerilen promptlar** — her satırda prompt metni + **funnel aşaması** (Üst / Orta / Alt huni) + sil. Altta "yeni prompt ekle" satırı. Plan limiti aşılırsa fazlası pasif ve yükseltme bağlantısı gösterilir (mevcut kota mantığı korunur).
5. **Rakipler** — önerilen rakipler ad + domain + tip (Doğrudan / Dolaylı) olarak listelenir, satır eklenip silinebilir. Mevcut domain tabanlı rakip modeliyle uyumlu.
6. **AI motorları** — hangi kaynaklarda takip edileceği seçilir. Ölçüm gerçekte Perplexity ve DeepSeek üzerinden yapıldığı için liste gerçekten desteklenen kaynaklarla sınırlı tutulur; plan bazlı motor sayısı gösterilir ("3 motordan 2'si izleniyor").
7. **Analiz tamamlandı** — ilk ölçüm tetiklenir; görünürlük skoru, ilk prompt sonuçları (atıf/marka rozetleriyle) ve otomatik üretilen ilk görevler özetlenir. "Komuta Merkezine git" CTA'sı.

## Kalıcı iyileştirmeler

- Her adım ayrı bileşen; ilerleme noktaları alt kısımda, "Geri / Devam" butonları standart.
- İlerleme marka kaydındaki onboarding adımında saklanır; kullanıcı yarıda bırakıp geri dönebilir.
- Prompt funnel aşaması promptlara yazılır ve Promptlar sayfasında rozet olarak gösterilir.
- Tüm metinler Türkçe ve tutarlı; şapkasız "a" kuralı korunur.

## Teknik notlar

- `src/routes/_authenticated/app.onboarding.tsx` 6 adımlı hale getirilir; adım bileşenleri `src/components/app/onboarding/` altına taşınır.
- `prompts` tablosuna `funnel_stage` (`top|middle|bottom`), rakip kayıtlarına `type` (`direct|indirect`) alanı eklenir (migration + GRANT/RLS mevcut desenle).
- Prompt ve rakip öneri sistem talimatları funnel aşaması / rakip tipi döndürecek şekilde güncellenir (`src/lib/system-prompts.ts`).
- Son adımda mevcut ölçüm hook'u ile ilk ölçüm otomatik başlatılır; özet ekranı bu çalışmanın sonucunu okur.