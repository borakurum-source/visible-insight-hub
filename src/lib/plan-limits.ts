export type PlanSlug = "free" | "starter" | "growth" | "agency";

export interface PlanLimits {
  slug: PlanSlug;
  label: string;
  maxBrands: number; // 0 = sınırsız
  maxPrompts: number; // onaylı prompt sayısı, 0 = sınırsız
  maxCompetitors: number;
  monthlyContent: number;
  /** Ay içinde ölçülebilecek toplam yapay zeka yanıtı (prompt x ölçüm sıklığı). 0 = sınırsız */
  monthlyAnswers: number;
  /** Ölçüm sıklığı etiketi (pazarlama ve panel için). */
  cadence: string;
  seats: number; // 0 = sınırsız
}

export const PLAN_LIMITS: Record<PlanSlug, PlanLimits> = {
  free: { slug: "free", label: "Ücretsiz", maxBrands: 1, maxPrompts: 5, maxCompetitors: 1, monthlyContent: 0, monthlyAnswers: 20, cadence: "Aylık ölçüm", seats: 1 },
  starter: { slug: "starter", label: "Başlangıç", maxBrands: 1, maxPrompts: 20, maxCompetitors: 3, monthlyContent: 5, monthlyAnswers: 80, cadence: "Haftalık ölçüm", seats: 2 },
  growth: { slug: "growth", label: "Büyüme", maxBrands: 3, maxPrompts: 60, maxCompetitors: 10, monthlyContent: 20, monthlyAnswers: 240, cadence: "Haftalık ölçüm", seats: 5 },
  agency: { slug: "agency", label: "Ajans", maxBrands: 0, maxPrompts: 0, maxCompetitors: 0, monthlyContent: 0, monthlyAnswers: 0, cadence: "Günlük ölçüme kadar", seats: 0 },
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
