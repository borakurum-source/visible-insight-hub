import { competitorMatches, type CompetitorEntry } from "./competitors";

export type CompetitorRunRow = { created_at: string; brand_mentioned: boolean; raw_answer: string | null };

export type CompetitorTrendPoint = { date: string } & Record<string, number | string>;

export type CompetitorTrendResult = {
  points: CompetitorTrendPoint[];
  series: Array<{ key: string; name: string; isOwn: boolean; current: number; change: number; mentions: number }>;
  totalRuns: number;
};

/** Buckets prompt runs into weekly (or daily for short ranges) visibility rates per brand + competitors. */
export function buildCompetitorTrend(
  rows: CompetitorRunRow[],
  ownName: string,
  competitors: CompetitorEntry[],
  days: number,
): CompetitorTrendResult {
  const brands = [
    { key: "own", name: ownName || "Markanız", isOwn: true, match: { name: ownName, domain: "", type: "direct" as const } },
    ...competitors.slice(0, 6).map((entry, index) => ({ key: `c${index}`, name: entry.name, isOwn: false, match: entry })),
  ];

  const bucketDays = days <= 14 ? 1 : days <= 45 ? 7 : 14;
  const now = Date.now();
  const start = now - days * 86400000;
  const buckets = new Map<string, { total: number; hits: Map<string, number> }>();

  const bucketCount = Math.max(1, Math.ceil(days / bucketDays));
  for (let i = bucketCount - 1; i >= 0; i -= 1) {
    const stamp = new Date(now - i * bucketDays * 86400000).toISOString().slice(0, 10);
    buckets.set(stamp, { total: 0, hits: new Map() });
  }
  const keys = [...buckets.keys()];

  for (const row of rows) {
    const time = new Date(row.created_at).getTime();
    if (Number.isNaN(time) || time < start) continue;
    const index = Math.min(keys.length - 1, Math.floor((time - start) / (bucketDays * 86400000)));
    const bucket = buckets.get(keys[index]!)!;
    bucket.total += 1;
    for (const brand of brands) {
      const hit = brand.isOwn
        ? row.brand_mentioned
        : competitorMatches(brand.match, { answer: row.raw_answer ?? "" });
      if (hit) bucket.hits.set(brand.key, (bucket.hits.get(brand.key) ?? 0) + 1);
    }
  }

  const points: CompetitorTrendPoint[] = keys.map((date) => {
    const bucket = buckets.get(date)!;
    const point: CompetitorTrendPoint = { date };
    for (const brand of brands) {
      point[brand.key] = bucket.total ? Math.round(((bucket.hits.get(brand.key) ?? 0) / bucket.total) * 100) : 0;
    }
    return point;
  });

  const nonEmpty = points.filter((p) => keys.length > 0);
  const series = brands
    .map((brand) => {
      const values = nonEmpty.map((p) => Number(p[brand.key] ?? 0));
      const current = values.length ? values[values.length - 1]! : 0;
      const first = values.find((v) => v > 0) ?? 0;
      const totalMentions = rows.filter((row) =>
        brand.isOwn ? row.brand_mentioned : competitorMatches(brand.match, { answer: row.raw_answer ?? "" }),
      ).length;
      return { key: brand.key, name: brand.name, isOwn: brand.isOwn, current, change: current - first, mentions: totalMentions };
    })
    .sort((a, b) => (a.isOwn ? -1 : b.isOwn ? 1 : b.mentions - a.mentions));

  return { points, series, totalRuns: rows.length };
}
