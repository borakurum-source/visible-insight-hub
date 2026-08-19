# AI Talep Keşfi motorunu gerçek veri odaklı yeniden kurgulama (v2)

Amaç: tek bir "425" sayısı yerine kaynağı belli, kalibre edilmiş, aralıklı ve **doğrulanmış** bir tahmin üretmek. Bu sürüm, ilk taslaktaki üç boşluğu kapatır: eşiklerin doğrulanmaması, "ölçüldü" etiketinin modellenmiş sayılara da yapıştırılması ve GA4 sinyalinin olduğundan güçlü sayılması.

## 0. Önce doğrulama, sonra üretim (yeni)

Vektör eşleştirme doğrudan canlıya alınmaz.

- 30-50 çiftlik elle etiketli bir test fikstürü hazırlanır (aday prompt ↔ GSC sorgusu, doğru/yanlış eşleşme). Türkçe, İngilizce ve karışık dilli örnekler ile "konu yakın ama niyet farklı" çiftler (örn. "AI görünürlük platformu" ↔ "AI güvenlik platformu") mutlaka bulunur.
- Eşikler bu setten türetilir; plandaki 0.72/0.80 sayıları **varsayılan başlangıç değeri**, nihai değer değildir. Hedef: yanlış pozitif oranı %5'in altında.
- Gölge (shadow) mod: vektör eşleştirme bir süre Jaccard ile paralel çalışır, sonuç kullanılmaz yalnızca loglanır. `prompt_demand_match_log` tablosuna aday metni, GSC sorgusu, Jaccard skoru, kosinüs skoru ve hangi yöntemin eşleştirdiği yazılır. Elle örnekleme kontrolünden sonra geçiş yapılır.
- Sınırda eşleşme uyarısı: kosinüs skoru eşiğe 0.02'den yakınsa eşleşme kabul edilse bile log'a "borderline" uyarısı düşer.
- Dil testi: aynı set Türkçe ve İngilizce sorgularla ölçülür; eşikler dil başına ayrı tutulabilir (config'de dile göre override alanı bırakılır).

Neden: Jaccard'ın hatası yanlış negatif (eşleşmeyi kaçırır), embeddingin hatası yanlış pozitiftir. "AI görünürlük platformu" ile "AI güvenlik platformu" kosinüste yakın çıkar ama niyet farklıdır — bu satırlar "gerçek veri" diye işaretlenirse hata, tahminden daha zararlı olur.

## 1. Eşleştirmeyi vektöre taşı (ön filtreli)

- Ölçek koruması: her aday × her GSC sorgusu karşılaştırılmaz. Önce ucuz bir ön filtre (ortak token, karakter n-gram örtüşmesi, uzunluk oranı) aday havuzunu prompt başına en fazla ~25 sorguya indirir; kosinüs yalnızca bu havuzda çalışır.
- Embedding üretimi toplu (batch) yapılır; Lovable AI embeddings tek çağrıda en fazla 100 girdi ile.
- **Kalıcı önbellek:** yeni `embedding_cache` tablosu (metin hash'i, model adı, vektör, son kullanım). Bellek içi önbellek sunucusuz ortamda sıfırlandığı için "aynı konu tekrar sorulduğunda ücret çıkmaz" vaadi ancak DB kaydıyla tutar. Model değişirse hash anahtarı değişir, eski kayıtlar kendiliğinden geçersizleşir.
- Vektör alınamazsa (hata/kota) Jaccard yedek olarak kalır ve satır "düşük güvenli eşleşme" olarak işaretlenir.

## 2. Search Console'u birincil hacim kaynağı yap — ama etiketi dürüst tut

- `max()` hatası kaldırılır: eşleşme varsa **gerçek veri kazanır**, model tahmini yalnızca yedek olur.
- Gösterim → toplam arama talebi dönüşümü pozisyon-tıklama eğrisiyle yapılır. Bu dönüşüm bir modeldir, ölçüm değildir.
- **Etiket ayrımı (kritik):** ham `impressions`, `clicks`, `position` değerleri **Ölçüldü (GSC)**. Eğriyle büyütülmüş toplam talep sayısı **GSC temelli tahmin**. İkisi aynı rozetle gösterilmez.
- Pozisyon-tıklama eğrisi config'de tutulur ve arayüzde kaynağı yazılır: "genel endüstri ortalaması CTR eğrisi, sektöre özel değil". Kırılım panelinde eğrinin uyguladığı çarpan satır olarak görünür.
- GSC'de yüksek gösterimi olup modelin üretmediği konuyla ilgili sorgular ayrı aday olarak listeye eklenir.
- Her satırda gerçek sıra ve tıklama görünür: "klasik aramada 8. sıradasınız, AI yanıtlarında kaynak değilsiniz".

## 3. GA4: zayıf sinyal olarak, eşikli kullanım

- GA4 yapay zeka yönlendirmeleri (ChatGPT, Perplexity, Gemini, Copilot) platform dağılımını ağırlıklandırmak için kullanılır — **ancak en az 30 AI yönlendirmeli oturum varsa.** Altındaki hacimlerde varsayılan katsayılara dönülür ve arayüzde "GA4 verisi yetersiz" notu düşülür.
- Ölçüm sınırı arayüzde açıkça yazılır: ChatGPT mobil uygulaması çoğunlukla yönlendirme bilgisi göndermez, dolayısıyla GA4 gerçek AI talebinin yalnızca bir alt kümesini görür.
- **Kavramsal düzeltme:** GA4 ile tahmin arasındaki fark, talep tahmini hatasını değil **tıklama oranı farkını** ölçer. Bu yüzden bu sinyal küme güven puanını düşürmez; ayrı bir "tıklanma sinyali" rozeti olarak gösterilir (`yüksek / düşük / veri yok`). Yüksek talepli ama tıklama getirmeyen kümeler haksız yere düşük güven etiketi yemez.

## 4. Kalibrasyon katsayısı öğren (global, açıkça global)

- Hem GSC'de hem model tahmininde değeri olan promptlar eğitim kümesi olur; sapma **ortanca oran** ile hesaplanır (aykırı değerlere dayanıklı).
- En az 5 eşleşme yoksa kalibrasyon uygulanmaz.
- Katsayı tüm niyet tiplerine aynı uygulanır. Bu bilinçli bir v1 sadeleştirmesidir ve kırılım panelinde aynen böyle yazılır: "global düzeltme, niyet bazlı değil".
- Her analizde kalibrasyon oranı `prompt_demand_calibration_log` tablosuna yazılır. Sürekli aynı yöne büyüyen bir sapma, kalibrasyonun değil model tahmininin bozulduğunun işaretidir; bu drift admin panelinde izlenir.

## 5. Tek sayı yerine aralık (somut formül)

- Bant: `yarıGenişlik = mid × BASE_WIDTH × (1 - confidence)`, `BASE_WIDTH = 0.6`, `confidence ∈ [0,1]`.
- Sınırlar: yarı genişlik en az `mid × 0.12`, en çok `mid × 0.55`. Böylece "5 – 4800" gibi anlamsız bantlar oluşmaz.
- Gösterim: `310 – 590 (orta 425)`.
- Kart altında zorunlu kaynak kırılımı: "32 promptun 6'sı Search Console verisiyle, 26'sı model tahminiyle."
- Bağlantı yoksa net uyarı: "Search Console bağlı değil — bu sayı tamamen modellenmiş tahmindir" + Entegrasyonlar kısayolu.
- Satır bazında açılabilir hesap kırılımı: taban talep, CTR eğrisi çarpanı, AI kullanım çarpanı, uygunluk, kalibrasyon, örtüşme indirimi.

## 6. Talebi ölçüme çevir

- Her satıra "Bu prompt'u takibe al": prompt izlemeye eklenir ve ilk ölçümü tetiklenir.
- **Ara durum ayrı gösterilir:** "Takipte — ilk ölçüm bekleniyor". Satır aniden boşalmış gibi görünmez; ölçüm gelince rozet **Ölçüldü (OneCite)** olur.

## Teknik notlar

- Tip ayrımı (rozetlerle birebir): `origin: "gsc" | "onecite" | "model"` ve `source: "measured" | "modeled" | "calibrated" | "estimated"`. `"gsc"` değeri `source` enum'undan çıkarılır. Dört rozet: Ölçüldü (GSC) = `gsc/measured`, Ölçüldü (OneCite) = `onecite/measured`, GSC temelli tahmin = `gsc/modeled`, Kalibre tahmin = `model/calibrated`, Ham tahmin = `model/estimated`.
- `types.ts`: yukarıdaki alanlar + `demandRange {low, mid, high}`, `calibration {applied, ratio?, matchedSampleSize?}`, `ga4Signal {hasEnoughData, referralSessions?, platformMix?}`, `matchMethod: "vector" | "jaccard"`, `matchScore`.
- `config.ts`: CTR eğrisi tablosu (kaynak notuyla), dil bazlı kosinüs eşikleri, `BASE_WIDTH` ve bant sınırları, GA4 minimum oturum eşiği, kalibrasyon minimum eşleşme sayısı.
- `engine.ts`: kalibrasyon çarpanı, `demandRange` fonksiyonu, tıklama sinyalinin güvenden ayrılması.
- Yeni `src/lib/prompt-demand/matching.server.ts`: ön filtre, toplu embedding, kosinüs, kalıcı önbellek okuma/yazma.
- `prompt-demand.server.ts`: GSC öncelikli `attachSearchSignals`, kalibrasyon hesabı, GA4 eşikli dağılım.
- `app.prompt-demand.tsx`: aralık, beş rozet, kırılım paneli, takip aksiyonu ve ara durum.
- Veritabanı: `embedding_cache`, `prompt_demand_match_log`, `prompt_demand_calibration_log` tabloları (marka bazlı erişim kuralları ile).
- Kalibrasyon ve aralık matematiği saf fonksiyon olarak `engine.ts` içinde kalır (I/O'suz, test edilebilir). `attachSearchSignals` yalnızca veri toplamayı yönetir.
- Kırılım paneli, gösterim için yeniden hesap yapmaz; motorun ürettiği ara hesap nesnesini okur.
- Sıra: (1) tipler + config + tablolar, (2) eşleştirme katmanı **gölge modda** ve etiketli fikstür doğrulaması, (3) GSC önceliği ve CTR eğrisi, (4) kalibrasyon + GA4 eşikli sinyal, (5) arayüz, (6) doğrulama sonrası vektör eşleştirmenin canlıya alınması.

## Test ve kabul kriterleri

- Birim testler: kosinüs eşleştirme (etiketli fikstüre karşı, Jaccard ile uyuşmazlık oranı raporlanır), CTR eğrisi dönüşümü, kalibrasyon oranı (5 eşleşme altı atlama durumu dahil), `demandRange` bant formülü (taban/tavan kırpma dahil).
- Tip kontrolü, lint ve build temiz geçer.
- Elle doğrulama: eşleşen satırlarda gerçek sıra/tıklama ve doğru "Ölçüldü (GSC)" ↔ "GSC temelli tahmin" ayrımı; eşleşmeyen satırlarda doğru kalibre/ham tahmin rozeti; GSC bağlı değilken uyarı kartı; takibe alma sonrası satırın görünür şekilde "ilk ölçüm bekleniyor" durumuna geçmesi.
- Bütünlük kuralı: CTR eğrisiyle ölçeklenmiş veya kalibre edilmiş hiçbir sayı arayüzde "ölçüldü" olarak adlandırılmaz.
