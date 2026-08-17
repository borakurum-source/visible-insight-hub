/**
 * Ücretsiz plan kaldırıldı. Yeni kullanıcılar 7 günlük deneme ("trial") ile başlar;
 * deneme Başlangıç planının limitlerini birebir yansıtır. Deneme bitince veya ödeme
 * başarısız olduğunda hesap "expired" tierine düşer (yalnızca okuma).
 * Eski kayıtlardaki "free" değeri geriye dönük uyumluluk için trial'a eşlenir.
 */
export type PlanSlug = "trial" | "expired" | "starter" | "growth" | "agency";

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

export const TRIAL_DAYS = 7;

export const PLAN_LIMITS: Record<PlanSlug, PlanLimits> = {
  trial: { slug: "trial", label: "Deneme (7 gün)", maxBrands: 1, maxPrompts: 20, maxCompetitors: 3, monthlyContent: 5, monthlyAnswers: 80, cadence: "Haftalık ölçüm", seats: 2 },
  expired: { slug: "expired", label: "Deneme bitti", maxBrands: 1, maxPrompts: 0, maxCompetitors: 0, monthlyContent: 0, monthlyAnswers: 0, cadence: "Ölçüm duraklatıldı", seats: 1 },
  starter: { slug: "starter", label: "Başlangıç", maxBrands: 1, maxPrompts: 20, maxCompetitors: 3, monthlyContent: 5, monthlyAnswers: 80, cadence: "Haftalık ölçüm", seats: 2 },
  growth: { slug: "growth", label: "Büyüme", maxBrands: 3, maxPrompts: 60, maxCompetitors: 10, monthlyContent: 20, monthlyAnswers: 240, cadence: "Haftalık ölçüm", seats: 5 },
  agency: { slug: "agency", label: "Ajans", maxBrands: 0, maxPrompts: 0, maxCompetitors: 0, monthlyContent: 0, monthlyAnswers: 0, cadence: "Günlük ölçüme kadar", seats: 0 },
};

/** Eski "free"/"free_user" değerlerini deneme planına eşler. */
export function normalizePlan(plan?: string | null): PlanSlug {
  if (!plan || plan === "free" || plan === "free_user") return "trial";
  return (plan in PLAN_LIMITS ? plan : "trial") as PlanSlug;
}

export const DEFAULT_PLAN: PlanSlug = "trial";

export function planLimits(plan?: string | null): PlanLimits {
  return PLAN_LIMITS[normalizePlan(plan)];
}

export function isPaidPlan(plan?: string | null) {
  const slug = normalizePlan(plan);
  return slug === "starter" || slug === "growth" || slug === "agency";
}

export function isUnlimited(value: number) {
  return value === 0;
}

export function remainingLabel(used: number, max: number) {
  return isUnlimited(max) ? `${used} / sınırsız` : `${used} / ${max}`;
}
