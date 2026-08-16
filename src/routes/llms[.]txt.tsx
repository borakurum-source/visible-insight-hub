import { createFileRoute } from "@tanstack/react-router";

const CONTENT = `# OneCite (1cite.com)

> OneCite, markaların yapay zeka asistanlarının (ChatGPT, Gemini, Perplexity, Copilot) cevaplarında kaynak olarak seçilip seçilmediğini ölçen ve bunu artırmak için kanıt üreten bir yapay zeka görünürlük (GEO) platformudur.

## Ne yapar
- Atıf payı ölçümü: Tanımlı sorularda markanın anılma oranı, sıralaması ve gösterilen kaynak alan adları ölçülür.
- Skor kırılımı: Anılma oranı (%40), atıf payı (%25), konum kalitesi (%15), bilgi kapsamı (%10), iddia kanıtı (%10).
- Eksik kanıt (evidence gap) analizi: Yapay zekanın alıntılayabileceği kanıtın hangi konularda eksik olduğunu gösterir.
- Uygulama: Eksik kanıtı içerik ve bilgi bankası görevlerine dönüştürür.

## Önemli sayfalar
- Ana sayfa: https://1cite.com/
- Ücretsiz yapay zeka hazırlık raporu: https://1cite.com/ucretsiz-yapay-zeka-gorunurluk-raporu
- Platform: https://1cite.com/platform
- Atıf payı: https://1cite.com/platform/citation-share
- Eksik kanıtlar: https://1cite.com/platform/evidence-gaps
- Ajanslar için: https://1cite.com/solutions/agencies
- Fiyatlandırma (USD): https://1cite.com/fiyatlandirma
- Kaynaklar / makaleler: https://1cite.com/makaleler

## Fiyatlandırma özeti
- Ücretsiz: 1 marka, 10 soru, 2 rakip.
- Başlangıç: 29 USD/ay.
- Büyüme: 79 USD/ay.
- Ajans: 199 USD/ay, sınırsız müşteri.
Yıllık ödemede iki ay ücretsizdir.

## İletişim
E-posta: hello@1cite.com
`;

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(CONTENT, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        }),
    },
  },
});
