import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, ChevronDown, ExternalLink, ListChecks, ListTodo, Loader2, Pause, Plus, Trash2 } from "lucide-react";
import { Hint } from "@/components/app/hint";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { PanelSubnav, VISIBILITY_SUBNAV } from "@/components/app/panel-subnav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createGeoTask,
  createPrompt,
  deletePrompt,
  getPlanUsage,
  getPromptInsight,
  listPrompts,
  setPromptActionDone,
  setPromptStatus,
} from "@/lib/panel.functions";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/prompts")({
  validateSearch: (search: Record<string, unknown>): { prompt?: string } =>
    typeof search["prompt"] === "string" ? { prompt: search["prompt"] } : {},
  head: () => ({
    meta: [
      { title: "Promptlar — OneCite Paneli" },
      { name: "description", content: "Yapay zekâ motorlarında takip ettiğiniz soruları yönetin ve onaylayın." },
      { property: "og:title", content: "Promptlar — OneCite Paneli" },
      { property: "og:description", content: "Takip edilen soruları yönetin." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PromptsPage,
});

const FILTERS = [
  { value: "approved", label: "Onaylı" },
  { value: "candidate", label: "Aday" },
  { value: "inactive", label: "Pasif" },
] as const;

function PromptsPage() {
  const { brand } = useActiveBrand();
  const { prompt: promptFromSearch } = Route.useSearch();
  const queryClient = useQueryClient();
  const fetchPrompts = useServerFn(listPrompts);
  const updateStatus = useServerFn(setPromptStatus);
  const addPrompt = useServerFn(createPrompt);
  const removePrompt = useServerFn(deletePrompt);
  const fetchPlanUsage = useServerFn(getPlanUsage);
  const [filter, setFilter] = useState<string>("approved");
  const [draft, setDraft] = useState("");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [openPrompt, setOpenPrompt] = useState<string | null>(promptFromSearch ?? null);

  const key = ["prompts", brand?.id];
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: () => fetchPrompts({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
  });

  const { data: plan } = useQuery({
    queryKey: ["plan-usage", brand?.id],
    queryFn: () => fetchPlanUsage({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: key });
    void queryClient.invalidateQueries({ queryKey: ["plan-usage", brand?.id] });
    void queryClient.invalidateQueries({ queryKey: ["brand-overview", brand?.id] });
  };

  const statusMutation = useMutation({
    mutationFn: (input: { ids: string[]; status: string }) => updateStatus({ data: input }),
    onSuccess: () => { setChecked({}); invalidate(); },
    onError: (error: Error) => toast.error(error.message),
  });

  const createMutation = useMutation({
    mutationFn: () => addPrompt({ data: { brandId: brand!.id, text: draft.trim() } }),
    onSuccess: () => { setDraft(""); invalidate(); },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removePrompt({ data: { id } }),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const visible = data.filter((prompt) => prompt.status === filter);
  const selectedIds = visible.filter((prompt) => checked[prompt.id]).map((prompt) => prompt.id);
  const candidateCount = data.filter((prompt) => prompt.status === "candidate").length;

  if (!brand) {
    return (
      <>
        <PanelSubnav items={VISIBILITY_SUBNAV} />
        <PanelPageHeading meta={{ title: "Promptlar", description: "Önce bir marka ekleyin.", icon: ListChecks }} />
        <Card><CardContent className="py-10 text-center"><Button asChild><Link to="/app/onboarding">Markanı ekle</Link></Button></CardContent></Card>
      </>
    );
  }

  return (
    <>
      <PanelSubnav items={VISIBILITY_SUBNAV} />
      <PanelPageHeading
        meta={{
          title: "Promptlar",
          description: "Yapay zekâ motorlarında görünmek istediğiniz sorular. Adayları onaylayın, kendi sorunuzu ekleyin.",
          icon: ListChecks,
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        {plan ? (
          <div className="w-full text-xs text-muted-foreground">
            <strong className="text-foreground">{plan.planLabel}</strong> planı ·{" "}
            {plan.maxPrompts > 0
              ? `${plan.approvedPrompts} / ${plan.maxPrompts} onaylı prompt`
              : `${plan.approvedPrompts} onaylı prompt (sınırsız)`}
            {plan.maxPrompts > 0 && plan.approvedPrompts >= plan.maxPrompts ? (
              <>
                {" — limit doldu. "}
                <Link to="/fiyatlandirma" className="underline">Planı yükseltin</Link>
              </>
            ) : null}
          </div>
        ) : null}
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Yeni bir soru yazın…"
          className="max-w-md"
          onKeyDown={(event) => { if (event.key === "Enter" && draft.trim()) createMutation.mutate(); }}
        />
        <Button onClick={() => createMutation.mutate()} disabled={!draft.trim() || createMutation.isPending}>
          <Plus className="mr-1.5 h-4 w-4" /> Ekle
        </Button>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          {FILTERS.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label} ({data.filter((prompt) => prompt.status === item.value).length})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filter === "candidate" && candidateCount > 0 ? (
        <p className="text-xs text-muted-foreground">
          Onayladığınız sorular ölçüme girer. Emin olmadıklarınızı pasife alın — sonra her zaman geri açabilirsiniz.
        </p>
      ) : null}

      {visible.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2.5 text-sm">
          <Checkbox
            aria-label="Tümünü seç"
            checked={selectedIds.length > 0 && selectedIds.length === visible.length}
            onCheckedChange={(value) =>
              setChecked(value === true ? Object.fromEntries(visible.map((p) => [p.id, true])) : {})
            }
          />
          <span className="text-muted-foreground">
            {selectedIds.length > 0 ? `${selectedIds.length} soru seçildi` : "Toplu işlem için seçin"}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" disabled={!selectedIds.length || statusMutation.isPending}
              onClick={() => statusMutation.mutate({ ids: selectedIds, status: "approved" })}>
              <Check className="mr-1.5 h-3.5 w-3.5" /> Onayla
            </Button>
            <Button size="sm" variant="outline" disabled={!selectedIds.length || statusMutation.isPending}
              onClick={() => statusMutation.mutate({ ids: selectedIds, status: "inactive" })}>
              <Pause className="mr-1.5 h-3.5 w-3.5" /> Pasife al
            </Button>
          </div>
        </div>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…</p>
          ) : visible.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Bu listede prompt yok.</p>
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((prompt) => (
                <li key={prompt.id} className="p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-3">
                  <Checkbox
                    aria-label="Promptu seç"
                    checked={Boolean(checked[prompt.id])}
                    onCheckedChange={(value) => setChecked({ ...checked, [prompt.id]: value === true })}
                  />
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left hover:text-primary"
                    onClick={() => setOpenPrompt(openPrompt === prompt.id ? null : prompt.id)}
                    aria-expanded={openPrompt === prompt.id}
                  >
                    {prompt.text}
                    <ChevronDown
                      className={`ml-1.5 inline h-3.5 w-3.5 transition-transform ${openPrompt === prompt.id ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  {prompt.intent ? <Badge variant="secondary" className="text-[10px]">{prompt.intent}</Badge> : null}
                  <Badge variant="outline" className="text-[10px]">{prompt.category}</Badge>
                  {prompt.status !== "approved" ? (
                    <Button size="sm" variant="outline" disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ ids: [prompt.id], status: "approved" })}>Onayla</Button>
                  ) : (
                    <Button size="sm" variant="ghost" disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ ids: [prompt.id], status: "inactive" })}>Duraklat</Button>
                  )}
                  <Button size="icon" variant="ghost" aria-label="Promptu sil" onClick={() => deleteMutation.mutate(prompt.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  </div>
                  {openPrompt === prompt.id ? <PromptDetail brandId={brand.id} promptId={prompt.id} /> : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function PromptDetail({ brandId, promptId }: { brandId: string; promptId: string }) {
  const fetchInsight = useServerFn(getPromptInsight);
  const addTask = useServerFn(createGeoTask);
  const { data, isLoading } = useQuery({
    queryKey: ["prompt-insight", promptId],
    queryFn: () => fetchInsight({ data: { brandId, promptId } }),
  });

  const toggleAction = useServerFn(setPromptActionDone);
  const queryClient = useQueryClient();
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prompt-insight", promptId] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const doneCount = data?.actions?.filter((action) => action.done).length ?? 0;

  const taskMutation = useMutation({
    mutationFn: (input: { title: string; description: string; priority: string }) =>
      addTask({ data: { brandId, ...input } }),
    onSuccess: () => toast.success("Görev, Görevler listenize eklendi."),
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Son ölçüm yükleniyor…
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-border bg-muted/20 p-3">
      {data?.run ? (
        <>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {data.run.brandMentioned ? (
              <Badge variant="outline" className="border-success/40 text-success">
                {data.run.position ? `${data.run.position}. sırada` : "Yanıtta geçiyor"}
              </Badge>
            ) : (
              <Badge variant="secondary">Yanıtta geçmiyor</Badge>
            )}
            <span>{new Date(data.run.createdAt).toLocaleString("tr-TR")} · {data.run.engine}</span>
          </div>
          <div className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-md bg-background p-3 text-xs leading-relaxed text-muted-foreground">
            {data.run.answer}
          </div>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          Bu soru henüz ölçülmedi. <Link to="/app/measurement" className="underline">Ölçüm başlatın</Link>.
        </p>
      )}

      {data?.sources?.length ? (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Kullanılan kaynaklar</p>
          {data.sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs hover:text-primary"
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
              <p>Bu adımları tamamladıkça kutucukları işaretleyin; işaretleriniz kaydedilir.</p>
              <p><strong>Göreve ekle</strong> ile adımı Görevler listenize taşıyıp ekibinizle takip edebilirsiniz.</p>
            </Hint>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground">
              {doneCount} / {data.actions.length} tamam
            </span>
          </div>
          {data.actions.map((action) => (
            <div key={action.key} className="flex flex-wrap items-start gap-2 rounded-md border border-border bg-background p-2.5">
              <Checkbox
                id={`action-${promptId}-${action.key}`}
                className="mt-0.5"
                checked={action.done}
                disabled={toggleMutation.isPending}
                onCheckedChange={(checked) => toggleMutation.mutate({ action, done: checked === true })}
              />
              <div className="min-w-0 flex-1">
                <label
                  htmlFor={`action-${promptId}-${action.key}`}
                  className={`cursor-pointer text-xs font-medium ${action.done ? "text-muted-foreground line-through" : ""}`}
                >
                  {action.title}
                </label>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{action.description}</p>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" disabled={taskMutation.isPending}
                  onClick={() => taskMutation.mutate(action)}>
                  <ListTodo className="mr-1.5 h-3.5 w-3.5" /> Göreve ekle
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
