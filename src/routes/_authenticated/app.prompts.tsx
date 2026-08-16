import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ListChecks, Loader2, Plus, Trash2 } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createPrompt, deletePrompt, listPrompts, setPromptStatus } from "@/lib/panel.functions";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/prompts")({
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
  const queryClient = useQueryClient();
  const fetchPrompts = useServerFn(listPrompts);
  const updateStatus = useServerFn(setPromptStatus);
  const addPrompt = useServerFn(createPrompt);
  const removePrompt = useServerFn(deletePrompt);
  const [filter, setFilter] = useState<string>("approved");
  const [draft, setDraft] = useState("");

  const key = ["prompts", brand?.id];
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: () => fetchPrompts({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: key });
    void queryClient.invalidateQueries({ queryKey: ["brand-overview", brand?.id] });
  };

  const statusMutation = useMutation({
    mutationFn: (input: { ids: string[]; status: string }) => updateStatus({ data: input }),
    onSuccess: invalidate,
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

  if (!brand) {
    return (
      <>
        <PanelPageHeading meta={{ title: "Promptlar", description: "Önce bir marka ekleyin.", icon: ListChecks }} />
        <Card><CardContent className="py-10 text-center"><Button asChild><Link to="/app/onboarding">Markanı ekle</Link></Button></CardContent></Card>
      </>
    );
  }

  return (
    <>
      <PanelPageHeading
        meta={{
          title: "Promptlar",
          description: "Yapay zekâ motorlarında görünmek istediğiniz sorular. Adayları onaylayın, kendi sorunuzu ekleyin.",
          icon: ListChecks,
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
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

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…</p>
          ) : visible.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Bu listede prompt yok.</p>
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((prompt) => (
                <li key={prompt.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                  <span className="min-w-0 flex-1">{prompt.text}</span>
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
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
