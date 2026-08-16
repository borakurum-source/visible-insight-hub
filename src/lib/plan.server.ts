import { planLimits, isUnlimited, type PlanLimits } from "./plan-limits";

type Sb = { from: (t: string) => any };

export async function getUserPlan(supabase: Sb, userId: string): Promise<PlanLimits> {
  const { data } = await supabase.from("profiles").select("plan").eq("id", userId).maybeSingle();
  return planLimits(data?.plan);
}

export async function countApprovedPrompts(supabase: Sb, brandId: string) {
  const { count } = await supabase
    .from("prompts")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", brandId)
    .eq("status", "approved");
  return count ?? 0;
}

export async function assertPromptQuota(
  supabase: Sb,
  userId: string,
  brandId: string,
  adding: number,
) {
  const limits = await getUserPlan(supabase, userId);
  if (isUnlimited(limits.maxPrompts)) return { limits, used: 0, remaining: Infinity };
  const used = await countApprovedPrompts(supabase, brandId);
  const remaining = limits.maxPrompts - used;
  if (adding > remaining) {
    throw new Error(
      `${limits.label} planınızda marka başına ${limits.maxPrompts} prompt izleyebilirsiniz. ` +
        `Şu an ${used} onaylı prompt var, ${Math.max(0, remaining)} hakkınız kaldı. ` +
        `Daha fazlası için planınızı yükseltin.`,
    );
  }
  return { limits, used, remaining };
}

export async function assertBrandQuota(supabase: Sb, userId: string) {
  const limits = await getUserPlan(supabase, userId);
  if (isUnlimited(limits.maxBrands)) return limits;
  const { count } = await supabase
    .from("brands")
    .select("id", { count: "exact", head: true })
    .eq("created_by", userId);
  if ((count ?? 0) >= limits.maxBrands) {
    throw new Error(
      `${limits.label} planınızda ${limits.maxBrands} marka ekleyebilirsiniz. Daha fazlası için planınızı yükseltin.`,
    );
  }
  return limits;
}

// Takip edilebilecek rakip sayısı plana bağlı.
export async function assertCompetitorQuota(supabase: Sb, userId: string, total: number) {
  const limits = await getUserPlan(supabase, userId);
  if (isUnlimited(limits.maxCompetitors)) return limits;
  if (total > limits.maxCompetitors) {
    throw new Error(
      `${limits.label} planınızda ${limits.maxCompetitors} rakip takip edebilirsiniz. Daha fazlası için planınızı yükseltin.`,
    );
  }
  return limits;
}

// Plan düşünce fazla markalar silinmez: yalnızca en eski N marka aktif kalır,
// fazlası salt okunur olur (ölçüm/üretim çalıştırılamaz).
export async function activeBrandIds(supabase: Sb, userId: string): Promise<string[] | null> {
  const limits = await getUserPlan(supabase, userId);
  if (isUnlimited(limits.maxBrands)) return null;
  const { data } = await supabase
    .from("brand_members")
    .select("brand_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  return (data ?? []).slice(0, limits.maxBrands).map((m: { brand_id: string }) => m.brand_id);
}

export async function assertBrandActive(supabase: Sb, userId: string, brandId: string) {
  const allowed = await activeBrandIds(supabase, userId);
  if (!allowed || allowed.includes(brandId)) return;
  const limits = await getUserPlan(supabase, userId);
  throw new Error(
    `${limits.label} planınızda aynı anda ${limits.maxBrands} marka aktif olabilir. ` +
      `Bu marka salt okunur durumda; verileriniz korunuyor. Devam etmek için planınızı yükseltin.`,
  );
}
