import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockOnboardingSteps } from "@/lib/panel-mock/onboarding";
import { activeBrand } from "@/lib/panel-mock/clients";

export const Route = createFileRoute("/app/onboarding")({
  head: () => ({
    meta: [
      { title: "Kurulum — OneCite Paneli" },
      { name: "description", content: "Marka bilgilerini doğrulayın, ilk promptları oluşturun ve bilgi bankasını besleyin." },
      { property: "og:title", content: "Kurulum — OneCite Paneli" },
      { property: "og:description", content: "Zero-setup marka kurulum akışı." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  return (
    <>
      <PanelPageHeading meta={{ title: "Kurulum", description: `${activeBrand.name} için otomatik kurulum akışını tamamlayın.`, icon: Sparkles }} />

      <div className="space-y-4">
        {mockOnboardingSteps.map((step) => (
          <Card key={step.id} className={step.done ? "" : "opacity-90"}>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              {step.done ? <CheckCircle2 className="h-5 w-5 shrink-0 text-[hsl(var(--chart-2))]" /> : <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />}
              <CardTitle className="text-base">{step.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
