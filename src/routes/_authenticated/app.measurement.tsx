import { useEffect, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, Play, Gauge, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { PanelSubnav } from "@/components/app/panel-subnav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QuerySkeleton } from "@/components/app/panel-query-states";
import { ScoreBreakdown } from "@/components/app/score-breakdown";
import { getMeasurementState } from "@/lib/panel.functions";
import { useMeasurementRun } from "@/lib/use-measurement-run";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/measurement")({
  validateSearch: (search: Record<string, unknown>): { autostart?: boolean } =>
    search["autostart"] === true || search["autostart"] === "1" ? { autostart: true } : {},
  head: () => ({
    meta: [
      { title: "Ölçüm — OneCite Paneli" },
      { name: "description", content: "Onaylı promptlarınızı yapay zekâ asistanlarında çalıştırın ve görünürlük skorunuzu kırılımıyla görün." },
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
      <PanelSubnav items={[{ to: "/app/prompts", label: "Promptlar" }, { to: "/app/prompt-discovery", label: "Prompt Keşfi" }, { to: "/app/measurement", label: "Ölçüm & Skor" }, { to: "/app/citation-discovery", label: "Kaynak Keşfi" }, { to: "/app/report", label: "Rapor" }]} />
      <PanelPageHeading
        meta={{
          title: "Ölçüm",
          description: "Onaylı promptlarınızı yapay zekâ asistanlarında çalıştırıp görünürlüğünüzü puanlıyoruz.",
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
        </div>
      )}
    </>
  );
}
