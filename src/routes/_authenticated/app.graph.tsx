import { lazy, Suspense, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, RefreshCw, Search, Waypoints } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { PanelSubnav, KNOWLEDGE_SUBNAV } from "@/components/app/panel-subnav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { EntityGraph } from "@/components/app/entity-graph";
import { getKnowledgeGraph, rebuildGraphEntities, rebuildVectorMap, searchKnowledge } from "@/lib/kb.functions";
import { useActiveBrand } from "@/lib/use-panel";
import type { VectorPoint } from "@/components/app/vector-map-3d";

const VectorMap3D = lazy(() => import("@/components/app/vector-map-3d"));

export const Route = createFileRoute("/_authenticated/app/graph")({
  head: () => ({
    meta: [
      { title: "Bilgi Grafiği — OneCite Paneli" },
      { name: "description", content: "Bilgi bankanızın vektör uzayındaki 3B haritası: güçlü konu kümeleri ve kanıt boşlukları." },
      { property: "og:title", content: "Bilgi Grafiği — OneCite Paneli" },
      { property: "og:description", content: "Marka zekânızın vektör haritası." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GraphPage,
});

const TYPE_LABEL: Record<string, string> = {
  url: "Web sayfası",
  manual: "Manuel not",
  sss: "SSS",
  pdf: "PDF",
  sitemap: "Site haritası",
};

const ENTITY_COLORS: Record<string, string> = {
  marka: "#f59e0b",
  hizmet: "#38bdf8",
  kitle: "#22c55e",
  rakip: "#ef4444",
  konu: "#a855f7",
};

function GraphPage() {
  const { brand } = useActiveBrand();
  const queryClient = useQueryClient();
  const fetchGraph = useServerFn(getKnowledgeGraph);
  const reproject = useServerFn(rebuildVectorMap);
  const rebuildEntities = useServerFn(rebuildGraphEntities);
  const [selected, setSelected] = useState<VectorPoint | null>(null);
  const runSearch = useServerFn(searchKnowledge);
  const [query, setQuery] = useState("");
  const search = useMutation({
    mutationFn: (value: string) => runSearch({ data: { brandId: brand!.id, query: value } }),
    onError: (error: Error) => toast.error(error.message),
  });

  const key = ["knowledge-graph", brand?.id];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => fetchGraph({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
  });

  const rebuild = useMutation({
    mutationFn: async () => {
      await reproject({ data: { brandId: brand!.id } });
      await rebuildEntities({ data: { brandId: brand!.id } });
    },
    onSuccess: () => {
      toast.success("Grafik yeniden hesaplandı");
      void queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!brand) {
    return (
      <>
        <PanelSubnav items={KNOWLEDGE_SUBNAV} />
        <PanelPageHeading meta={{ title: "Bilgi Grafiği", description: "Önce bir marka ekleyin.", icon: Waypoints }} />
        <Card><CardContent className="py-10 text-center"><Button asChild><Link to="/app/onboarding">Markanı ekle</Link></Button></CardContent></Card>
      </>
    );
  }

  const points = (data?.points ?? []) as VectorPoint[];
  const entities = data?.entities ?? [];
  const edges = data?.edges ?? [];
  const entityByKey = new Map(entities.map((e) => [e.key, e]));

  return (
    <>
      <PanelSubnav items={KNOWLEDGE_SUBNAV} />
      <PanelPageHeading
        meta={{
          title: "Bilgi Grafiği",
          description: "Bilgi bankanızdaki her parça bir vektöre dönüşür. Yakın noktalar benzer konulardır; seyrek bölgeler kanıt boşluğudur.",
          icon: Waypoints,
        }}
        action={
          <Button size="sm" variant="outline" onClick={() => rebuild.mutate()} disabled={rebuild.isPending}>
            {rebuild.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
            Yeniden hesapla
          </Button>
        }
      />

      <Tabs defaultValue="vector">
        <TabsList>
          <TabsTrigger value="vector">3D Vektör Haritası</TabsTrigger>
          <TabsTrigger value="entities">Varlık Ağı</TabsTrigger>
          <TabsTrigger value="retrieval">Geri Getirme Testi</TabsTrigger>
        </TabsList>

        <TabsContent value="vector" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
            <Card>
              <CardHeader className="flex flex-col gap-2 space-y-0 pb-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Vektör Uzayı · {points.length} bilgi parçası</CardTitle>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {Object.entries(TYPE_LABEL).map(([type, label]) => (
                    <span key={type} className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `rgb(${(({ url: "56,189,248", manual: "168,85,247", sss: "34,197,94", pdf: "249,115,22", sitemap: "96,165,250" })[type])})` }} />
                      {label}
                    </span>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="flex h-[440px] items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Vektörler yükleniyor…
                  </p>
                ) : points.length < 3 ? (
                  <div className="flex h-[440px] flex-col items-center justify-center gap-3 text-center">
                    <p className="max-w-sm text-sm text-muted-foreground">
                      Harita için en az birkaç indekslenmiş kaynak gerekiyor. Bilgi Bankası'na sayfa ekleyip indeksleyin.
                    </p>
                    <Button asChild size="sm"><Link to="/app/knowledge-base">Bilgi Bankası'na git</Link></Button>
                  </div>
                ) : (
                  <ClientOnly fallback={<div className="h-[440px] animate-pulse rounded-lg bg-muted/40" />}>
                    <Suspense fallback={<div className="h-[440px] animate-pulse rounded-lg bg-muted/40" />}>
                      <VectorMap3D points={points} selectedId={selected?.id ?? null} onSelect={setSelected} />
                    </Suspense>
                  </ClientOnly>
                )}
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader className="pb-2"><CardTitle className="text-base">Seçili parça</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {selected ? (
                  <>
                    <Badge variant="outline" className="text-[10px]">{TYPE_LABEL[selected.type] ?? selected.type}</Badge>
                    <p className="font-medium">{selected.sourceTitle}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{selected.excerpt}…</p>
                    <p className="text-[11px] text-muted-foreground">Tazelik: %{Math.round(selected.freshness * 100)} · Ağırlık: {selected.weight}</p>
                    {selected.sourceUrl ? (
                      <a href={selected.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline underline-offset-2">
                        Kaynağı aç
                      </a>
                    ) : null}
                    <Button asChild size="sm" variant="secondary" className="w-full">
                      <Link to="/app/content">Bu konuda içerik üret</Link>
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Haritadan bir nokta seçin. Sürükleyerek döndürebilir, tekerlekle yakınlaşabilirsiniz.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">İndeks durumu</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {(data?.sources ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz kaynak yok.</p>
              ) : (
                (data?.sources ?? []).map((source) => (
                  <Badge key={source.id} variant="outline" className="text-[11px] font-normal">
                    {source.title} · {source.status === "hazir" ? `${source.chunkCount} parça` : source.status}
                  </Badge>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entities" className="mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Varlık İlişki Haritası</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {entities.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Varlıklar marka zekânızdan üretilir. "Yeniden hesapla" ile oluşturabilirsiniz.
                </p>
              ) : (
                <>
                  <EntityGraph entities={entities} edges={edges} />
                  <div className="flex flex-wrap gap-2">
                    {entities.map((entity) => (
                      <span
                        key={entity.key}
                        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
                        style={{ borderColor: ENTITY_COLORS[entity.entity_type] ?? "#94a3b8", color: ENTITY_COLORS[entity.entity_type] ?? "#94a3b8" }}
                      >
                        {entity.label}
                      </span>
                    ))}
                  </div>
                  <div className="space-y-1.5 border-t border-border pt-4">
                    {edges.map((edge, index) => (
                      <p key={index} className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{entityByKey.get(edge.source_key)?.label ?? edge.source_key}</span>
                        {" "}— {edge.relation} →{" "}
                        <span className="font-medium text-foreground">{entityByKey.get(edge.target_key)?.label ?? edge.target_key}</span>
                      </p>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="retrieval" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Bilgi bankası geri getirme (RAG)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                İçerik üretimi ve boşluk analizi tam olarak bu adımı kullanır: sorunuz vektöre çevrilir ve
                bilgi bankanızdaki en yakın parçalar getirilir. Buradan neyin bulunduğunu görebilirsiniz.
              </p>
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={(event) => { event.preventDefault(); if (query.trim()) search.mutate(query.trim()); }}
              >
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Örn. kurumsal müşteriler için fiyatlandırma nasıl?" />
                <Button type="submit" disabled={search.isPending || !query.trim()}>
                  {search.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Search className="mr-1.5 h-4 w-4" />}
                  Ara
                </Button>
              </form>
              {search.data ? (
                search.data.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Eşleşme yok — bu konuda bilgi bankanızda kanıt eksik.</p>
                ) : (
                  <ul className="space-y-2">
                    {search.data.map((match) => (
                      <li key={match.id} className="rounded-md border border-border p-3">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="text-xs font-medium">{match.sourceTitle}</span>
                          <Badge variant="outline" className="text-[10px]">Benzerlik %{match.similarity}</Badge>
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">{match.content}…</p>
                      </li>
                    ))}
                  </ul>
                )
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
