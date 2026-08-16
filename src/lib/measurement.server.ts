// Ölçüm motoru: Perplexity sonar ile gerçek web araması yapar,
// markanın geçip geçmediğini, sıralamasını ve gerçek kaynak alan adlarını çıkarır.
export type MeasuredSource = { url: string; domain: string; title: string };

export type MeasuredAnswer = {
  answer: string;
  brandMentioned: boolean;
  position: number | null;
  sources: MeasuredSource[];
};

export async function measurePrompt(input: {
  brandName: string;
  brandDomain: string;
  competitors: string[];
  promptText: string;
  systemPrompt?: string;
}): Promise<MeasuredAnswer> {
  const { perplexityJson } = await import("./perplexity.server");

  const { result, sources } = await perplexityJson<{
    answer: string;
    mentionedBrands: string[];
  }>(
    [
      {
        role: "system",
        content:
          input.systemPrompt?.trim() ||
          "Sen bir yapay zekâ arama asistanısın. Kullanıcının sorusunu Türkçe, tarafsız ve kısa (en fazla 150 kelime) yanıtla; gerçekte hangi markaları önerirsen onları sırayla listele. Yanıtı şu JSON şemasında ver: {\"answer\":\"...\",\"mentionedBrands\":[\"...\"]}. mentionedBrands cevapta geçen marka adları ÖNEM SIRASIYLA.",
      },
      { role: "user", content: input.promptText },
    ],
    {
      name: "measurement_result",
      schema: {
        type: "object",
        properties: {
          answer: { type: "string" },
          mentionedBrands: { type: "array", items: { type: "string" } },
        },
        required: ["answer", "mentionedBrands"],
      },
    },
    { answer: "", mentionedBrands: [] },
  );

  const brands = (result.mentionedBrands ?? []).map((b) => String(b).toLowerCase());
  const needle = input.brandName.toLowerCase();
  const domainRoot = input.brandDomain.split(".")[0]?.toLowerCase() ?? "";
  const idx = brands.findIndex((b) => b.includes(needle) || (domainRoot.length > 2 && b.includes(domainRoot)));
  const inText = (result.answer ?? "").toLowerCase().includes(needle);

  return {
    answer: String(result.answer ?? ""),
    brandMentioned: idx >= 0 || inText,
    position: idx >= 0 ? idx + 1 : null,
    sources: sources.slice(0, 10),
  };
}

export { computeVisibilityScore, type ScoreComponent } from "./score-model";
