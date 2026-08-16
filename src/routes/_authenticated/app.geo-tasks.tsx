import { createFileRoute } from "@tanstack/react-router";
import { Building2, KanbanSquare, Zap } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GEO_TASK_COLUMNS, mockGeoTasks } from "@/lib/panel-mock/geo-tasks";

export const Route = createFileRoute("/_authenticated/app/geo-tasks")({
  head: () => ({
    meta: [
      { title: "GEO Görev Panosu — OneCite Paneli" },
      { name: "description", content: "AI aksiyon planlarından türeyen GEO görevlerini kanban panosunda takip edin." },
      { property: "og:title", content: "GEO Görev Panosu — OneCite Paneli" },
      { property: "og:description", content: "Aksiyon planı görevlerini durum bazlı kolonlarda izleyin." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GeoTasksPage,
});

const priorityTone: Record<string, string> = {
  yuksek: "text-destructive border-destructive/40",
  orta: "text-amber-600 dark:text-amber-400 border-amber-500/40",
  dusuk: "text-muted-foreground border-border",
};

function GeoTasksPage() {
  const quickWinCount = mockGeoTasks.filter((t) => t.priority === "yuksek" && t.column !== "tamamlandi").length;

  return (
    <>
      <PanelPageHeading
        meta={{ title: "GEO Görev Panosu", description: "Aksiyon planı üretilmiş her prompt burada bir görev kartı olarak görünür.", icon: KanbanSquare }}
      />

      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-6 md:flex-row">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KanbanSquare className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">GEO Görev Panosu</p>
            <p className="max-w-2xl text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Hızlı Kazanım</span> etiketi, markanın cevapta zaten
              geçtiği ama atıf alamadığı — dolayısıyla tek bir hedefli çalışmayla kapanma ihtimali en yüksek —
              görevleri işaretler; ölçülmüş mention/citation verisinden türetilir.
            </p>
          </div>
        </CardContent>
      </Card>

      {quickWinCount > 0 && (
        <p className="text-xs text-muted-foreground">
          Bekleyen görevler arasında <span className="font-medium text-foreground">{quickWinCount} Hızlı Kazanım</span> fırsatı var.
        </p>
      )}

      <div className="flex gap-3 overflow-x-auto pb-2">
        {GEO_TASK_COLUMNS.map((col) => {
          const tasks = mockGeoTasks.filter((t) => t.column === col.id);
          return (
            <div key={col.id} className="min-w-[260px] flex-1 space-y-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-sm font-semibold">{col.label}</p>
                <Badge variant="secondary" className="text-[10px]">{tasks.length}</Badge>
              </div>
              <div className="min-h-[80px] space-y-2">
                {tasks.map((t) => (
                  <Card key={t.id}>
                    <CardContent className="space-y-2 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className={`gap-1 text-[10px] ${priorityTone[t.priority]}`}>
                          <Zap className="h-3 w-3 shrink-0" /> {t.priority}
                        </Badge>
                      </div>
                      <p className="line-clamp-2 text-sm font-medium">{t.title}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{t.assignee}</span>
                        <span className="opacity-50">·</span>
                        <span>{t.dueDate}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {tasks.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">Görev yok</p>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
