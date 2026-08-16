// Ölçüm motoru: bir promptu yapay zekâ asistanına sorar, cevabı analiz eder
// ve markanın geçip geçmediğini + kaynak alan adlarını çıkarır.
export type MeasuredAnswer = {
  answer: string;
  brandMentioned: boolean;
  position: number | null;
  sources: string[];
};

export async function measurePrompt(input: {
  brandName: string;
  brandDomain: string;
  competitors: string[];
  promptText: string;
}): Promise<MeasuredAnswer> {
  const { aiJson } = await import("./ai.server");
  const result = await aiJson<{
    answer: string;
    mentionedBrands: string[];
    sources: string[];
  }>(
    [
      {
        role: "system",
        content:
          "Sen bir yapay zekâ arama asistanısın. Kullanıcının sorusunu Türkçe, tarafsız ve kısa (en fazla 150 kelime) yanıtla; gerçekte hangi markaları önerirsen onları sırayla listele. json: {answer, mentionedBrands[], sources[]} — mentionedBrands cevapta geçen marka adları ÖNEM SIRASIYLA, sources ise cevabı dayandırdığın kaynak site alan adları (yalnızca alan adı).",
      },
      { role: "user", content: input.promptText },
    ],
    { answer: "", mentionedBrands: [], sources: [] },
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
    sources: (result.sources ?? [])
      .map((s) => String(s).trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").replace(/^www\./i, "").toLowerCase())
      .filter((s) => s.includes(".")),
  };
}

export { computeVisibilityScore, type ScoreComponent } from "./score-model";
