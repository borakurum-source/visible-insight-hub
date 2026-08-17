import { DEFAULT_PLAN, type PlanSlug } from "./plan-limits";

// Odeme saglayicisindaki urun kimligi -> uygulama plani
export const PRODUCT_TO_PLAN: Record<string, PlanSlug> = {
  starter_plan: "starter",
  growth_plan: "growth",
};

export function planForProduct(productId?: string | null): PlanSlug {
  return (productId && PRODUCT_TO_PLAN[productId]) || DEFAULT_PLAN;
}

export const PLAN_PRICE_IDS: Record<string, { monthly: string; yearly: string }> = {
  starter: { monthly: "starter_monthly", yearly: "starter_yearly" },
  growth: { monthly: "growth_monthly", yearly: "growth_yearly" },
};
