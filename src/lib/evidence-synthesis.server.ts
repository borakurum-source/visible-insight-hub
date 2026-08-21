import type { BrandMention } from "./measurement.server";
import type { ExtractedEvidence } from "./extract.server";

export type ContentPriority = {
  gap: string;
  linked_reason: string;
  suggested_format: "article" | "faq" | "case-study" | "pricing-page" | "comparison" | "other";
  page_type: string;
  priority: "high" | "medium" | "low";
};

export type EvidenceSynthesis = {
  brand_domain: string;
  competitor_domain: string;
  prompt_text: string;
  content_priorities: ContentPriority[];
};

/**
 * Aşama 1 (AI cevapı + brand nedenleri) ve Aşama 2 (Firecrawl kanıt çıkarımı)
 * sonuçlarını sentezleyerek, marka için üretilmesi gereken içerik listesini
 * Merkezi Perplexity model gateway'i ile olustur.
 */
export async function synthesizeEvidenceGap(input: {
  brandName: string;
  brandDomain: string;
  competitorDomain: string;
  promptText: string;
  aiAnswer: string;
  citedReasons: BrandMention[];
  brandEvidence: ExtractedEvidence | null;
  competitorEvidence: ExtractedEvidence | null;
}): Promise<ContentPriority[]> {
  const { aiJson } = await import("./ai.server");

  const citedReasonsStr =
    input.citedReasons.length > 0
      ? input.citedReasons.map((r) => `- ${r.name}: ${r.reason || "belirtilmemiş"}`).join("\n")
      : "Belirtilmemiş";

  const brandEvidenceStr = input.brandEvidence
    ? `Kanıt türleri: ${input.brandEvidence.citation_evidence.evidence_types_present.join(", ") || "yok"}
Eksik: ${input.brandEvidence.evidence_gap.missing_evidence.join(", ") || "yok"}`
    : "Veriye erişim yok";

  const competitorEvidenceStr = input.competitorEvidence
    ? `Kanıt türleri: ${input.competitorEvidence.citation_evidence.evidence_types_present.join(", ") || "yok"}
Eksik: ${input.competitorEvidence.evidence_gap.missing_evidence.join(", ") || "yok"}`
    : "Veriye erişim yok";

  const result = await aiJson<{
    content_priorities: Array<{
      gap: string;
      linked_reason: string;
      suggested_format: string;
      page_type: string;
      priority: string;
    }>;
  }>(
    [
      {
        role: "system",
        content: `Sen bir SEO/İçerik stratejisti. Verilen AI yanıtı, brand ve rakip kanıt analizi tarafından
AI'ın cevabında ${input.brandName}'ı önerme sebebini ve her iki sitenin kanıt farkını analiz ederek,
${input.brandName}'in AI yanıtlarında kaynak olarak seçilmesi için üretmesi gereken içerik listesini çıkar.

Her görev için:
1. Hangi kanıt boşluğu var (gap)
2. AI'ın cevabında hangi sebeble bağlantılı (linked_reason)
3. Hangi formatta üretilmeli (article/faq/case-study/pricing-page/comparison/other)
4. Hangi sayfa tipinde (pricing, features, faq, case-studies, vs)
5. Aciliyet seviyesi (high/medium/low) — rakip de varsa high, gap büyükse high

Yanıtı tam JSON olarak ver.`,
      },
      {
        role: "user",
        content: `Sorgu: "${input.promptText}"

AI Yanıtında Önerilen Markalar ve Sebepler:
${citedReasonsStr}

${input.brandName} (${input.brandDomain}) Kanıt Analizi:
${brandEvidenceStr}

${input.competitorDomain} Kanıt Analizi:
${competitorEvidenceStr}

${input.brandName} için AI yanıtında kaynak olarak seçilmesi için hangi içerikleri üretmeli?
Yanıt JSON: {"content_priorities": [{gap, linked_reason, suggested_format, page_type, priority}...]}`,
      },
    ],
    { content_priorities: [] },
  );

  return (result.content_priorities ?? []).map((item) => ({
    gap: String(item.gap).slice(0, 500),
    linked_reason: String(item.linked_reason).slice(0, 300),
    suggested_format: ([
      "article",
      "faq",
      "case-study",
      "pricing-page",
      "comparison",
      "other",
    ].includes(String(item.suggested_format))
      ? item.suggested_format
      : "other") as ContentPriority["suggested_format"],
    page_type: String(item.page_type).slice(0, 100),
    priority: (["high", "medium", "low"].includes(String(item.priority))
      ? item.priority
      : "medium") as "high" | "medium" | "low",
  }));
}
