import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhook, EventName, type PaddleEnv } from "@/lib/paddle.server";
import { planForProduct } from "@/lib/plan-mapping";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: any = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<any, any, any>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    );
  }
  return _supabase;
}

async function setPlan(userId: string, plan: string) {
  await getSupabase().from("profiles").update({ plan }).eq("id", userId);
}

async function userIdForSubscription(subscriptionId: string): Promise<string | null> {
  const { data } = await getSupabase()
    .from("subscriptions")
    .select("user_id")
    .eq("paddle_subscription_id", subscriptionId)
    .maybeSingle();
  return (data?.["user_id"] as string | undefined) ?? null;
}

async function sendWelcome(userId: string, planLabel: string) {
  try {
    const { data } = await getSupabase().from("profiles").select("email, full_name").eq("id", userId).maybeSingle();
    const email = data?.["email"] as string | undefined;
    if (!email) return;
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    await sendTemplateEmail("subscription-welcome", email, {
      templateData: { name: (data?.["full_name"] as string | undefined) ?? "", planLabel },
      idempotencyKey: `welcome-${userId}-${planLabel}`,
    });
  } catch (e) {
    console.error("Welcome email failed", e);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const userId = data.customData?.userId as string | undefined;
  if (!userId) {
    console.error("No userId in customData");
    return;
  }
  const item = data.items?.[0];
  const priceId = item?.price?.importMeta?.externalId;
  const productId = item?.product?.importMeta?.externalId;
  if (!priceId || !productId) {
    console.warn("Skipping subscription: missing importMeta.externalId");
    return;
  }

  await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      paddle_subscription_id: data.id,
      paddle_customer_id: data.customerId,
      product_id: productId,
      price_id: priceId,
      status: data.status,
      current_period_start: data.currentBillingPeriod?.startsAt ?? null,
      current_period_end: data.currentBillingPeriod?.endsAt ?? null,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "paddle_subscription_id" },
  );

  const plan = planForProduct(productId);
  if (["active", "trialing"].includes(data.status)) {
    await setPlan(userId, plan);
    await sendWelcome(userId, plan === "growth" ? "Büyüme" : "Başlangıç");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const item = data.items?.[0];
  const priceId = item?.price?.importMeta?.externalId;
  const productId = item?.product?.importMeta?.externalId;

  const update: Record<string, unknown> = {
    status: data.status,
    current_period_start: data.currentBillingPeriod?.startsAt ?? null,
    current_period_end: data.currentBillingPeriod?.endsAt ?? null,
    cancel_at_period_end: data.scheduledChange?.action === "cancel",
    updated_at: new Date().toISOString(),
  };
  if (priceId) update["price_id"] = priceId;
  if (productId) update["product_id"] = productId;

  await getSupabase()
    .from("subscriptions")
    .update(update)
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env);

  const userId = (data.customData?.userId as string | undefined) ?? (await userIdForSubscription(data.id));
  if (!userId) return;

  if (["active", "trialing"].includes(data.status)) {
    // Yukseltme/dusurme aninda yeni plan gecerli olur.
    await setPlan(userId, planForProduct(productId));
  } else if (data.status === "past_due" || data.status === "paused") {
    // Odeme alinamadi: ucretli ozellikler hemen kisitlanir.
    await setPlan(userId, "free");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env);
  // Plan dusurulmez: odenen donem sonuna kadar erisim devam eder.
  // Donem bitince zamanlanmis is (expire-plans) planı Ucretsiz'e ceker.
}

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.eventType) {
    case EventName.SubscriptionCreated:
      await handleSubscriptionCreated(event.data, env);
      break;
    case EventName.SubscriptionUpdated:
      await handleSubscriptionUpdated(event.data, env);
      break;
    case EventName.SubscriptionCanceled:
      await handleSubscriptionCanceled(event.data, env);
      break;
    default:
      console.log("Unhandled event:", event.eventType);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") || "sandbox") as PaddleEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
