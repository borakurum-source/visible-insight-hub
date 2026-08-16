# OneCite Panel: Bilgi Grafiği (Vektör), IA Yeniden Düzeni ve İçerik Motoru

## Doğrulanan mevcut durum

- Panelde 17 sayfa var; yan menü 4 grupta 7 bağlantı gösteriyor. `Prompt Keşfi`, `Kaynak Keşfi`, `Bilgi Grafiği`, `Rapor`, `Entegrasyonlar`, `Hesabım`, `Fiyatlandırma` menüde yok — yalnızca sayfa üstündeki `PanelSubnav` hapları üzerinden erişiliyor. Şikayet ettiğiniz tutarsızlık tam olarak bu: aynı hiyerarşi iki farklı yerde farklı anlatılıyor.
- `Bilgi Grafiği` (`app.graph.tsx`) tamamen statik: `panel-mock/graph.ts` içindeki 7 sabit düğüm renkli etiket olarak listeleniyor. Ne 3D var, ne gerçek veri, ne embedding.
- `İçerik Üretimi` (`app.content.tsx`) tamamen mock; "Taslak üret" butonunun arkasında hiçbir çağrı yok.
- Kod tabanında hiçbir embedding kodu yok (`rg embed` yalnızca mock içinde `embeddedPct: 88` sahte yüzdesini buluyor). Yani "bilgi bankası → embedding → marka zekâsı" hattı bugün mevcut değil; bilgi kaynakları sadece başlık+URL olarak saklanıyor, içerik metni bile çekilmiyor.
- Perplexity `sonar` ölçüm ve keşifte gerçekten çalışıyor; DeepSeek üretimde kullanılıyor.

**Önemli teknik düzeltme:** Perplexity'nin embedding API'si yok — yalnızca arama/cevap sunuyor. Embedding'i Lovable AI Gateway (`google/gemini-embedding-2`, 3072 boyut) + Postgres `pgvector` ile kuracağız. Perplexity gerçek atıf/kaynak katmanında kalmaya devam edecek. Bu ragsignal mimarisinin aynısı (onlar Jina + pgvector kullanıyor), sadece sağlayıcı farklı.

## Rakip taraması — ne öğrendik

Profound, Peec AI, Otterly, Scrunch, Athena HQ, Writesonic GEO, Rankscale, Evertune ve Semrush AI Toolkit'in tamamı üç sütuna yakınsıyor: **Görünürlük → Kaynaklar/Atıflar → Rakipler**, öncesinde 10 dakikalık bir "marka + rakip + prompt" sihirbazı. Rankscale bunu açıkça "beş sekme, beş soru" diye anlatıyor. Athena ve Writesonic navigasyonu bir anlatıya bağlıyor: *İzle → Anla → Harekete geç*.

Ayırt edici nokta: bu ürünlerin **hiçbirinde** kullanıcıya açılan bir bilgi bankası/embedding katmanı yok — tek istisna Scrunch'ın beta "Knowledge Studio"su. Görsel bir bilgi grafiği ise hiçbirinde yok. ragsignal ise tam hattı yayımlıyor (çok kaynaklı KB → hash ile artımlı indeks → embedding/pgvector → kaynak ağırlığı + tazelik sönümü → LLM yeniden sıralama → küratör ajanı) ama bunu bir arayüz olarak göstermiyor.

**Stratejik sonuç:** OneCite'ın farkı dashboard sayısı değil, *kanıt katmanı*. Bilgi Grafiği bu katmanın görünür yüzü olmalı — rakiplerin hiçbirinde olmayan tek ekran. Navigasyonu da Athena/Rankscale netliğinde sadeleştirip bu farkı öne çıkaracağız.

## Yeni bilgi mimarisi

Menü, sayfa hapları ile birebir aynı hiyerarşiyi anlatacak: her menü öğesi bir "hub", haplar o hub'ın sekmeleri.

```text
İZLE
  Komuta Merkezi        genel skor, son ölçüm, sıradaki aksiyon
  Görünürlük            [Promptlar] [Prompt Keşfi] [Ölçüm & Skor] [Atıf Kaynakları] [Rapor]

ANLA
  Bilgi Grafiği         [3D Vektör Haritası] [Varlıklar] · marka zekâsının görünür hâli
  Bilgi Bankası         [Kaynaklar] [İddialar] [Kapsam Boşlukları]

HAREKETE GEÇ
  İçerik Üretimi        boşluk → grafiğe dayalı taslak
  Görevler              GEO görev panosu

ÇALIŞMA ALANI
  Ayarlar               [Ayarlar] [Entegrasyonlar] [Hesabım] [Plan]
  Admin                 (yalnız yönetici)
```

