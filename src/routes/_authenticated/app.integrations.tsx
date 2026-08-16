import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BarChart3, CheckCircle2, Globe2, Plug, RefreshCw, Search, Unplug } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { PanelSubnav, WORKSPACE_SUBNAV } from "@/components/app/panel-subnav";
import { QueryEmpty, QuerySkeleton } from "@/components/app/panel-query-states";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useActiveBrand } from "@/lib/use-panel";
import {
  connectGscProperty,
  disconnectIntegration,
  getIntegrations,
  listGscProperties,
  syncGsc,
} from "@/lib/integrations.functions";

export const Route = createFileRoute("/_authenticated/app/integrations")({
  head: () => ({
    meta: [
      { title: "Entegrasyonlar — OneCite Paneli" },
      { name: "description", content: "Google Search Console, GA4 ve webhook entegrasyonlarını yönetin, trafik verilerini izleyin." },
      { property: "og:title", content: "Entegrasyonlar — OneCite Paneli" },
      { property: "og:description", content: "GSC/GA4 bağlantı durumu ve trafik özetleri." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const { brand } = useActiveBrand();
  const queryClient = useQueryClient();
  const fetchIntegrations = useServerFn(getIntegrations);
  const fetchProperties = useServerFn(listGscProperties);
  const saveProperty = useServerFn(connectGscProperty);
  const runSync = useServerFn(syncGsc);
  const disconnect = useServerFn(disconnectIntegration);
  const [candidates, setCandidates] = useState<string[] | null>(null);

  const integrations = useQuery({
    queryKey: ["integrations", brand?.id],
    queryFn: () => fetchIntegrations({ data: { brandId: brand!.id } }),
    enabled: !!brand?.id,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["integrations", brand?.id] });

  const loadProperties = useMutation({
    mutationFn: () => fetchProperties({ data: { brandId: brand!.id } }),
    onSuccess: (result) => {
      const list = result.matching.length ? result.matching : result.all;
      if (!list.length) {
        toast.error("Bağlı Google hesabında doğrulanmış mülk bulunamadı.");
        return;
      }
      setCandidates(list);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const choose = useMutation({
    mutationFn: (siteUrl: string) => saveProperty({ data: { brandId: brand!.id, siteUrl } }),
    onSuccess: async () => {
      setCandidates(null);
      await invalidate();
      sync.mutate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const sync = useMutation({
    mutationFn: () => runSync({ data: { brandId: brand!.id } }),
    onSuccess: async (result) => {
      toast.success(`Search Console verisi güncellendi (${result.queries} sorgu).`);
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (provider: string) => disconnect({ data: { brandId: brand!.id, provider } }),
    onSuccess: invalidate,
  });

  const gsc = integrations.data?.connections.find((c) => c.provider === "gsc") ?? null;
  const snapshot = integrations.data?.gscSnapshot ?? null;

  return (
    <>
      <PanelSubnav items={WORKSPACE_SUBNAV} />
      <PanelPageHeading
        meta={{ title: "Entegrasyonlar", description: "Google Search Console ve analiz bağlantılarınızı yönetin.", icon: Plug }}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/50">
                  <Search className="h-4.5 w-4.5" />
                </div>
                <CardTitle className="text-sm">Google Search Console</CardTitle>
              </div>
              {gsc?.status === "bagli" ? (
                <Badge variant="outline" className="gap-1 border-success/40 text-success"><CheckCircle2 className="h-3 w-3" /> Bağlı</Badge>
              ) : gsc?.status === "hata" ? (
                <Badge variant="destructive">Hata</Badge>
              ) : (
                <Badge variant="secondary">Bağlı değil</Badge>
              )}
            </div>
            <CardDescription className="pt-1">{gsc?.property_id ?? brand?.domain ?? "Marka seçin"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {gsc?.last_error ? <p className="text-xs text-destructive">{gsc.last_error}</p> : null}
            {gsc?.property_id ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Son senkronizasyon: {gsc.last_sync_at ? new Date(gsc.last_sync_at).toLocaleString("tr-TR") : "—"}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" disabled={sync.isPending} onClick={() => sync.mutate()}>
                    <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${sync.isPending ? "animate-spin" : ""}`} /> Senkronize et
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove.mutate("gsc")}><Unplug className="h-3.5 w-3.5" /></Button>
                </div>
              </>
            ) : (
              <Button size="sm" className="w-full" disabled={!brand || loadProperties.isPending} onClick={() => loadProperties.mutate()}>
                {loadProperties.isPending ? "Mülkler alınıyor…" : "Bağlan"}
              </Button>
            )}
            {candidates ? (
              <div className="space-y-1.5 rounded-md border border-border p-2">
                <p className="text-xs text-muted-foreground">Kullanılacak mülkü seçin:</p>
                {candidates.map((siteUrl) => (
                  <Button
                    key={siteUrl}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                    disabled={choose.isPending}
                    onClick={() => choose.mutate(siteUrl)}
                  >
                    {siteUrl}
                  </Button>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="opacity-70">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/50">
                <BarChart3 className="h-4.5 w-4.5" />
              </div>
              <CardTitle className="text-sm">Google Analytics 4</CardTitle>
            </div>
            <CardDescription className="pt-1">Hazırlanıyor — Search Console bağlantısından sonra açılır.</CardDescription>
          </CardHeader>
          <CardContent><Badge variant="secondary">Yakında</Badge></CardContent>
        </Card>

        <Card className="opacity-70">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/50">
                <Globe2 className="h-4.5 w-4.5" />
              </div>
              <CardTitle className="text-sm">Webhook</CardTitle>
            </div>
            <CardDescription className="pt-1">Otomasyon bağlantısı için planlandı.</CardDescription>
          </CardHeader>
          <CardContent><Badge variant="secondary">Yakında</Badge></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Search Console Sorguları</CardTitle>
          <CardDescription>
            {snapshot
              ? `${snapshot.startDate} – ${snapshot.endDate} · ${snapshot.totals.clicks} tıklama, ${snapshot.totals.impressions} gösterim`
              : "Bağlantı kurulduğunda gerçek arama verisi burada listelenir."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {integrations.isLoading ? (
            <QuerySkeleton />
          ) : !snapshot || !snapshot.queries.length ? (
            <QueryEmpty title="Henüz veri yok" description="Search Console mülkünü bağlayıp senkronize edin." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sorgu</TableHead>
                  <TableHead className="text-right">Tıklama</TableHead>
                  <TableHead className="text-right">Gösterim</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Pozisyon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.queries.slice(0, 25).map((q) => (
                  <TableRow key={q.query}>
                    <TableCell className="font-medium">{q.query}</TableCell>
                    <TableCell className="text-right">{q.clicks}</TableCell>
                    <TableCell className="text-right">{q.impressions}</TableCell>
                    <TableCell className="text-right">%{(q.ctr * 100).toFixed(1)}</TableCell>
                    <TableCell className="text-right">{q.position}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
