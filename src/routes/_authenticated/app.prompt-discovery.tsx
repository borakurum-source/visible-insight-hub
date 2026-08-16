import { createFileRoute } from "@tanstack/react-router";
import { Check, Compass, Info, Sparkles, TrendingUp, X } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockPromptDiscovery } from "@/lib/panel-mock/discovery";

export const Route = createFileRoute("/_authenticated/app/prompt-discovery")({
  head: () => ({
    meta: [
      { title: "Prompt Keşfi — OneCite Paneli" },
      { name: "description", content: "Marka adı geçmeyen ama AI asistanlarının markanızı önerebileceği fırsat prompt adaylarını keşfedin." },
      { property: "og:title", content: "Prompt Keşfi — OneCite Paneli" },
      { property: "og:description", content: "GEO reverse-engineering ile fırsat prompt adayları." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PromptDiscoveryPage,
});

function opportunityTone(score: number): string {
  if (score >= 70) return "text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]";
  if (score >= 40) return "text-amber-600 dark:text-amber-400 border-amber-600/30";
  return "text-muted-foreground border-border";
}

function PromptDiscoveryPage() {
  return (
    <>
      <PanelPageHeading
        meta={{
          title: "Prompt Keşfi",
          description: "Marka adı hiç geçmeyen ama bir AI asistanının markanızı önerebileceği fırsat sorularını keşfedin.",
          icon: Compass,
        }}
        action={<Button size="sm"><Sparkles className="mr-2 h-3.5 w-3.5" /> Aday Üret</Button>}
      />

      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-6 md:flex-row">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Compass className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium">Prompt Discovery (GEO Reverse-Engineering)</p>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Mevcut Marka Zekası özetinden yola çıkarak, markanız hiç geçmeyen ama AI asistanlarının
              markanızı önerebileceği soruları üretir. Onayladığınız adaylar Promptlar sayfasına taşınır
              ve izlemeye başlar. Liste Fırsat skoruna göre sıralanır.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {mockPromptDiscovery.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium leading-snug">{c.promptText}</p>
                <Badge variant="secondary" className="shrink-0">{c.cluster}</Badge>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{c.rationale}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className={`gap-1 text-[10px] ${opportunityTone(c.opportunityScore)}`}>
                  <TrendingUp className="h-3 w-3" /> Fırsat {c.opportunityScore}
                </Badge>
                <Badge variant="outline" className="text-[10px]">Tahmini aylık hacim: {c.estMonthlyVolume}</Badge>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm"><X className="mr-1.5 h-3.5 w-3.5" /> Reddet</Button>
                <Button variant="default" size="sm"><Check className="mr-1.5 h-3.5 w-3.5" /> Promptlara Ekle</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
