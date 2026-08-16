import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Compass, Info, Loader2, Sparkles, TrendingUp, X } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { PanelSubnav, VISIBILITY_SUBNAV } from "@/components/app/panel-subnav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { addDiscoveredPrompts, discoverPromptCandidates, type DiscoveredPrompt } from "@/lib/panel.functions";
import { useActiveBrand } from "@/lib/use-panel";

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
  if (score >= 70) return "text-success border-success/40";
  if (score >= 40) return "text-warning border-warning/40";
  return "text-muted-foreground border-border";
}

function PromptDiscoveryPage() {
  const { brand } = useActiveBrand();
  const queryClient = useQueryClient();
  const discover = useServerFn(discoverPromptCandidates);
  const addPrompts = useServerFn(addDiscoveredPrompts);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const { data = [], isFetching, refetch } = useQuery({
    queryKey: ["prompt-discovery", brand?.id],
    queryFn: () => discover({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
    staleTime: 10 * 60_000,
  });

  const add = useMutation({
    mutationFn: (item: DiscoveredPrompt) =>
      addPrompts({ data: { brandId: brand!.id, items: [{ text: item.text, cluster: item.cluster, intent: item.intent }] } }),
    onSuccess: (_result, item) => {
      setDismissed((prev) => [...prev, item.text]);
      toast.success("Prompt izlemeye alındı");
      void queryClient.invalidateQueries({ queryKey: ["prompts", brand?.id] });
      void queryClient.invalidateQueries({ queryKey: ["brand-overview", brand?.id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!brand) {
    return (
      <>
        <PanelSubnav items={VISIBILITY_SUBNAV} />
        <PanelPageHeading meta={{ title: "Prompt Keşfi", description: "Önce bir marka ekleyin.", icon: Compass }} />
        <Card><CardContent className="py-10 text-center"><Button asChild><Link to="/app/onboarding">Markanı ekle</Link></Button></CardContent></Card>
      </>
    );
  }

  const visible = data.filter((item) => !dismissed.includes(item.text));

  return (
    <>
      <PanelSubnav items={VISIBILITY_SUBNAV} />
      <PanelPageHeading
        meta={{
          title: "Prompt Keşfi",
          description: "Marka adı hiç geçmeyen ama bir AI asistanının markanızı önerebileceği fırsat sorularını keşfedin.",
          icon: Compass,
        }}
        action={
          <Button size="sm" onClick={() => { setDismissed([]); void refetch(); }} disabled={isFetching}>
            {isFetching ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-2 h-3.5 w-3.5" />} Aday üret
          </Button>
        }
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
        {isFetching && visible.length === 0 ? (
          <Card><CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Fırsat soruları hazırlanıyor…</CardContent></Card>
        ) : null}
        {!isFetching && visible.length === 0 ? (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">Henüz aday yok — “Aday üret” ile marka zekânızdan yeni fırsat soruları çıkarın.</CardContent></Card>
        ) : null}
        {visible.map((c) => (
          <Card key={c.text}>
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium leading-snug">{c.text}</p>
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
                <Badge variant="outline" className="text-[10px]">Niyet: {c.intent}</Badge>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setDismissed((prev) => [...prev, c.text])}>
                  <X className="mr-1.5 h-3.5 w-3.5" /> Reddet
                </Button>
                <Button variant="default" size="sm" disabled={add.isPending} onClick={() => add.mutate(c)}>
                  <Check className="mr-1.5 h-3.5 w-3.5" /> Promptlara ekle
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
