import { createFileRoute } from "@tanstack/react-router";
import { Check, CreditCard } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { PanelSubnav, WORKSPACE_SUBNAV } from "@/components/app/panel-subnav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockPlans } from "@/lib/panel-mock/pricing";

export const Route = createFileRoute("/_authenticated/app/pricing")({
  head: () => ({
    meta: [
      { title: "Fiyatlandırma — OneCite Paneli" },
      { name: "description", content: "Marka, prompt ve rakip limitlerine göre planlarınızı karşılaştırın ve yükseltin." },
      { property: "og:title", content: "Fiyatlandırma — OneCite Paneli" },
      { property: "og:description", content: "Panel içi plan karşılaştırma ve yükseltme ekranı." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <>
      <PanelSubnav items={WORKSPACE_SUBNAV} />
      <PanelPageHeading meta={{ title: "Fiyatlandırma", description: "İhtiyacınıza uygun planı seçin veya mevcut planınızı yükseltin.", icon: CreditCard }} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {mockPlans.map((plan) => (
          <Card key={plan.id} className={plan.highlight ? "border-primary shadow-sm" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{plan.name}</CardTitle>
                {plan.highlight && <Badge>Popüler</Badge>}
              </div>
              <p className="text-2xl font-semibold">{plan.price}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {plan.contactOnly ? (
                  <>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-chart-2" /> Özel marka ve prompt limiti</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-chart-2" /> White-label rapor ve çoklu çalışma alanı</li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-chart-2" /> {plan.clients} marka</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-chart-2" /> Marka başına {plan.prompts} prompt</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-chart-2" /> {plan.competitors} rakip takibi</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-chart-2" /> {plan.content > 0 ? `Ayda ${plan.content} AI atıf içeriği` : "İçerik üretimi yok"}</li>
                  </>
                )}
              </ul>
              {plan.contactOnly ? (
                <Button asChild className="w-full" variant="outline">
                  <a href="mailto:hello@1cite.com?subject=Ajans%20plan%C4%B1%20teklif%20talebi">İletişime geç</a>
                </Button>
              ) : (
                <Button className="w-full" variant={plan.highlight ? "default" : "outline"}>Planı seç</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="pt-4 text-center text-xs text-muted-foreground">
        Ödemeler güvenli bir ödeme altyapısı üzerinden işlenir. Faturalarınızı hesap menüsünden yönetebilirsiniz.
      </p>
    </>
  );
}
