import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BookOpen, ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addKnowledgeSources, deleteKnowledgeSource, listKnowledgeSources } from "@/lib/panel.functions";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/knowledge-base")({
  head: () => ({
    meta: [
      { title: "Bilgi Bankası — OneCite Paneli" },
      { name: "description", content: "Yapay zekânın kaynak göstermesini istediğiniz sayfaları yönetin." },
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
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const key = ["knowledge-sources", brand?.id];
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: () => fetchSources({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: key });
    void queryClient.invalidateQueries({ queryKey: ["brand-overview", brand?.id] });
  };

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
        <PanelPageHeading meta={{ title: "Bilgi Bankası", description: "Önce bir marka ekleyin.", icon: BookOpen }} />
        <Card><CardContent className="py-10 text-center"><Button asChild><Link to="/app/onboarding">Markanı ekle</Link></Button></CardContent></Card>
      </>
    );
  }

  return (
    <>
      <PanelPageHeading
        meta={{
          title: "Bilgi Bankası",
          description: "Yapay zekâ cevaplarında kaynak gösterilmesini istediğiniz sayfalar. Ne kadar net, o kadar çok alıntı.",
          icon: BookOpen,
        }}
      />

      <div className="flex flex-wrap items-end gap-2">
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Başlık (opsiyonel)" className="max-w-xs" />
        <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" className="max-w-md" />
        <Button onClick={() => addMutation.mutate()} disabled={!url.trim() || addMutation.isPending}>
          <Plus className="mr-1.5 h-4 w-4" /> Ekle
        </Button>
      </div>

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
