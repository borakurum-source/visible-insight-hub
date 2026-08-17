import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, ExternalLink, ListTodo, Loader2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/app/hint";
import {
  createGeoTask,
  dismissCompetitorCandidate,
  getPromptInsight,
  promoteCompetitorCandidate,
  setPromptActionDone,
} from "@/lib/panel.functions";
import { toPlainText } from "@/lib/plain-text";

const ENGINE_LABEL: Record<string, string> = {
  perplexity: "Perplexity Sonar",
  deepseek: "DeepSeek",
};

function engineLabel(engine: string) {
  return ENGINE_LABEL[engine] ?? engine;
}

function VisibilityBadge({ value }: { value: number }) {
  const tone = value >= 70 ? "border-success/40 text-success" : value > 0 ? "border-warning/40 text-warning" : "border-border text-muted-foreground";
  return (
    <span className={`rounded-md border px-2 py-0.5 font-mono text-[11px] ${tone}`}>
      Görünürlük %{Math.round(value)}
    </span>
  );
}

/** Prompt satırı açıldığında görünen sonuç kartı: ölçüm özeti, geçen markalar,
 *  yeni rakip adayları, tam yanıt, kaynaklar ve aksiyon kontrol listesi. */
export function PromptResultCard({ brandId, promptId }: { brandId: string; promptId: string }) {
  const fetchInsight = useServerFn(getPromptInsight);
  const addTask = useServerFn(createGeoTask);
  const promoteCandidate = useServerFn(promoteCompetitorCandidate);
  const dismissCandidate = useServerFn(dismissCompetitorCandidate);
  const toggleAction = useServerFn(setPromptActionDone);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [addedTasks, setAddedTasks] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["prompt-insight", promptId, selectedRunId],
    queryFn: () =>
      fetchInsight({ data: { brandId, promptId, ...(selectedRunId ? { runId: selectedRunId } : {}) } }),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["prompt-insight", promptId] });
  };

  const toggleMutation = useMutation({
    mutationFn: ({ action, done }: { action: { key: string; title: string; description: string; priority: string }; done: boolean }) =>
      toggleAction({
        data: {
          brandId,
          promptId,
          key: action.key,
          title: action.title,
          description: action.description,
          priority: action.priority,
          done,
        },
      }),
    onSuccess: (_result, variables) => {
      invalidate();
      toast.success(variables.done ? "Adım tamamlandı olarak işaretlendi." : "İşaret kaldırıldı.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const taskMutation = useMutation({
    mutationFn: (input: { title: string; description: string; priority: string }) =>
      addTask({ data: { brandId, ...input } }),
    onSuccess: (_result, variables) => {
      setAddedTasks((prev) => [...prev, variables.title]);
      toast.success("Görev eklendi", {
        description: `“${variables.title}” Görevler listenize eklendi.`,
        action: { label: "Görevlere git", onClick: () => navigate({ to: "/app/geo-tasks" }) },
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const promoteMutation = useMutation({
    mutationFn: (candidateId: string) => promoteCandidate({ data: { brandId, candidateId } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error("Rakip eklenemedi", {
          description: result.message,
          action: { label: "Planı yükselt", onClick: () => navigate({ to: "/app/pricing" }) },
        });
        return;
      }
      toast.success(result.message, {
        action: { label: "Rakip Takibi", onClick: () => navigate({ to: "/app/competitors" }) },
      });
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ["competitors", brandId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const dismissMutation = useMutation({
    mutationFn: (candidateId: string) => dismissCandidate({ data: { brandId, candidateId } }),
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Ölçüm sonucu yükleniyor…
      </p>
    );
  }

  const runs = data?.runs ?? [];
  const run = data?.run ?? null;
  const answer = toPlainText(run?.answer ?? "");
  const isLongAnswer = answer.length > 1200;
  const doneCount = data?.actions?.filter((action) => action.done).length ?? 0;

  return (
    <div className="mt-3 space-y-4 rounded-lg border border-border bg-muted/20 p-3">
      {run ? (
        <>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <VisibilityBadge value={run.visibility ?? (run.brandMentioned ? 60 : 0)} />
            {run.brandMentioned ? (
              <Badge variant="outline" className="border-success/40 text-success">
                {run.position ? `${run.position}. sırada` : "Yanıtta geçiyor"}
              </Badge>
            ) : (
              <Badge variant="secondary">Yanıtta geçmiyor</Badge>
            )}
            <Badge variant="outline" className="font-mono text-[10px]">{engineLabel(run.engine)}</Badge>
            {run.runIndex ? <span className="font-mono text-[11px]">#{run.runIndex}</span> : null}
            <span>{new Date(run.createdAt).toLocaleString("tr-TR")}</span>
            <span className="ml-auto font-mono text-[11px]">{runs.length} çalıştırma</span>
          </div>

          {runs.length > 1 ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Çalıştırma geçmişi</p>
                <Hint title="Çalıştırma geçmişi">
                  <p>Her ölçüm turu ayrı bir çalıştırmadır. Bir turu seçtiğinizde o turdaki yanıt ve kaynaklar gösterilir.</p>
                </Hint>
              </div>
              <div className="flex flex-wrap items-end gap-1">
                {[...runs].reverse().map((item) => {
                  const active = item.id === run.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedRunId(item.id)}
                      title={`#${item.runIndex} · %${Math.round(item.visibility)} · ${new Date(item.createdAt).toLocaleDateString("tr-TR")}`}
                      className={`flex w-9 flex-col items-center gap-1 rounded-md border p-1 transition-colors ${
                        active ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/50"
                      }`}
                    >
                      <span
                        className={`w-full rounded-sm ${item.brandMentioned ? "bg-success" : "bg-muted-foreground/30"}`}
                        style={{ height: `${Math.max(4, (item.visibility / 100) * 28)}px` }}
                        aria-hidden="true"
                      />
                      <span className="font-mono text-[9px] text-muted-foreground">#{item.runIndex}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {data?.mentionedBrands?.length ? (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Yanıtta geçen markalar</p>
              <div className="flex flex-wrap gap-1.5">
                {data.mentionedBrands.map((item) => (
                  <span
                    key={`${item.name}-${item.rank}`}
                    className={`rounded-md border px-2 py-0.5 text-[11px] ${
                      item.type === "own"
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : item.type === "competitor"
                          ? "border-border text-foreground"
                          : "border-warning/40 text-warning"
                    }`}
                  >
                    {item.rank}. {item.name}
                    {item.type === "new" ? " · yeni" : ""}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {data?.candidates?.length ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Yeni rakipler</p>
                <Hint title="Yeni rakipler">
                  <p>Bu yanıtta geçen ama takip listenizde olmayan markalar. Ekleyince rakip karşılaştırma grafiklerine dahil olur.</p>
                </Hint>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.candidates.map((candidate) => (
                  <span key={candidate.id} className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px]">
                    {candidate.name}
                    <span className="font-mono text-[10px] text-muted-foreground">×{candidate.promptCount}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5"
                      aria-label={`${candidate.name} rakip olarak ekle`}
                      disabled={promoteMutation.isPending}
                      onClick={() => promoteMutation.mutate(candidate.id)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5"
                      aria-label={`${candidate.name} adayını yoksay`}
                      disabled={dismissMutation.isPending}
                      onClick={() => dismissMutation.mutate(candidate.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Yapay zeka yanıtı</p>
            <div
              className={`whitespace-pre-wrap rounded-md bg-background p-3 text-xs leading-relaxed text-muted-foreground ${
                isLongAnswer && !expanded ? "max-h-80 overflow-hidden" : ""
              }`}
            >
              {answer}
            </div>
            {isLongAnswer ? (
              <Button size="sm" variant="ghost" onClick={() => setExpanded((value) => !value)}>
                {expanded ? "Daralt" : "Tamamını göster"}
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          Bu soru henüz ölçülmedi. <Link to="/app/measurement" className="underline">Ölçüm başlatın</Link>.
        </p>
      )}

      {data?.sources?.length ? (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Kullanılan kaynaklar ({data.sources.length})
          </p>
          {data.sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer noopener"
              className={`flex items-center justify-between gap-3 rounded-md border bg-background px-2.5 py-1.5 text-xs hover:text-primary ${
                source.type === "own"
                  ? "border-primary/40"
                  : source.type === "competitor"
                    ? "border-warning/40"
                    : "border-border"
              }`}
            >
              <span className="min-w-0 flex-1 truncate">{source.title}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{source.domain}</span>
              <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
            </a>
          ))}
        </div>
      ) : null}

      {data?.actions?.length ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Bu soruda görünmek için</p>
            <Hint title="Kontrol listesi">
              <p><strong>Tamamlandı</strong> düğmesi adımı bitirdiğinizi işaretler; işaretiniz kaydedilir.</p>
              <p><strong>Göreve ekle</strong> ile adımı Görevler listenize taşıyıp ekibinizle takip edebilirsiniz.</p>
            </Hint>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground">
              {doneCount} / {data.actions.length} tamam
            </span>
          </div>
          {data.actions.map((action) => (
            <div key={action.key} className="flex flex-wrap items-start gap-2 rounded-md border border-border bg-background p-2.5">
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-medium ${action.done ? "text-muted-foreground line-through" : ""}`}>
                  {action.title}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{action.description}</p>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant={action.done ? "secondary" : "ghost"}
                  disabled={toggleMutation.isPending}
                  onClick={() => toggleMutation.mutate({ action, done: !action.done })}
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" /> {action.done ? "Tamamlandı" : "Tamamlandı işaretle"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={taskMutation.isPending || addedTasks.includes(action.title)}
                  onClick={() => taskMutation.mutate(action)}
                >
                  <ListTodo className="mr-1.5 h-3.5 w-3.5" /> {addedTasks.includes(action.title) ? "Göreve eklendi" : "Göreve ekle"}
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link to="/app/content">İçerik üret</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
