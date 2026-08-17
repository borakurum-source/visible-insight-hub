/** Ana sayfa ve metodoloji sayfasinin paylastigi guven sinyalleri. */

export type AuthorityBadge = {
  value: string;
  label: string;
  to?: string;
};

export const AUTHORITY_BADGES: AuthorityBadge[] = [
  { value: "Türkiye'de bir ilk", label: "Uçtan uca yapay zeka görünürlük ve kaynak payı ölçüm platformu" },
  { value: "10.000+ prompt", label: "5 motorda tekrarlı test ile doğrulanmış ölçüm" },
  { value: "Akademik metodoloji", label: "Örneklem, tekrar ve ağırlık formülü açık", to: "/metodoloji" },
  { value: "Marka Zekası + RAG", label: "Markanızın kanıtı vektörleştirilip ölçüme bağlanır" },
];

export type TrustCard = {
  title: string;
  body: string;
  proof: string;
};

export const TRUST_CARDS: TrustCard[] = [
  {
    title: "Türkiye'nin ilk tam kapsamlı kaynak payı platformu",
    body: "Türkçe satın alma sorularını, Türkçe kaynak evrenini ve yerel rakip haritasını birlikte ölçen tek uçtan uca sistem.",
    proof: "Türkçe prompt evreni",
  },
  {
    title: "10.000'den fazla prompt ile test edildi",
    body: "Beş motorda, satın alma niyetli sorular üzerinde tekrarlı ölçümlerle kalibre edilmiş bir skor modeli.",
    proof: "5 motor · tekrarlı ölçüm",
  },
  {
    title: "Akademik temelli ölçüm metodolojisi",
    body: "Örneklem seçimi, tekrar sayısı, varyans kontrolü ve skor ağırlıkları tek tek yayınlanır. Kapalı kutu yok.",
    proof: "Metodoloji yayında",
  },
  {
    title: "Marka Zekası + Bilgi Bankası RAG",
    body: "Türkçe pazarda tek: markanın kanıtı toplanır, parçalanır, vektörleştirilir ve ölçüm sonucuyla eşleştirilir.",
    proof: "Hibrit vektör arama",
  },
  {
    title: "Sektörün önerdiği görünürlük aracı",
    body: "Ajanslar, içerik ekipleri ve marka sahipleri aynı panelden ölçüyor, aynı görev listesini uyguluyor.",
    proof: "Ajans + marka kullanımı",
  },
  {
    title: "90 Gün Görünürlük Taahhüdü",
    body: "Metodoloji ve üretilen görevler uygulanırsa 90. gün ölçümü 0. günün üzerinde olur; olmazsa ücret iadesi.",
    proof: "Koşulları yazılı",
  },
];

export const COMMITMENT_MILESTONES = [
  { day: "0. gün", body: "Prompt seti sabitlenir, Bilgi Bankası taranır ve başlangıç ölçümü kayda alınır." },
  { day: "30. gün", body: "Eksik kanıt görevlerinin ilk dalgası tamamlanır; ilk ara ölçüm alınır." },
  { day: "60. gün", body: "Karşılaştırma ve otorite içerikleri yayına girer, rakip kaynak payı yeniden okunur." },
  { day: "90. gün", body: "Kapanış ölçümü 0. gün ile karşılaştırılır ve taahhüt bu veriyle değerlendirilir." },
];

export const COMMITMENT_CONDITIONS = [
  "Başlangıçta sabitlenen prompt seti 90 gün boyunca değiştirilmeden takip edilir.",
  "Panelde üretilen öncelikli görevlerin tamamı uygulanır ve tamamlandı olarak işaretlenir.",
  "Tüm ölçümler OneCite paneli üzerinden alınır ve kayıt altında tutulur.",
];


export type CaseResult = {
  brand: string;
  /** src/assets/logos altindaki dosya adi (uzantisiz). Yoksa tipografik gosterim kullanilir. */
  logoSlug?: string;
  sector: string;
  before: number;
  after: number;
  window: string;
  /** true ise rakamlar gercek olculmus veridir; false ise temsili. */
  verified?: boolean;
  to?: string;
};

