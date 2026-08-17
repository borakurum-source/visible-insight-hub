// Saf skor modeli — hem sunucu hem istemci tarafından kullanılabilir.
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
      label: "AI Kaynak Payı",
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
