import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, ListTodo, Loader2, Plus, Trash2 } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createGeoTask, deleteGeoTask, listGeoTasks, setGeoTaskStatus, suggestGeoTasks } from "@/lib/panel.functions";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/geo-tasks")({
  head: () => ({
    meta: [
      { title: "GEO Görevleri — OneCite Paneli" },
      { name: "description", content: "Yapay zeka görünürlüğünüzü artıracak somut içerik ve kanıt görevleri." },
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
  const suggestTasks = useServerFn(suggestGeoTasks);
  const [title, setTitle] = useState("");

  const key = ["geo-tasks", brand?.id];
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: () => fetchTasks({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
  });

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: key });

  const createMutation = useMutation({
    mutationFn: () => addTask({ data: { brandId: brand!.id, title: title.trim() } }),
    onSuccess: () => { setTitle(""); invalidate(); },
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
  const suggestMutation = useMutation({
    mutationFn: () => suggestTasks({ data: { brandId: brand!.id } }),
    onSuccess: (result) => {
      invalidate();
      toast.success(result.created ? `${result.created} yeni görev eklendi.` : "Ölçüm sonuçlarına göre yeni görev bulunamadı.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!brand) {
    return (
      <>
        <PanelPageHeading meta={{ title: "GEO Görevleri", description: "Önce bir marka ekleyin.", icon: ListTodo }} />
        <Card><CardContent className="py-10 text-center"><Button asChild><Link to="/app/onboarding">Markanı ekle</Link></Button></CardContent></Card>
      </>
    );
  }

  const open = data.filter((task) => task.status !== "done");
  const done = data.filter((task) => task.status === "done");

  return (
    <>
      <PanelPageHeading
        hint={<><p>Görevler, ölçüm sonuçlarınızdaki boşluklardan otomatik üretilir.</p><p>Öncelik sırasına göre tamamlayın; her tamamlanan görev bir sonraki ölçümde OneCite Score'unuzu yükseltir.</p></>}
        meta={{
          title: "GEO Görevleri",
          description: "Görünürlüğü artıracak somut işler. Tamamladıkça kaynak gösterilme ihtimaliniz yükselir.",
          icon: ListTodo,
        }}
        action={
          <Button size="sm" variant="outline" onClick={() => suggestMutation.mutate()} disabled={suggestMutation.isPending}>
            {suggestMutation.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
            Ölçümden görev üret
          </Button>
        }
      />

      <p className="text-xs text-muted-foreground">
        Görevler üç yoldan eklenir: yukarıdaki kutuya kendiniz yazarak, “Ölçümden görev üret” ile ölçüm sonuçlarından otomatik,
        ya da <Link to="/app/prompts" className="underline">Promptlar</Link> ekranında bir soruya tıklayıp “Göreve ekle” diyerek.
      </p>

      <div className="flex flex-wrap gap-2">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Yeni görev…"
          className="max-w-md"
          onKeyDown={(event) => { if (event.key === "Enter" && title.trim()) createMutation.mutate(); }}
        />
        <Button onClick={() => createMutation.mutate()} disabled={!title.trim() || createMutation.isPending}>
          <Plus className="mr-1.5 h-4 w-4" /> Ekle
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…</p>
          ) : data.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Henüz görev yok.</p>
          ) : (
            <ul className="divide-y divide-border">
              {[...open, ...done].map((task) => (
                <li key={task.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                  <span className={`min-w-0 flex-1 ${task.status === "done" ? "text-muted-foreground line-through" : ""}`}>
                    <span className="block font-medium">{task.title}</span>
                    {task.description ? <span className="block text-xs text-muted-foreground">{task.description}</span> : null}
                  </span>
                  <Badge variant="outline" className="text-[10px]">{PRIORITY_LABEL[task.priority] ?? task.priority}</Badge>
                  <Button
                    size="sm"
                    variant={task.status === "done" ? "ghost" : "outline"}
                    onClick={() => statusMutation.mutate({ id: task.id, status: task.status === "done" ? "todo" : "done" })}
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    {task.status === "done" ? "Geri al" : "Tamamla"}
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="Görevi sil" onClick={() => deleteMutation.mutate(task.id)}>
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
