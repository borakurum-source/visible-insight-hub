import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BookOpen, ExternalLink, Loader2, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { PanelSubnav, KNOWLEDGE_SUBNAV } from "@/components/app/panel-subnav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { addKnowledgeSources, deleteKnowledgeSource, listKnowledgeSources } from "@/lib/panel.functions";
import {
  indexKnowledgeSource,
  indexPendingSources,
  listCitationCandidates,
  promoteCitationToSource,
  rebuildGraphEntities,
  rebuildVectorMap,
  refreshStaleSources,
} from "@/lib/kb.functions";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/knowledge-base")({
  head: () => ({
    meta: [
      { title: "Bilgi Bankası — OneCite Paneli" },
      { name: "description", content: "Yapay zekanın kaynak göstermesini istediğiniz sayfaları yönetin." },
      { property: "og:title", content: "Bilgi Bankası — OneCite Paneli" },
      { property: "og:description", content: "Kaynak sayfalarınızı yönetin." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: KnowledgeBasePage,
});

function KnowledgeBasePage() {
  const { brand } = useActiveBrand();
  const queryClient = useQueryClient();
  const fetchSources = useServerFn(listKnowledgeSources);
  const addSources = useServerFn(addKnowledgeSources);
  const removeSource = useServerFn(deleteKnowledgeSource);
  const indexSource = useServerFn(indexKnowledgeSource);
  const indexPending = useServerFn(indexPendingSources);
  const reproject = useServerFn(rebuildVectorMap);
  const rebuildEntities = useServerFn(rebuildGraphEntities);
  const refreshStale = useServerFn(refreshStaleSources);
  const fetchCandidates = useServerFn(listCitationCandidates);
  const promoteCandidate = useServerFn(promoteCitationToSource);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const key = ["knowledge-sources", brand?.id];
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: () => fetchSources({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
  });

  const candidateKey = ["citation-candidates", brand?.id];
  const { data: candidates = [] } = useQuery({
    queryKey: candidateKey,
    queryFn: () => fetchCandidates({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: key });
    void queryClient.invalidateQueries({ queryKey: ["brand-overview", brand?.id] });
    void queryClient.invalidateQueries({ queryKey: ["knowledge-graph", brand?.id] });
    void queryClient.invalidateQueries({ queryKey: candidateKey });
  };

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const result = await refreshStale({ data: { brandId: brand!.id } });
      if (result.updated > 0) {
        await reproject({ data: { brandId: brand!.id } });
      }
      return result;
    },
    onSuccess: (result) => {
      toast.success(`${result.checked} kaynak kontrol edildi · ${result.updated} güncellendi · ${result.unchanged} değişmemiş`);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const promoteMutation = useMutation({
    mutationFn: (input: { url: string; title: string }) => promoteCandidate({ data: { brandId: brand!.id, ...input } }),
    onSuccess: () => { toast.success("Kaynak bilgi bankasına eklendi ve indekslendi"); invalidate(); },
    onError: (error: Error) => toast.error(error.message),
  });

  const indexMutation = useMutation({
    mutationFn: async (ids: string[] | "pending") => {
      if (ids === "pending") {
        await indexPending({ data: { brandId: brand!.id, limit: 8 } });
      } else {
        for (const id of ids) {
          await indexSource({ data: { brandId: brand!.id, sourceId: id, force: true } });
        }
      }
      await reproject({ data: { brandId: brand!.id } });
      await rebuildEntities({ data: { brandId: brand!.id } });
    },
    onSuccess: () => {
      toast.success("Kaynaklar indekslendi ve bilgi grafiği güncellendi");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addMutation = useMutation({
    mutationFn: () => addSources({ data: { brandId: brand!.id, items: [{ title: title.trim() || url.trim(), url: url.trim() }] } }),
    onSuccess: () => { setTitle(""); setUrl(""); invalidate(); },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeSource({ data: { id } }),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  if (!brand) {
    return (
      <>
        <PanelSubnav items={KNOWLEDGE_SUBNAV} />
        <PanelPageHeading meta={{ title: "Bilgi Bankası", description: "Önce bir marka ekleyin.", icon: BookOpen }} />
        <Card><CardContent className="py-10 text-center"><Button asChild><Link to="/app/onboarding">Markanı ekle</Link></Button></CardContent></Card>
      </>
    );
  }

  return (
    <>
      <PanelSubnav items={KNOWLEDGE_SUBNAV} />
      <PanelPageHeading
        hint={<><p>Buraya eklediğiniz sayfalar ve notlar, yapay zekanın markanız hakkında okuduğu <strong>kaynak dosyanızdır</strong>.</p><p>1) Site haritanızı veya önemli URL'leri ekleyin. 2) "İndeksle" deyin. 3) İçerik vektöre dönüşür ve ölçüm/üretim adımlarında kullanılır.</p></>}
        meta={{
          title: "Bilgi Bankası",
          description: "Yapay zeka cevaplarında kaynak gösterilmesini istediğiniz sayfalar. Ne kadar net, o kadar çok alıntı.",
          icon: BookOpen,
        }}
        action={
          <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={refreshMutation.isPending || data.length === 0}
            onClick={() => refreshMutation.mutate()}
          >
            {refreshMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
            Değişenleri tazele
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={indexMutation.isPending || data.length === 0}
            onClick={() => indexMutation.mutate("pending")}
          >
            {indexMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
            Bekleyenleri indeksle
          </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-end gap-2">
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Başlık (opsiyonel)" className="max-w-xs" />
        <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" className="max-w-md" />
        <Button onClick={() => addMutation.mutate()} disabled={!url.trim() || addMutation.isPending}>
          <Plus className="mr-1.5 h-4 w-4" /> Ekle
        </Button>
      </div>

      {candidates.length > 0 ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              Ölçümden gelen aday kaynaklar
            </div>
            <p className="text-xs text-muted-foreground">
              Yapay zekanın cevaplarında alıntıladığı, bilgi bankanızda henüz olmayan sayfalar. Ekleyince marka zekasına dahil olur.
            </p>
            <ul className="divide-y divide-border">
              {candidates.map((candidate) => (
                <li key={candidate.url} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{candidate.title}</span>
                    <a href={candidate.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-primary">
                      {candidate.domain} <ExternalLink className="h-3 w-3" />
                    </a>
                  </span>
                  <Badge variant="outline" className="shrink-0 text-[10px] font-normal">
                    {candidate.type === "own" ? "Sizin siteniz" : candidate.type === "competitor" ? "Rakip" : "Tarafsız"} · {candidate.count} atıf
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={promoteMutation.isPending}
                    onClick={() => promoteMutation.mutate({ url: candidate.url, title: candidate.title })}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Bilgi bankasına ekle
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…</p>
          ) : data.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Henüz kaynak yok. Kurulum sihirbazı site haritanızdan öneri çıkarabilir.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.map((source) => (
                <li key={source.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{source.title}</span>
                    {source.url ? (
                      <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-primary">
                        {source.url} <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </span>
                  <Badge variant="outline" className="shrink-0 text-[10px] font-normal">
                    {source.index_status === "hazir" ? `${source.chunk_count} parça indeksli` : source.index_status === "hata" ? "İçerik alınamadı" : "İndeks bekliyor"}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Kaynağı indeksle"
                    disabled={indexMutation.isPending}
                    onClick={() => indexMutation.mutate([source.id])}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="Kaynağı sil" onClick={() => deleteMutation.mutate(source.id)}>
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
