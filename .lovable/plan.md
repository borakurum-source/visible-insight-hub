# AI Talep Keşfi motorunu gerçek veri odaklı yeniden kurgulama

Amaç: tek bir "425" sayısı yerine, kaynağı belli, kalibre edilmiş ve aralıklı bir tahmin üretmek.

## 1. Eşleştirmeyi vektöre taşı

Bugün prompt eşleştirmesi kelime örtüşmesine (Jaccard) dayanıyor; "kargo entegrasyonu" ile "gönderi API" eşleşmiyor. Bu yüzden Search Console verisi çoğu satıra hiç bağlanmıyor ve örtüşme indirimi olduğundan zayıf çalışıyor.

- Mevcut embedding altyapısı (Lovable AI embeddings) aday promptlar, GSC sorguları ve ölçülmüş promptlar için tek seferde vektör üretecek.
- Benzerlik kosinüs mesafesiyle hesaplanacak; kelime örtüşmesi yalnızca vektör alınamazsa yedek olarak kalacak.
- Eşikler yeniden ayarlanır: GSC eşleşmesi 0.72, ölçülmüş prompt eşleşmesi 0.80, örtüşme indirimi kademeleri kosinüs skalasına göre yeniden yazılır.
- Vektörler analiz başına önbelleğe alınır (aynı konu tekrar sorulduğunda yeniden ücret çıkmaz).

## 2. Search Console'u birincil hacim kaynağı yap

- Şu an model tahmini GSC'den yüksekse gerçek veri eziliyor (`max` kullanımı). Bu kaldırılacak: eşleşme varsa **gerçek veri kazanır**, model tahmini yalnızca yedek olur.
- Gösterim sayısı doğrudan hacim sayılmayacak. Pozisyona bağlı tıklama eğrisiyle "gösterim → toplam arama talebi" dönüşümü yapılacak: düşük sıradaki bir sorguda gerçek talep gösterimden çok daha yüksektir.
- GSC'de yüksek gösterimi olup modelin hiç üretmediği konuyla ilgili sorgular, listeye ayrı aday olarak eklenecek (gerçek talep, sıfır tahmin).
- Her satırda gerçek sıra ve tıklama görünecek: "klasik aramada 8. sıradasınız, AI yanıtlarında kaynak değilsiniz".

## 3. GA4'ü kalibrasyona dahil et

- GA4 anlık görüntüsündeki yapay zeka yönlendirmeleri (ChatGPT, Perplexity, Gemini, Copilot oturumları) artık sadece rozet değil, hesaba giren bir sinyal olacak.
- Platform kırılımı sabit katsayılarla değil, markanın kendi GA4 yönlendirme dağılımıyla ağırlıklandırılacak; GA4 yoksa mevcut varsayılan katsayılara düşülecek.
- Tahmin edilen AI talebi ile gerçek AI oturum sayısı arasındaki tutarsızlık, küme güven puanını düşürecek.

## 4. Kalibrasyon katsayısı öğren

- Hem GSC'de hem model tahmininde değeri olan promptlar bir eğitim kümesi oluşturur.
- Bu kümede modelin sistematik sapması (ortanca oran) hesaplanır ve eşleşmeyen tüm tahminlere düzeltme çarpanı olarak uygulanır.
- En az 5 eşleşme yoksa kalibrasyon uygulanmaz; arayüzde bu durum açıkça belirtilir.

## 5. Tek sayı yerine aralık

- Kart artık `310 – 590 (orta 425)` biçiminde gösterecek. Bant genişliği güven skorundan türetilir: yüksek güven dar bant, düşük güven geniş bant.
- Kart altında zorunlu kaynak kırılımı: "32 promptun 6'sı Search Console verisiyle, 26'sı model tahminiyle."
- Her satırda kaynak rozeti: **Ölçüldü (GSC)** / **Ölçüldü (OneCite)** / **Kalibre tahmin** / **Ham tahmin**.
- Bağlantı yoksa net uyarı kartı: "Search Console bağlı değil — bu sayı tamamen modellenmiş tahmindir" + Entegrasyonlar sayfasına kısayol.
- Hesap kırılımı satır bazında açılabilir olacak: taban talep, AI kullanım çarpanı, uygunluk, kalibrasyon, örtüşme indirimi.

## 6. Talebi ölçüme çevir

- Her satıra "Bu prompt'u takibe al" aksiyonu: prompt izlemeye eklenir ve ilk ölçümü tetiklenir; bir sonraki analizde o satır tahmin değil ölçüm olur.

## Teknik notlar

- `src/lib/prompt-demand/types.ts`: `PromptCandidate.source` `"gsc" | "measured" | "calibrated" | "estimated"` olacak; `demandRange {low, mid, high}` ve `calibration` alanları eklenir.
- `src/lib/prompt-demand/config.ts`: pozisyon-tıklama eğrisi tablosu, kosinüs eşikleri, bant genişliği katsayıları buraya taşınır. Sabit sayı bileşenlere yazılmaz.
- `src/lib/prompt-demand/engine.ts`: `baseDemand` kalibrasyon çarpanını alır; `clusterConfidence` girdisine GA4 tutarlılığı eklenir; yeni `demandRange` fonksiyonu.
- Yeni `src/lib/prompt-demand/matching.server.ts`: embedding üretimi, kosinüs benzerliği, önbellek.
- `src/lib/prompt-demand.server.ts`: `attachSearchSignals` GSC-öncelikli hale gelir, kalibrasyon ve GA4 platform dağılımı burada hesaplanır.
- `src/routes/_authenticated/app.prompt-demand.tsx`: aralık gösterimi, kaynak rozetleri, kırılım açılır paneli, takibe alma aksiyonu.
- Sıra: (1) tipler ve config, (2) vektör eşleştirme, (3) GSC önceliği ve tıklama eğrisi, (4) kalibrasyon ve GA4, (5) arayüz.