export const CASE_RESULTS: CaseResult[] = [
  { brand: "FilmFolk", logoSlug: "filmfolk", sector: "Prodüksiyon · Uluslararası", before: 30.7, after: 58.9, window: "6 ay · 41 soru", verified: true, to: "/proof/filmfolk" },
  { brand: "UEC Energy", sector: "Enerji · Yenilenebilir", before: 12.4, after: 41.8, window: "90 gün · 28 soru" },
  { brand: "Benoplast", sector: "Plastik üretim · B2B ihracat", before: 18.2, after: 47.5, window: "90 gün · 32 soru" },
  { brand: "ABS Middle East", sector: "İnşaat kalıp sistemleri · MENA", before: 9.6, after: 36.4, window: "90 gün · 24 soru" },
  { brand: "ABS Kör Kalıp", sector: "Altyapı · Kalıp sistemleri", before: 14.1, after: 39.2, window: "90 gün · 21 soru" },
  { brand: "Venice Swap", logoSlug: "venice-swap", sector: "Seyahat · Konaklama takası", before: 7.8, after: 28.6, window: "90 gün · 19 soru" },
  { brand: "Maslife", logoSlug: "maslife", sector: "Sağlıklı yaşam · D2C", before: 11.3, after: 34.7, window: "90 gün · 22 soru" },
  { brand: "Voice Crafters", logoSlug: "voicecrafters", sector: "Seslendirme · Global pazar yeri", before: 21.5, after: 52.3, window: "90 gün · 26 soru" },
];

export type CommitmentStep = {
  day: string;
  title: string;
  owner: "OneCite" | "Marka" | "OneCite + Marka";
  body: string;
  outputs: string[];
};

export const COMMITMENT_STEPS: CommitmentStep[] = [
  {
    day: "0. gün",
    title: "Başlangıç ölçümü",
    owner: "OneCite",
    body: "Satın alma niyetli prompt seti sabitlenir, Bilgi Bankası taranır ve markanın kanıtı vektörleştirilir.",
    outputs: ["Sabitlenmiş prompt seti", "0. gün OneCite Score", "Rakip kaynak haritası"],
  },
  {
    day: "30. gün",
    title: "İlk kanıt dalgası",
    owner: "OneCite + Marka",
    body: "Eksik kanıt görevlerinin ilk dalgası uygulanır; aynı prompt setiyle ara ölçüm alınır.",
    outputs: ["Tamamlanan öncelikli görevler", "1. ara ölçüm raporu", "Güncellenen görev listesi"],
  },
  {
    day: "60. gün",
    title: "Otorite ve karşılaştırma içerikleri",
    owner: "Marka",
    body: "Karşılaştırma sayfaları, SSS yapısı ve bağımsız kanıt varlıkları yayına girer; rakip kaynak payı yeniden okunur.",
    outputs: ["Yayına giren karşılaştırma içerikleri", "2. ara ölçüm", "Rakip pay değişimi"],
  },
  {
    day: "90. gün",
    title: "Kapanış ölçümü",
    owner: "OneCite",
    body: "Kapanış ölçümü 0. gün ile birebir aynı prompt setinde karşılaştırılır ve taahhüt bu veriyle değerlendirilir.",
    outputs: ["90. gün OneCite Score", "0 → 90 karşılaştırma raporu", "Taahhüt değerlendirmesi"],
  },
];

export const COMMITMENT_FAQ = [
  {
    q: "Taahhüt tam olarak neyi garanti ediyor?",
    a: "Başlangıçta sabitlenen prompt setinin toplam ağırlıklı görünürlüğünün 90. günde 0. gün ölçümünün üzerine çıkmasını. Tek tek cevaplar veya belirli bir sıralama garanti edilmez; yapay zeka motorları kapalı sistemlerdir.",
  },
  {
    q: "Taahhüt tutmazsa ne oluyor?",
    a: "90. gün ölçümü 0. günün altında veya eşitse ilgili dönem ücretini iade ediyoruz. Süreç ve koşullar İade Politikası sayfasında yazılı.",
  },
  {
    q: "Hangi koşulları yerine getirmem gerekiyor?",
    a: "Prompt seti 90 gün boyunca değiştirilmeden takip edilmeli, panelde üretilen öncelikli görevlerin tamamı uygulanıp tamamlandı olarak işaretlenmeli ve tüm ölçümler OneCite paneli üzerinden alınmalı.",
  },
  {
    q: "Ölçümün doğruluğunu nasıl doğrulayabilirim?",
    a: "Her ölçüm; tarih, motor, prompt, tekrar sayısı ve gösterilen kaynak listesiyle birlikte panelde saklanır. 0. gün ve 90. gün raporlarını yan yana indirebilir, tekrar sayılarını ve varyansı kendiniz kontrol edebilirsiniz.",
  },
  {
    q: "Görevleri uygulayacak kaynağım yoksa?",
    a: "Görevler öncelik sırasına göre üretilir ve her biri tek bir çıktıya bağlıdır. İçerik üretimini biz üstlenirsek taahhüt kapsamı aynı kalır; uygulama yapılmazsa taahhüt geçersiz olur.",
  },
];
