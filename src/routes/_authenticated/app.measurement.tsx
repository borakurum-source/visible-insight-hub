import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, Play, Gauge, ListChecks, ExternalLink, Quote } from "lucide-react";
import { toast } from "sonner";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { PanelSubnav, VISIBILITY_SUBNAV } from "@/components/app/panel-subnav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { QuerySkeleton } from "@/components/app/panel-query-states";
import { ScoreBreakdown } from "@/components/app/score-breakdown";
import { getMeasurementState, listRunCitations, listMeasurementRounds } from "@/lib/panel.functions";
import { useMeasurementRun } from "@/lib/use-measurement-run";
import { toPlainText } from "@/lib/plain-text";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/measurement")({
  validateSearch: (search: Record<string, unknown>): { autostart?: boolean } =>
    search["autostart"] === true || search["autostart"] === "1" ? { autostart: true } : {},
  head: () => ({
    meta: [
      { title: "Ölçüm — OneCite Paneli" },
      { name: "description", content: "Onaylı promptlarınızı yapay zeka asistanlarında çalıştırın ve görünürlük skorunuzu kırılımıyla görün." },
      { property: "og:title", content: "Ölçüm — OneCite Paneli" },
      { property: "og:description", content: "AI görünürlük ölçüm turu ve skor kırılımı." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MeasurementPage,
});

function MeasurementPage() {
  const { brand } = useActiveBrand();
  const { autostart } = Route.useSearch();
  const navigate = useNavigate();
  const fetchState = useServerFn(getMeasurementState);
  const { run, progress, running } = useMeasurementRun(brand?.id);

  const { data, isLoading } = useQuery({
    queryKey: ["measurement-state", brand?.id],
    queryFn: () => fetchState({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
  });
  const fetchRuns = useServerFn(listRunCitations);
  const { data: runs } = useQuery({
    queryKey: ["run-citations", brand?.id, running],
    queryFn: () => fetchRuns({ data: { brandId: brand!.id, limit: 30 } }),
    enabled: Boolean(brand?.id) && !running,
  });

  // Kurulum bitiminde /app/measurement?autostart=1 ile gelindiğinde ilk ölçümü kendiliğinden başlat.
  const autostarted = useRef(false);
  useEffect(() => {
    if (!autostart || autostarted.current) return;
    if (!brand?.id || isLoading) return;
    autostarted.current = true;
    navigate({ to: "/app/measurement", search: () => ({}), replace: true });
    if ((data?.approvedPrompts ?? 0) > 0) {
      toast.info("Kurulum tamam — ilk ölçümünüz başlıyor.");
      void run();
    }
  }, [autostart, brand?.id, isLoading, data?.approvedPrompts, navigate, run]);

  return (
    <>
      <PanelSubnav items={VISIBILITY_SUBNAV} />
      <PanelPageHeading
        meta={{
          title: "Ölçüm",
          description: "Onaylı promptlarınızı yapay zeka asistanlarında çalıştırıp görünürlüğünüzü puanlıyoruz.",
          icon: Gauge,
        }}
        action={
          <Button size="sm" onClick={() => void run()} disabled={!brand || running || (data?.approvedPrompts ?? 0) === 0}>
            <Play className="mr-2 h-3.5 w-3.5" /> {running ? "Ölçülüyor…" : "Ölçümü başlat"}
          </Button>
        }
      />

      {isLoading ? (
        <QuerySkeleton rows={4} />
      ) : (
        <div className="space-y-6">
          {running ? (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                <Activity className="h-4 w-4 animate-pulse text-primary" aria-hidden="true" />
                <CardTitle className="text-base">Ölçüm sürüyor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={progress ? (progress.done / Math.max(1, progress.total)) * 100 : 0} />
                <p className="text-xs text-muted-foreground">
                  {progress?.done} / {progress?.total} prompt tamamlandı. Sayfayı açık tutun.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {(data?.approvedPrompts ?? 0) === 0 ? (
            <Card>
              <CardContent className="space-y-3 py-10 text-center">
                <p className="text-sm text-muted-foreground">Ölçüm için önce prompt onaylamanız gerekiyor.</p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/app/prompts"><ListChecks className="mr-1.5 h-4 w-4" /> Promptlara git</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ScoreBreakdown
              total={data?.score.total ?? 0}
              components={data?.score.components ?? []}
              runs={data?.totalRuns ?? 0}
              lastRunAt={data?.batch?.finished_at ?? null}
            />
          )}

          {runs && runs.length ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Quote className="h-4 w-4 text-primary" aria-hidden="true" /> Yanıtlar ve kullanılan kaynaklar
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Yapay zeka her soruyu yanıtlarken hangi sayfaları kaynak gösterdi? Kendi sayfanız listede yoksa o soruda kanıt boşluğunuz var.
                </p>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {runs.map((run) => (
                    <AccordionItem key={run.id} value={run.id}>
                      <AccordionTrigger className="gap-3 text-left text-sm">
                        <span className="flex-1">{run.promptText || "Soru"}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          {run.brandMentioned ? (
                            <Badge variant="outline" className="border-success/40 text-success">
                              {run.position ? `${run.position}. sırada` : "Geçti"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Geçmedi</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{run.sources.length} kaynak</span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        {run.answer ? (
                          <div className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
                            {toPlainText(run.answer)}
                          </div>
                        ) : null}
                        {!run.brandMentioned ? (
                          <div className="flex flex-wrap items-center gap-2 rounded-md border border-warning/30 bg-warning/5 p-2.5 text-xs">
                            <span className="flex-1 text-muted-foreground">
                              Bu yanıtta markanız geçmiyor. Ne yapmanız gerektiğini prompt detayında görebilirsiniz.
                            </span>
                            <Button asChild size="sm" variant="outline">
                              <Link to="/app/prompts" search={{ prompt: run.promptId }}>Aksiyonları gör</Link>
                            </Button>
                          </div>
                        ) : null}
                        {run.sources.length ? (
                          <ul className="space-y-1.5">
                            {run.sources.map((source) => (
                              <li key={source.url} className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2">
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="flex-1 text-xs font-medium hover:text-primary"
                                >
                                  {source.title}
                                  <span className="ml-1 inline-flex text-muted-foreground"><ExternalLink className="h-3 w-3" /></span>
                                  <span className="mt-0.5 block font-mono text-[11px] font-normal text-muted-foreground">{source.domain}</span>
                                </a>
                                <Badge
                                  variant="outline"
                                  className={
                                    source.type === "own"
                                      ? "border-success/40 text-success"
                                      : source.type === "competitor"
                                        ? "border-warning/40 text-warning"
                                        : ""
                                  }
                                >
                                  {source.type === "own" ? "Sizin siteniz" : source.type === "competitor" ? "Rakip" : "Tarafsız"}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-muted-foreground">Bu yanıtta kaynak bağlantısı dönmedi.</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </>
  );
}
