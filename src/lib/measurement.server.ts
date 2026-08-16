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

export type ScoreComponent = {
  key: string;
  label: string;
  weight: number;
  value: number;
  points: number;
  detail: string;
};

export function computeVisibilityScore(input: {
  runs: Array<{ brand_mentioned: boolean; position: number | null }>;
  ownCitations: number;
  totalCitations: number;
  knowledgeSources: number;
  claimsWithEvidence: number;
}): { total: number; components: ScoreComponent[] } {
  const runs = input.runs;
  const mentionRate = runs.length ? runs.filter((r) => r.brand_mentioned).length / runs.length : 0;
  const positions = runs.map((r) => r.position).filter((p): p is number => typeof p === "number" && p > 0);
  const avgPosition = positions.length ? positions.reduce((a, b) => a + b, 0) / positions.length : 0;
  const positionQuality = positions.length ? Math.max(0, Math.min(1, (6 - avgPosition) / 5)) : 0;
  const citationShare = input.totalCitations ? input.ownCitations / input.totalCitations : 0;
  const knowledgeCoverage = Math.min(1, input.knowledgeSources / 10);
  const evidenceStrength = Math.min(1, input.claimsWithEvidence / 8);

  const raw: Array<Omit<ScoreComponent, "points">> = [
    {
      key: "mention",
      label: "Bahsedilme oranı",
      weight: 40,
      value: mentionRate,
      detail: runs.length ? `${runs.length} yanıtın %${Math.round(mentionRate * 100)}'inde markanız geçiyor.` : "Henüz ölçüm yok.",
    },
    {
      key: "citation",
      label: "Alıntı payı",
      weight: 25,
      value: citationShare,
      detail: input.totalCitations
        ? `${input.totalCitations} kaynağın ${input.ownCitations} tanesi sizin sitenizden.`
        : "Cevaplarda henüz kaynak tespit edilmedi.",
    },
    {
      key: "position",
      label: "Sıralama kalitesi",
      weight: 15,
      value: positionQuality,
      detail: positions.length ? `Ortalama listelenme sıranız ${avgPosition.toFixed(1)}.` : "Markanız henüz listelerde sıralanmadı.",
    },
    {
      key: "knowledge",
      label: "Kanıt kapsamı",
      weight: 10,
      value: knowledgeCoverage,
      detail: `${input.knowledgeSources} bilgi kaynağı (hedef: 10).`,
    },
    {
      key: "claims",
      label: "İddia kanıtı",
      weight: 10,
      value: evidenceStrength,
      detail: `${input.claimsWithEvidence} iddia kanıt bağlantılı (hedef: 8).`,
    },
  ];

  const components = raw.map((c) => ({ ...c, points: Math.round(c.value * c.weight * 10) / 10 }));
  const total = Math.round(components.reduce((sum, c) => sum + c.points, 0));
  return { total, components };
}
