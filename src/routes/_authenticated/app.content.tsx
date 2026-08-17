import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AlertTriangle, Copy, Download, Loader2, PenSquare, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MiniMarkdown } from "@/components/site/mini-markdown";
import { deleteDraft, generateDraft, listContentGaps, listDrafts, setDraftStatus } from "@/lib/kb.functions";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/content")({
  head: () => ({
    meta: [
      { title: "İçerik Üretimi — OneCite Paneli" },
      { name: "description", content: "Kanıt boşluklarınızı görün ve bilgi bankanıza dayalı içerik taslakları üretin." },
      { property: "og:title", content: "İçerik Üretimi — OneCite Paneli" },
      { property: "og:description", content: "Kanıta dayalı içerik taslakları." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ContentPage,
});

const impactTone: Record<string, string> = {
  yüksek: "text-destructive border-destructive/40",
  orta: "text-amber-600 dark:text-amber-400 border-amber-500/40",
  düşük: "text-muted-foreground border-border",
};

const statusLabel: Record<string, string> = { taslak: "Taslak", incelemede: "İncelemede", yayinlandi: "Yayınlandı" };
const nextStatus: Record<string, string> = { taslak: "incelemede", incelemede: "yayinlandi", yayinlandi: "taslak" };

const FORMAT_OPTIONS = [
  { value: "blog", label: "Blog yazısı" },
  { value: "faq", label: "Soru-cevap (SSS)" },
  { value: "comparison", label: "Karşılaştırma" },
  { value: "landing", label: "Hizmet sayfası" },
];
const LENGTH_OPTIONS = [
  { value: "kisa", label: "Kısa (~400 kelime)" },
  { value: "orta", label: "Orta (~800 kelime)" },
  { value: "uzun", label: "Uzun (~1400 kelime)" },
];
const STATUS_FILTERS = [
  { value: "hepsi", label: "Hepsi" },
  { value: "taslak", label: "Taslak" },
  { value: "incelemede", label: "İncelemede" },
  { value: "yayinlandi", label: "Yayınlandı" },
];

function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşü]/g, (c) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "taslak";
}

