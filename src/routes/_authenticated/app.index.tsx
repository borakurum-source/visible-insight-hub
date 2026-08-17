import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LayoutDashboard, ListChecks, BookOpen, ShieldCheck, Quote, Gauge, Sparkles } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreBreakdown } from "@/components/app/score-breakdown";
import { VisibilityCharts } from "@/components/app/visibility-charts";
import { TrafficCharts } from "@/components/app/traffic-charts";
import { GscStatusPanel } from "@/components/app/gsc-status";
import { getBrandOverview, getMeasurementState, getVisibilityAnalytics } from "@/lib/panel.functions";
import { getTrafficOverview } from "@/lib/integrations.functions";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      { title: "Komuta Merkezi — OneCite Paneli" },
      { name: "description", content: "Marka görünürlüğünüzün, promptlarınızın ve kanıt varlıklarınızın canlı özeti." },
      { property: "og:title", content: "Komuta Merkezi — OneCite Paneli" },
      { property: "og:description", content: "AI görünürlüğünüzün canlı özeti." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { brand } = useActiveBrand();
  const fetchOverview = useServerFn(getBrandOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["brand-overview", brand?.id],
    queryFn: () => fetchOverview({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
  });
  const fetchState = useServerFn(getMeasurementState);
  const { data: measurement } = useQuery({
    queryKey: ["measurement-state", brand?.id],
    queryFn: () => fetchState({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
  });
  const fetchAnalytics = useServerFn(getVisibilityAnalytics);
  const { data: analytics } = useQuery({
    queryKey: ["visibility-analytics", brand?.id],
    queryFn: () => fetchAnalytics({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
  });
  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30);
  const fetchTraffic = useServerFn(getTrafficOverview);
  const { data: traffic } = useQuery({
    queryKey: ["traffic-overview", brand?.id, rangeDays],
    queryFn: () => fetchTraffic({ data: { brandId: brand!.id, days: rangeDays } }),
    enabled: Boolean(brand?.id),
  });

  const stats = [
    { label: "Onaylı prompt", value: data?.approvedPrompts ?? 0, icon: ListChecks, to: "/app/prompts" },
    { label: "Bilgi kaynağı", value: data?.knowledgeSources ?? 0, icon: BookOpen, to: "/app/knowledge-base" },
    { label: "Marka iddiası", value: data?.claims ?? 0, icon: ShieldCheck, to: "/app/claims" },
    { label: "Alıntı", value: data?.citations ?? 0, icon: Quote, to: "/app/measurement" },
  ] as const;

  return (
    <>
      <PanelPageHeading
        meta={{
          title: "Komuta Merkezi",
          description: brand ? `${brand.name} · ${brand.domain}` : "Başlamak için bir marka ekleyin.",
          icon: LayoutDashboard,
        }}
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/app/onboarding"><Sparkles className="mr-1.5 h-4 w-4" /> Kurulum</Link>
          </Button>
        }
      />

      {!brand ? (
        <Card>
          <CardContent className="space-y-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">Henüz bir marka eklemediniz.</p>
            <Button asChild><Link to="/app/onboarding">Markanı ekle</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {data && data.runs > 0 ? (
            <ScoreBreakdown
              total={measurement?.score.total ?? 0}
              components={measurement?.score.components ?? []}
              runs={measurement?.totalRuns ?? data.runs}
              lastRunAt={measurement?.batch?.finished_at ?? null}
            />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map(({ label, value, icon: Icon, to }) => (
              <Link key={label} to={to} className="group">
                <Card className="h-full transition-colors group-hover:border-primary/40">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </CardHeader>
                  <CardContent>
                    <p className="font-display text-2xl font-semibold">{isLoading ? "—" : value}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-muted-foreground">Tarih aralığı:</span>
            {([7, 30, 90] as const).map((range) => (
              <Button
                key={range}
                size="sm"
                variant={range === rangeDays ? "default" : "outline"}
                onClick={() => setRangeDays(range)}
              >
                Son {range} gün
              </Button>
            ))}
          </div>

          {traffic ? <GscStatusPanel data={traffic} /> : null}
          {traffic ? <TrafficCharts data={traffic} /> : null}

          {data && data.runs > 0 ? (
            analytics ? <VisibilityCharts data={analytics} /> : null
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                <Gauge className="h-4 w-4 text-primary" aria-hidden="true" />
                <CardTitle className="text-base">İlk ölçümünüzü çalıştırın</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Onaylı promptlarınızı yapay zeka asistanlarında çalıştırıp görünürlük skorunuzu ve kırılımını çıkarıyoruz.
                </p>
                <Button asChild size="sm">
                  <Link to="/app/measurement"><Gauge className="mr-1.5 h-4 w-4" /> Ölçümü başlat</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </>
  );
}
