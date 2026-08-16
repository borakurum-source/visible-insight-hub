export interface MockClaim {
  id: number;
  statement: string;
  category: "hizmet" | "usp" | "sayisal" | "sertifika";
  status: "dogrulandi" | "beklemede" | "reddedildi";
  usedInAnswers: number;
  source: string;
}

export const mockClaims: MockClaim[] = [
  { id: 1, statement: "OneCite, 40'tan fazla markanın AI görünürlüğünü izliyor.", category: "sayisal", status: "dogrulandi", usedInAnswers: 18, source: "Kurumsal sayfa" },
  { id: 2, statement: "Tek platformda ölçüm, kanıt yönetimi ve aksiyon takibi sunan tek araç.", category: "usp", status: "dogrulandi", usedInAnswers: 11, source: "Ürün sayfası" },
  { id: 3, statement: "ISO 27001 uyumlu veri işleme süreci.", category: "sertifika", status: "beklemede", usedInAnswers: 0, source: "Manuel giriş" },
  { id: 4, statement: "GEO görev panosu ile ekipler arası atama yapılabilir.", category: "hizmet", status: "dogrulandi", usedInAnswers: 7, source: "Özellik dokümanı" },
];
