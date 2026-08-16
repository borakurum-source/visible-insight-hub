export type PlanSlug = "free" | "starter" | "growth" | "agency";

export interface PlanLimits {
  slug: PlanSlug;
  label: string;
  maxBrands: number; // 0 = sınırsız
  maxPrompts: number; // onaylı prompt sayısı, 0 = sınırsız
  maxCompetitors: number;
  monthlyContent: number;
}

export const PLAN_LIMITS: Record<PlanSlug, PlanLimits> = {
  free: { slug: "free", label: "Ücretsiz", maxBrands: 1, maxPrompts: 5, maxCompetitors: 1, monthlyContent: 0 },
  starter: { slug: "starter", label: "Başlangıç", maxBrands: 1, maxPrompts: 15, maxCompetitors: 2, monthlyContent: 3 },
  growth: { slug: "growth", label: "Büyüme", maxBrands: 3, maxPrompts: 45, maxCompetitors: 5, monthlyContent: 10 },
  agency: { slug: "agency", label: "Ajans", maxBrands: 0, maxPrompts: 0, maxCompetitors: 0, monthlyContent: 0 },
};

export function planLimits(plan?: string | null): PlanLimits {
  return PLAN_LIMITS[(plan as PlanSlug) ?? "free"] ?? PLAN_LIMITS.free;
}

export function isUnlimited(value: number) {
  return value === 0;
}

export function remainingLabel(used: number, max: number) {
  return isUnlimited(max) ? `${used} / sınırsız` : `${used} / ${max}`;
}