function ContentPage() {
  const { brand } = useActiveBrand();
  const queryClient = useQueryClient();
  const fetchGaps = useServerFn(listContentGaps);
  const fetchDrafts = useServerFn(listDrafts);
  const createDraft = useServerFn(generateDraft);
  const updateStatus = useServerFn(setDraftStatus);
  const removeDraft = useServerFn(deleteDraft);
  const [openDraft, setOpenDraft] = useState<string | null>(null);
  const [format, setFormat] = useState("blog");
  const [length, setLength] = useState("orta");
  const [statusFilter, setStatusFilter] = useState("hepsi");

  const gapsKey = ["content-gaps", brand?.id];
  const draftsKey = ["content-drafts", brand?.id];

  const { data: gaps = [], isLoading: gapsLoading, refetch: refetchGaps, isFetching } = useQuery({
    queryKey: gapsKey,
    queryFn: () => fetchGaps({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
    staleTime: 5 * 60_000,
  });

  const { data: drafts = [] } = useQuery({
    queryKey: draftsKey,
    queryFn: () => fetchDrafts({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
  });

  const draftMutation = useMutation({
    mutationFn: (promptId: string) => createDraft({ data: { brandId: brand!.id, promptId, format, length } }),
    onSuccess: () => {
      toast.success("Taslak üretildi");
      void queryClient.invalidateQueries({ queryKey: draftsKey });
      void queryClient.invalidateQueries({ queryKey: gapsKey });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: string }) => updateStatus({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: draftsKey }),
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeDraft({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: draftsKey });
      void queryClient.invalidateQueries({ queryKey: gapsKey });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const visibleDrafts = useMemo(
    () => (statusFilter === "hepsi" ? drafts : drafts.filter((draft) => draft.status === statusFilter)),
    [drafts, statusFilter],
  );

  function copyDraft(title: string, body: string) {
    void navigator.clipboard
      .writeText(`# ${title}\n\n${body}`)
      .then(() => toast.success("Taslak panoya kopyalandı"))
      .catch(() => toast.error("Kopyalanamadı"));
  }

  function downloadDraft(title: string, body: string) {
    const blob = new Blob([`# ${title}\n\n${body}`], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugify(title)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!brand) {
    return (
      <>
        <PanelPageHeading meta={{ title: "İçerik Üretimi", description: "Önce bir marka ekleyin.", icon: PenSquare }} />
        <Card><CardContent className="py-10 text-center"><Button asChild><Link to="/app/onboarding">Markanı ekle</Link></Button></CardContent></Card>
      </>
    );
  }

  return (
    <>
      <PanelPageHeading
        meta={{
          title: "İçerik Üretimi",
          description: "Kanıt boşluğu = yapay zekanın sizi anmadığı soru + bilgi bankanızda karşılığı olmayan konu. Taslaklar yalnızca kendi kaynaklarınıza dayanır.",
          icon: PenSquare,
        }}
        action={
          <Button size="sm" variant="outline" onClick={() => void refetchGaps()} disabled={isFetching}>
            {isFetching ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
            Boşlukları yenile
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-3 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-sm font-medium"><Sparkles className="h-4 w-4" /> Kanıt Boşlukları</p>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="h-8 w-[170px] text-xs" aria-label="İçerik biçimi"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMAT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-xs">{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger className="h-8 w-[180px] text-xs" aria-label="İçerik uzunluğu"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LENGTH_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-xs">{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {gapsLoading ? (
            <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Bilgi bankası kapsamı hesaplanıyor…</p>
          ) : gaps.length === 0 ? (
            <div className="space-y-3 py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Şu an açık bir kanıt boşluğu yok. Prompt ekleyip ölçüm çalıştırdıkça yeni fırsatlar burada belirir.
              </p>
              <Button asChild size="sm" variant="secondary"><Link to="/app/prompts">Promptlara git</Link></Button>
            </div>
          ) : (
            <div className="space-y-2">
              {gaps.map((gap) => (
                <div key={gap.promptId} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{gap.prompt}</p>
                    <p className="text-xs text-muted-foreground">
                      {gap.category} · Bilgi bankası kapsamı %{gap.coverage} · {gap.measured ? `Anılma %${gap.mentionRate}` : "Henüz ölçülmedi"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`gap-1 text-[10px] ${impactTone[gap.impact]}`}>
                      <AlertTriangle className="h-3 w-3" /> {gap.impact}
                    </Badge>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={draftMutation.isPending}
                      onClick={() => draftMutation.mutate(gap.promptId)}
                    >
                      {draftMutation.isPending && draftMutation.variables === gap.promptId ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Taslak üret
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium">Taslaklar <span className="text-xs text-muted-foreground">({drafts.length})</span></p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    statusFilter === filter.value
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          {visibleDrafts.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">Henüz taslak yok. Yukarıdaki bir boşluktan üretin.</p>
          ) : (
            <div className="space-y-2">
              {visibleDrafts.map((draft) => (
                <div key={draft.id} className="rounded-md border border-border">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setOpenDraft(openDraft === draft.id ? null : draft.id)}
                    >
                      <p className="truncate text-sm font-medium">{draft.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        Hedef: {draft.target_prompt ?? "—"} · {draft.word_count} kelime
                      </p>
                    </button>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" aria-label="Taslağı kopyala" onClick={() => copyDraft(draft.title, draft.body)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" aria-label="Markdown indir" onClick={() => downloadDraft(draft.title, draft.body)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      {draft.prompt_id ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Yeniden üret"
                          disabled={draftMutation.isPending}
                          onClick={() => draftMutation.mutate(draft.prompt_id as string)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => statusMutation.mutate({ id: draft.id, status: nextStatus[draft.status] ?? "taslak" })}
                      >
                        {statusLabel[draft.status] ?? draft.status}
                      </Button>
                      <Button size="icon" variant="ghost" aria-label="Taslağı sil" onClick={() => deleteMutation.mutate(draft.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {openDraft === draft.id ? (
                    <div className="space-y-3 border-t border-border px-4 py-4">
                      <div className="prose-sm max-w-none text-sm">
                        <MiniMarkdown content={draft.body} />
                      </div>
                      {Array.isArray(draft.sources) && draft.sources.length > 0 ? (
                        <div className="border-t border-border pt-3">
                          <p className="mb-1 text-xs font-medium">Dayandığı kaynaklar</p>
                          <ul className="space-y-0.5">
                            {(draft.sources as Array<{ title?: string; url?: string | null }>).map((source, index) => (
                              <li key={index} className="text-xs text-muted-foreground">
                                {source.url ? (
                                  <a href={source.url} target="_blank" rel="noreferrer" className="hover:text-primary">{source.title ?? source.url}</a>
                                ) : (
                                  source.title
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
