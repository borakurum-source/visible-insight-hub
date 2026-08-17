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