Değişiklikler: `Bilgi Grafiği` alt sekmeden ana menüye çıkıyor (ürünün farkı orada); `Rapor` ve `Atıf Kaynakları` Görünürlük hub'ının sekmesi oluyor; `Fiyatlandırma` menü metni "Plan" oluyor. Kurulum bitmeden yalnızca Komuta Merkezi + Kurulum açık kalmaya devam eder; kilitli öğede "Kurulumu tamamlayın" ipucu kalır.

Ek UX düzeltmeleri: her ekrana tek aksiyonlu boş durum; Komuta Merkezi'ne "sıradaki en iyi adım" kartı (hangi aşamada eksik varsa oraya yönlendirir); üst bilgi çubuğunda son ölçüm zamanı ve kredi/kullanım rozeti.

## Bilgi grafiği süreci — uçtan uca

```text
1  KAYNAK      bilgi bankası URL'i, manuel metin, entegrasyon içeriği
2  ÇEKME       sayfa metni alınır, hash'lenir (değişmeyen kaynak yeniden işlenmez)
3  PARÇALAMA   ~1000 karakter, örtüşmeli parçalar
4  EMBEDDING   Lovable AI Gateway · gemini-embedding-2 · 3072 boyut
5  DEPOLAMA    pgvector + HNSW (halfvec) · kaynak tipi ağırlığı + tazelik sönümü
6  VARLIK      her parçadan marka/ürün/rakip/konu/lokasyon varlıkları ve ilişkileri
7  GÖRSEL      3D projeksiyon: benzer parçalar birbirine yakın küme olur
8  KULLANIM    içerik üretimi ve marka zekâsı önce bu vektörlerden alıntı çeker
```

Ekranda ne görülecek: dönen 3D nokta bulutu; her nokta bir bilgi parçası, rengi kaynak tipini, parlaklığı tazeliğini gösterir. Kümeler markanın güçlü olduğu konular; seyrek/boş bölgeler **kanıt boşlukları** — üzerine tıklayınca "bu konuda içerik üret" aksiyonuna bağlanır. Üstte ince bir varlık ilişki katmanı (marka → ürün → rakip) çizilir. Sağ panelde seçilen noktanın kaynağı, metni ve hangi promptlarda alıntılandığı listelenir. İkinci sekmede aynı veri sade 2D varlık haritası olarak sunulur.

## İçerik üretimi — gerçek veriye bağlanış

Kapsam boşluğu artık uydurulmuyor, iki gerçek sinyalden hesaplanıyor: (a) ölçümde markanın anılmadığı onaylı promptlar, (b) o promptun embedding'ine yeterince yakın bilgi parçasının bulunmaması. Her boşluk için "Taslak üret" DeepSeek'e gider ve **yalnızca** vektör aramasıyla getirilen kendi bilgi parçalarınızı ve marka zekânızı bağlam olarak kullanır; taslağın altında hangi kaynaklara dayandığı listelenir. Taslaklar veritabanına kaydedilir, durumu (taslak/incelemede/yayınlandı) takip edilir.

## Teknik notlar

- Yeni tablolar: `kb_chunks` (brand_id, source_id, content, `vector(3072)`, source_weight, content_hash, created_at), `graph_entities`, `graph_edges`, `content_drafts`. Hepsi marka üyeliğine bağlı RLS + GRANT ile. `pgvector` etkinleştirilecek, HNSW indeks halfvec cast ile.
- Yeni server fonksiyonları: `ingestKnowledgeSource` (çek → parçala → embed → kaydet), `matchChunks` (SQL `match_kb_chunks`), `buildGraph`, `listContentGaps`, `generateDraft`.
- 3D görselleştirme `react-force-graph-3d`/three.js ile, `React.lazy` + `<ClientOnly>` arkasında (SSR'a sızmayacak). Projeksiyon sunucuda hesaplanıp koordinat olarak gönderilir, tarayıcıda 3072 boyutlu vektör taşınmaz.
- Embedding maliyeti kaynak hash'i ile sınırlanır; yalnızca değişen içerik yeniden işlenir.
- Mock dosyaları (`panel-mock/graph.ts`, `content.ts`) bu turda kaldırılır.

## Sıra

1. Veritabanı: pgvector + 4 tablo + RLS/GRANT + eşleştirme fonksiyonu
2. Alım hattı: çekme → parçalama → embedding → depolama; Bilgi Bankası ekranında durum göstergesi
3. Bilgi Grafiği ekranı: 3D vektör haritası + varlık katmanı + seçim paneli
4. İçerik Üretimi: gerçek boşluk hesabı + kanıta dayalı taslak üretimi
5. IA yeniden düzeni: menü/hap birliği, boş durumlar, "sıradaki adım" kartı
