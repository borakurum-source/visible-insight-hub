import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard, RefreshCw, UserPlus } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { KpiCard } from "@/components/app/panel-shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockOverview, mockTrend, mockKbHealth, mockClusterStats, mockPriorityTasks } from "@/lib/panel-mock/overview";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      { title: "Komuta Merkezi — OneCite Paneli" },
      { name: "description", content: "Seçili domainin AI görünürlüğünü, kanıt durumunu ve öncelikli işleri tek yerde izleyin." },
      { property: "og:title", content: "Komuta Merkezi — OneCite Paneli" },
      { property: "og:description", content: "AI görünürlüğü, kanıt gücü ve öncelikli işler tek ekranda." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <>
      <PanelPageHeading
        meta={{
          title: "Komuta Merkezi",
          description: "Seçili domainin AI görünürlüğünü, kanıt durumunu ve öncelikli işleri tek yerde izleyin.",
          icon: LayoutDashboard,
        }}
        action={
          <>
            <Button variant="outline" size="sm"><UserPlus className="mr-2 h-3.5 w-3.5" /> Yeni Marka</Button>
            <Button size="sm"><RefreshCw className="mr-2 h-3.5 w-3.5" /> Tümünü Güncelle</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={<LayoutDashboard className="h-4 w-4" />} label="Görünürlük Skoru" value={String(mockOverview.visibilityScore)} sub={mockOverview.visibilityLabel} hint="Marka bahsi + alıntı oranından hesaplanan bileşik skor." />
        <KpiCard icon={<LayoutDashboard className="h-4 w-4" />} label="Bahsedilme Oranı" value={`%${Math.round(mockOverview.mentionRate * 100)}`} sub={`${mockOverview.totalRuns} çalıştırma`} />
        <KpiCard icon={<LayoutDashboard className="h-4 w-4" />} label="Alıntılanma Oranı" value={`%${Math.round(mockOverview.citedRate * 100)}`} sub={`${mockOverview.promptsWithRuns}/${mockOverview.totalPrompts} prompt ölçüldü`} />
        <KpiCard icon={<LayoutDashboard className="h-4 w-4" />} label="Son Ölçüm" value={mockOverview.lastRunAt} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Görünürlük trendi</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-2">
              {mockTrend.map((point) => (
                <div key={point.date} className="flex flex-col items-center gap-1">
                  <div className="flex h-24 w-full items-end rounded bg-muted">
                    <div className="w-full rounded bg-primary" style={{ height: `${point.mentionRate * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{point.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Rakip liderlik tablosu</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {mockOverview.competitorLeaderboard.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <span>{c.name}</span>
                <Badge variant="outline">{c.count} anılma</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Bilgi bankası sağlığı</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-muted-foreground">Sağlık skoru</p><p className="text-lg font-semibold">{mockKbHealth.score}/100</p></div>
            <div><p className="text-muted-foreground">Kaynak sayısı</p><p className="text-lg font-semibold">{mockKbHealth.sourceCount}</p></div>
            <div><p className="text-muted-foreground">Parça sayısı</p><p className="text-lg font-semibold">{mockKbHealth.chunkCount}</p></div>
            <div><p className="text-muted-foreground">Eski kaynaklar</p><p className="text-lg font-semibold text-destructive">{mockKbHealth.staleSourceCount}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Öncelikli işler</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {mockPriorityTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-2 text-sm">
                <Badge variant="outline" className={task.severity === "yuksek" ? "border-destructive text-destructive" : ""}>
                  {task.severity === "yuksek" ? "Yüksek" : task.severity === "orta" ? "Orta" : "Düşük"}
                </Badge>
                <span className="text-muted-foreground">{task.title}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Cluster bazlı performans</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="py-2 pr-4">Cluster</th><th className="py-2 pr-4">Toplam</th><th className="py-2 pr-4">Ölçülen</th><th className="py-2 pr-4">Bahsedilme</th><th className="py-2 pr-4">Alıntılanma</th></tr>
            </thead>
            <tbody>
              {mockClusterStats.map((c) => (
                <tr key={c.cluster} className="border-t border-border/70">
                  <td className="py-2 pr-4">{c.cluster}</td>
                  <td className="py-2 pr-4">{c.total}</td>
                  <td className="py-2 pr-4">{c.measured}</td>
                  <td className="py-2 pr-4">%{Math.round(c.mentionRate * 100)}</td>
                  <td className="py-2 pr-4">%{Math.round(c.citedRate * 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
