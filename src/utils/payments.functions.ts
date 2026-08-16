import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type PaddleEnv = "sandbox" | "live";

// Insan tarafindan okunabilir fiyat kimligini saglayicinin ic kimligine cevirir.
export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .inputValidator((data: { priceId: string; environment: PaddleEnv }) => data)
  .handler(async ({ data }) => {
    const { gatewayFetch } = await import("@/lib/paddle.server");
    const response = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    if (!response.ok) {
      throw new Error(`Fiyat alinamadi [${response.status}]: ${await response.text()}`);
    }
    const result = (await response.json()) as { data?: Array<{ id: string }> };
    if (!result.data?.length) throw new Error("Fiyat bulunamadi");
    return result.data[0]!.id;
  });

export type SubscriptionRow = {
  paddle_subscription_id: string;
  product_id: string;
  price_id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

// Oturum acmis kullanicinin gecerli ortamdaki en guncel aboneligi.
export const getMySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => data)
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("subscriptions")
      .select("paddle_subscription_id, product_id, price_id, status, current_period_end, cancel_at_period_end")
      .eq("user_id", context.userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: profile } = await context.supabase
      .from("profiles").select("plan").eq("id", context.userId).maybeSingle();
    return { subscription: (row ?? null) as SubscriptionRow | null, plan: profile?.plan ?? "free" };
  });

// Musteri portali (odeme yontemi, fatura, iptal) icin gecici baglanti uretir.
export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => data)
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("subscriptions")
      .select("paddle_subscription_id, paddle_customer_id")
      .eq("user_id", context.userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!row) throw new Error("Aktif aboneliginiz bulunamadi");
    const { getPaddleClient } = await import("@/lib/paddle.server");
    const paddle = getPaddleClient(data.environment);
    const session = await paddle.customerPortalSessions.create(row.paddle_customer_id, [
      row.paddle_subscription_id,
    ]);
    return { url: session.urls.general.overview };
  });
