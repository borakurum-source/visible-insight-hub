export interface FaqItem {
  q: string;
  a: string;
}

export const faqs: FaqItem[] = [
  {
    q: "AI SEO / GEO nedir, klasik SEO'dan farkı ne?",
    a: "Klasik SEO, arama motoru sonuç sayfasında (Google) sıralanmaya odaklanır. GEO (Generative Engine Optimization), kullanıcı sorusuna bir AI asistanının (ChatGPT, Perplexity, Gemini, Claude, Google AI Mode) ürettiği cevapta markanızın anılması veya kaynak olarak gösterilmesine odaklanır. İkisi farklı sinyallerle çalışır; biri diğerinin yerini tutmaz.",
  },
  {
    q: "OneCite, ChatGPT'de veya Gemini'de sonucu doğrudan mı ölçüyor?",
    a: "Ölçüm motoru, Perplexity'nin Sonar arama API'sini kullanarak gerçek zamanlı arama sinyalini analiz eder; bu sinyal AI cevap motorlarının davranışıyla yüksek korelasyon gösterir. Belirli bir müşteri için diğer platformlarda manuel doğrulama da yapılabilir — bu durumda kapsam ve metodoloji önceden netleştirilir.",
  },
  {
    q: "Sonuçları ne zaman görürüm?",
    a: "İlk kurulum (Bilgi Bankası taraması + prompt seti) genellikle aynı gün tamamlanır. Görünürlük trendinde anlamlı bir değişim görmek için, sektöre ve başlangıç durumunuza göre 4-12 haftalık bir sprint öneriyoruz.",
  },
  {
    q: "Ajans olarak birden fazla müşteriyi tek hesaptan yönetebilir miyim?",
    a: "Evet. Agency planı, sınırsız müşteri ekleyip her biri için ayrı bilgi bankası, prompt seti ve rapor yönetmenizi sağlar; white-label domain seçeneğiyle raporları kendi markanızla sunabilirsiniz.",
  },
  {
    q: "Verilerim güvende mi?",
    a: "Her müşterinin verisi kendi organizasyonuna izole şekilde saklanır. Raporlar yalnızca ölçülen gerçek veriyi içerir, yorum veya tahmin katmaz.",
  },
  {
    q: "Mevcut planımı değiştirmek veya iptal etmek istersem ne olur?",
    a: "Hesabım sayfasından bize doğrudan ulaşabilirsiniz; plan değişikliği ve faturalandırma talepleri ekibimiz tarafından elle yönetilir.",
  },
];
