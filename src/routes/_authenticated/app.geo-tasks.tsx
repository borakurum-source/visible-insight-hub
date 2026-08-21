import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  ListTodo,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { ACTIONS_SUBNAV, PanelSubnav } from "@/components/app/panel-subnav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  approveFinding,
  createGeoTask,
  deleteGeoTask,
  listFindings,
  listGeoTasks,
  remeasureGeoTask,
  setGeoTaskStatus,
} from "@/lib/panel.functions";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/geo-tasks")({
  head: () => ({
    meta: [
      { title: "GEO Görevleri — OneCite Paneli" },
      {
        name: "description",
        content: "Yapay zeka görünürlüğünüzü artıracak somut içerik ve kanıt görevleri.",
      },
      { property: "og:title", content: "GEO Görevleri — OneCite Paneli" },
      { property: "og:description", content: "Görünürlük görevlerinizi takip edin." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GeoTasksPage,
});

const PRIORITY_LABEL: Record<string, string> = { high: "Yüksek", medium: "Orta", low: "Düşük" };

function GeoTasksPage() {
  const { brand } = useActiveBrand();
  const queryClient = useQueryClient();
  const fetchTasks = useServerFn(listGeoTasks);
  const addTask = useServerFn(createGeoTask);
  const updateStatus = useServerFn(setGeoTaskStatus);
  const removeTask = useServerFn(deleteGeoTask);
  const fetchFindings = useServerFn(listFindings);
  const approve = useServerFn(approveFinding);
  const remeasure = useServerFn(remeasureGeoTask);
  const [title, setTitle] = useState("");

  const key = ["geo-tasks", brand?.id];
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: () => fetchTasks({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
  });
  const findings = useQuery({
    queryKey: ["findings", brand?.id],
    queryFn: () => fetchFindings({ data: { brandId: brand!.id, status: "open" } }),
    enabled: Boolean(brand?.id),
  });

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: key });

  const createMutation = useMutation({
    mutationFn: () => addTask({ data: { brandId: brand!.id, title: title.trim() } }),
    onSuccess: () => {
      setTitle("");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: string }) => updateStatus({ data: input }),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeTask({ data: { id } }),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });
  const approveMutation = useMutation({
    mutationFn: (findingId: string) => approve({ data: { findingId } }),
    onSuccess: () => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ["findings", brand?.id] });
      void queryClient.invalidateQueries({ queryKey: ["outcome-control-center", brand?.id] });
      toast.success("Bulgu tek bir göreve dönüştürüldü.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const remeasureMutation = useMutation({
    mutationFn: (id: string) => remeasure({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Yeniden ölçüm kuyruğa alındı.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!brand) {
    return (
      <>
        <PanelSubnav items={ACTIONS_SUBNAV} />
        <PanelPageHeading
          meta={{ title: "GEO Görevleri", description: "Önce bir marka ekleyin.", icon: ListTodo }}
        />
        <Card>
          <CardContent className="py-10 text-center">
            <Button asChild>
              <Link to="/app/onboarding">Markanı ekle</Link>
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const open = data.filter((task) => task.status !== "done");
  const done = data.filter((task) => task.status === "done");

  return (
    <>
      <PanelSubnav items={ACTIONS_SUBNAV} />
      <PanelPageHeading
        hint={
          <>
            <p>Bulgular kanıtlarıyla birlikte gelir ve yalnız sizin onayınızla göreve dönüşür.</p>
            <p>
              Görev tamamlandığında aynı prompt setiyle yeniden ölçerek öncesi/sonrası değişimi
              kontrol edin; bu korelasyon nedensellik iddiası değildir.
            </p>
          </>
        }
        meta={{
          title: "Bulgular ve Aksiyonlar",
          description: "Tespit → kanıt → sorun → öneri → kullanıcı onayı → yeniden ölçüm zinciri.",
          icon: ListTodo,
        }}
      />

      <p className="text-xs text-muted-foreground">
        Sistem bulguları otomatik görev yapmaz. Kanıtı inceleyip “Onayla ve göreve çevir”
        dediğinizde idempotent biçimde tek görev oluşur.
      </p>

      {(findings.data?.length ?? 0) > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {findings.data?.map((finding) => (
            <Card key={String(finding.id)} className="border-warning/30">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
                  <div>
                    <p className="text-sm font-semibold">{String(finding.title)}</p>
                    <p className="text-xs text-muted-foreground">{String(finding.detection)}</p>
                  </div>
                </div>
                {finding.cause ? (
                  <p className="text-xs">
                    <span className="font-medium">Neden:</span> {String(finding.cause)}
                  </p>
                ) : null}
                <p className="text-xs">
                  <span className="font-medium">Çözüm:</span> {String(finding.recommendation)}
                </p>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <Badge variant="outline">{Number(finding.evidence_count ?? 0)} kanıt</Badge>
                  <Badge variant="outline">
                    Güven %{Math.round(Number(finding.confidence ?? 0) * 100)}
                  </Badge>
                  <Badge variant="outline">Etki {Number(finding.impact ?? 0)}</Badge>
                  <Badge variant="outline">Efor {Number(finding.effort ?? 0)}</Badge>
                </div>
                <Button
                  size="sm"
                  onClick={() => approveMutation.mutate(String(finding.id))}
                  disabled={approveMutation.isPending}
                >
                  <ShieldCheck className="mr-1.5 h-4 w-4" />
                  Onayla ve göreve çevir
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Yeni görev…"
          className="max-w-md"
          onKeyDown={(event) => {
            if (event.key === "Enter" && title.trim()) createMutation.mutate();
          }}
        />
        <Button
          onClick={() => createMutation.mutate()}
          disabled={!title.trim() || createMutation.isPending}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Ekle
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…
            </p>
          ) : data.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Henüz görev yok.</p>
          ) : (
            <ul className="divide-y divide-border">
              {[...open, ...done].map((task) => (
                <li key={task.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                  <span
                    className={`min-w-0 flex-1 ${task.status === "done" ? "text-muted-foreground line-through" : ""}`}
                  >
                    <span className="block font-medium">{task.title}</span>
                    {task.description ? (
                      <span className="block text-xs text-muted-foreground">
                        {task.description}
                      </span>
                    ) : null}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {PRIORITY_LABEL[task.priority] ?? task.priority}
                  </Badge>
                  <Button
                    size="sm"
                    variant={task.status === "done" ? "ghost" : "outline"}
                    onClick={() =>
                      statusMutation.mutate({
                        id: task.id,
                        status: task.status === "done" ? "todo" : "done",
                      })
                    }
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    {task.status === "done" ? "Geri al" : "Tamamla"}
                  </Button>
                  {task.status === "done" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        remeasureMutation.isPending ||
                        ["queued", "completed"].includes(
                          (task as unknown as { remeasure_status?: string }).remeasure_status ?? "",
                        )
                      }
                      onClick={() => remeasureMutation.mutate(task.id)}
                    >
                      <RefreshCw className="mr-1.5 h-4 w-4" />
                      {(task as unknown as { remeasure_status?: string }).remeasure_status ===
                      "completed"
                        ? "Yeniden ölçüldü"
                        : "Yeniden ölç"}
                    </Button>
                  ) : null}
                  {typeof (task as unknown as { beforeScore?: number | null }).beforeScore ===
                    "number" &&
                  typeof (task as unknown as { afterScore?: number | null }).afterScore ===
                    "number" ? (
                    <div
                      className="basis-full rounded-md border border-border bg-muted/30 p-2"
                      aria-label="Yeniden ölçüm öncesi ve sonrası görünürlük skoru"
                    >
                      <div className="flex items-center gap-2 text-[11px]">
                        <span>
                          Önce{" "}
                          {Math.round((task as unknown as { beforeScore: number }).beforeScore)}
                        </span>
                        <span className="h-px flex-1 bg-gradient-to-r from-muted-foreground to-primary" />
                        <span className="font-semibold text-primary">
                          Sonra {Math.round((task as unknown as { afterScore: number }).afterScore)}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Aynı dönemde görülen değişimdir; tek başına nedensellik kanıtı değildir.
                      </p>
                    </div>
                  ) : null}
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Görevi sil"
                    onClick={() => deleteMutation.mutate(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
