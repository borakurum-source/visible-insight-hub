# AI Talep Keşfi: veri kaynağını gerçeğe yaklaştırma

## Şu anki durum (kod okumasıyla doğrulandı)

Sayfa üç girdiden besleniyor:

1. **Dil modeli tahmini (baskın kaynak)** — `expandPrompts` DeepSeek'e konuyu veriyor, model 24-32 prompt ve bunların `monthlyVolume`, `relatedVolume`, `autocompleteStrength`, `trend` değerlerini **uydurarak** üretiyor. Kod bunları `source: "estimated"` olarak işaretliyor.
2. **Kendi ölçümleriniz** — `attachCitationData` markanın `prompts`, `prompt_runs`, `citations` tablolarını okuyor; bir aday prompt ölçülmüş bir prompta %55'ten fazla benziyorsa durumu `measured` oluyor, benzemiyorsa kaynak gösterim durumu genel orandan tahmin ediliyor.
3. **Rakip listesi** — `citations` tablosundaki kendi olmayan alan adlarının frekansı.

**GSC ve GA4 bu sayfaya hiç bağlı değil.** `analytics_snapshots` tablosunda 30 günlük gerçek Search Console sorgu/tıklama/gösterim/pozisyon verisi ve GA4 AI referer verisi duruyor, ama `prompt-demand` tarafında okunmuyor.

**Yani bugün: hacim rakamları gerçek değil, modelin tahmini. Kaynak gösterim durumu kısmen gerçek (sadece ölçülmüş promptlar için).**

## Yapılacaklar

### 1. Search Console'u birincil hacim kaynağı yap
- Analiz sırasında markanın son `analytics_snapshots` GSC kaydı okunur; konuyla ilgili sorgular (kelime örtüşmesi + mevcut benzerlik fonksiyonu) filtrelenir.
- Eşleşen prompt adaylarının hacmi modelin tahmini yerine **gerçek gösterim sayısından** türetilir ve `source: "gsc"` etiketiyle işaretlenir.
- GSC'de olup modelin üretmediği yüksek gösterimli sorgular ayrı aday olarak listeye eklenir (gerçek talep, sıfır tahmin).
- Her satırda gerçek `position` ve `clicks` de gösterilir: "klasik aramada 8. sıradasınız ama AI yanıtlarında kaynak değilsiniz" gibi net bir boşluk okunur hale gelir.

### 2. GA4'ü doğrulama sinyali olarak kullan
- GA4 anlık görüntüsündeki AI referer (ChatGPT, Perplexity, Gemini yönlendirmeleri) ve iniş sayfaları okunur.
- Küme bazında "bu konudan gelen gerçek AI trafiği" rozeti eklenir; talep tahmini bu trafikle çelişiyorsa güven skoru düşürülür.

### 3. Kaynak şeffaflığı
- Her metriğin yanına kaynak rozeti: **Ölçüldü (GSC)** / **Ölçüldü (OneCite)** / **Tahmin (model)**.
- Kart başlığında tek satır özet: "24 promptun 9'u gerçek veriden, 15'i tahmin."
- Bağlantı yoksa boş durum kartı: "Search Console'u bağlayın, hacimler tahminden gerçeğe geçsin" + Entegrasyonlar sayfasına kısayol.

### 4. Küme güvenini gerçek kapsama göre hesapla
- `clusterConfidence` girdisine "gerçek veriyle desteklenen prompt oranı" eklenir; tamamen tahmine dayanan kümeler artık yüksek güven puanı alamaz.

### 5. Talebi ölçüme çevir
- Tablodaki her satıra "Bu promptu takibe al" aksiyonu: prompt `prompts` tablosuna eklenir ve ilk ölçümü tetiklenir. Böylece bir sonraki analizde o satır tahmin değil ölçüm olur (kendi kendini besleyen döngü).

## Teknik notlar
- `PromptCandidate.source` tipi `"gsc" | "measured" | "estimated"` olacak şekilde genişler (`prompt-demand/types.ts`).
- Yeni `attachSearchConsoleSignals` fonksiyonu `prompt-demand.server.ts` içinde; `analytics_snapshots` tablosundan `provider = 'gsc'` son kaydı okur, Google'a canlı çağrı yapılmaz.
- Eşleştirme mevcut `similarity` fonksiyonuyla yapılır; eşik 0.5.
- Hacim dönüşümü: aylık gösterim = 30 günlük gösterim; AI talebi mevcut `promptDemand` katsayılarıyla bu gerçek tabandan hesaplanır.
- Sıra: (1) tip ve sinyal katmanı, (2) GSC eşleştirme, (3) GA4 doğrulama, (4) arayüz rozetleri ve boş durum, (5) takibe alma aksiyonu.
