import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { PanelSubnav, WORKSPACE_SUBNAV } from "@/components/app/panel-subnav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { pricingPlans, formatUsd } from "@/lib/pricingData";
import { PLAN_PRICE_IDS } from "@/lib/plan-mapping";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { getPaddleEnvironment } from "@/lib/paddle";
import { getMySubscription, createPortalSession } from "@/utils/payments.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app/pricing")({
  head: () => ({
    meta: [
      { title: "Plan ve Faturalandırma — OneCite Paneli" },
      { name: "description", content: "Planınızı karşılaştırın, yükseltin ve faturalarınızı yönetin." },
      { property: "og:title", content: "Plan ve Faturalandırma — OneCite Paneli" },
      { property: "og:description", content: "Panel içi plan yükseltme ve abonelik yönetimi." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PricingPage,
});

const PLAN_LABELS: Record<string, string> = {
  trial: "Deneme (7 gün)", expired: "Deneme bitti", starter: "Başlangıç", growth: "Büyüme", agency: "Ajans",
};

function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const env = getPaddleEnvironment();
  const fetchSub = useServerFn(getMySubscription);
  const portal = useServerFn(createPortalSession);
  const { openCheckout, loading } = usePaddleCheckout();
  const [pending, setPending] = useState<string | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ["my-subscription", env],
    queryFn: () => fetchSub({ data: { environment: env } }),
  });

  const currentPlan = normalizePlan(data?.plan);
  const sub = data?.subscription ?? null;

  // Odeme sonrasi Paddle webhook'u birkac saniye gecikebilir: plan degisene kadar
  // kisa araliklarla tazeleyip kota bagimli ekranlari (rakip, prompt) guncelleriz.
  const queryClient = useQueryClient();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "success") return;
    let attempts = 0;
    let cancelled = false;
    const tick = async () => {
      attempts += 1;
      const result = await refetch();
      await queryClient.invalidateQueries({ queryKey: ["competitors"] });
      await queryClient.invalidateQueries({ queryKey: ["plan-usage"] });
      if (cancelled) return;
      if (result.data?.plan && result.data.plan !== "trial") {
        toast.success("Planınız güncellendi. Yeni limitleriniz aktif.");
        window.history.replaceState({}, "", "/app/pricing");
        return;
      }
      if (attempts < 10) setTimeout(tick, 3000);
    };
    void tick();
    return () => { cancelled = true; };
  }, [queryClient, refetch]);

  async function handleSelect(planSlug: string) {
    const priceIds = PLAN_PRICE_IDS[planSlug];
    if (!priceIds) return;
    setPending(planSlug);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Oturum bulunamadı");
      await openCheckout({
        priceId: annual ? priceIds.yearly : priceIds.monthly,
        customerEmail: user.email ?? undefined,
        customData: { userId: user.id },
        successUrl: `${window.location.origin}/app/pricing?checkout=success`,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ödeme ekranı açılamadı");
    } finally {
      setPending(null);
    }
  }

  async function handlePortal() {
    try {
      const res = await portal({ data: { environment: env } });
      window.open(res.url, "_blank");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Portal açılamadı");
    }
  }

  return (
    <>
      <PanelSubnav items={WORKSPACE_SUBNAV} />
      <PanelPageHeading meta={{ title: "Plan ve faturalandırma", description: "İhtiyacınıza uygun planı seçin, aboneliğinizi yönetin.", icon: CreditCard }} />

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Mevcut planınız</p>
            <p className="text-lg font-semibold">{PLAN_LABELS[currentPlan] ?? currentPlan}</p>
            {sub?.cancel_at_period_end && sub.current_period_end && (
              <p className="mt-1 text-xs text-amber-600">
                Abonelik iptal edildi — {new Date(sub.current_period_end).toLocaleDateString("tr-TR")} tarihine kadar erişiminiz devam eder.
              </p>
            )}
            {sub?.status === "past_due" && (
              <p className="mt-1 text-xs text-destructive">Ödeme alınamadı, ücretli özellikler kısıtlandı. Ödeme yönteminizi güncelleyin.</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-full border border-border p-1">
              <button type="button" onClick={() => setAnnual(false)} className={`rounded-full px-3 py-1 text-xs font-semibold ${annual ? "text-muted-foreground" : "bg-primary text-primary-foreground"}`}>Aylık</button>
              <button type="button" onClick={() => setAnnual(true)} className={`rounded-full px-3 py-1 text-xs font-semibold ${annual ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Yıllık · 2 ay bedava</button>
            </div>
            {sub && (
              <Button variant="outline" size="sm" onClick={handlePortal}>
                Faturalar ve ödeme yöntemi <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => refetch()}>Yenile</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {pricingPlans.map((plan) => {
          const slug = plan.slug;
          const isCurrent = slug === currentPlan;
          const price = plan.contactOnly
            ? "Teklife göre"
            : annual
              ? formatUsd(plan.annualTotal ?? 0)
              : formatUsd(plan.monthly ?? 0);
          return (
            <Card key={plan.slug} className={plan.highlight ? "border-primary shadow-sm" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{plan.label}</CardTitle>
                  {isCurrent ? <Badge variant="secondary">Mevcut plan</Badge> : plan.highlight ? <Badge>Popüler</Badge> : null}
                </div>
                <p className="text-2xl font-semibold">
                  {price}
                  {!plan.contactOnly && plan.monthly !== 0 && (
                    <span className="text-sm font-normal text-muted-foreground">{annual ? " /yıl" : " /ay"}</span>
                  )}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {[...plan.limits, ...plan.features].slice(0, 6).map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-chart-2" /> {item}
                    </li>
                  ))}
                </ul>
                {plan.contactOnly ? (
                  <Button asChild className="w-full" variant="outline">
                    <a href="mailto:hello@1cite.com?subject=Ajans%20plan%C4%B1%20teklif%20talebi">İletişime geç</a>
                  </Button>
                ) : slug === "trial" ? (
                  <Button className="w-full" variant="outline" disabled>
                    {isCurrent ? "Kullanımda" : "Ücretsiz plan"}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.highlight ? "default" : "outline"}
                    disabled={isCurrent || loading}
                    onClick={() => handleSelect(slug)}
                  >
                    {pending === slug && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isCurrent ? "Mevcut plan" : currentPlan === "growth" ? "Bu plana geç" : "Planı seç"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="pt-4 text-center text-xs text-muted-foreground">
        Ödemeler güvenli ödeme altyapısı üzerinden işlenir. Plan değişiklikleri anında geçerli olur; iptalde ödenen dönem sonuna kadar erişiminiz sürer.
      </p>
    </>
  );
}
