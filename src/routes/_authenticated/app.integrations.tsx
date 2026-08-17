import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BarChart3, CheckCircle2, Globe2, LogIn, Plug, RefreshCw, Search, Unplug } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { PanelSubnav, WORKSPACE_SUBNAV } from "@/components/app/panel-subnav";
import { QueryEmpty, QuerySkeleton } from "@/components/app/panel-query-states";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useActiveBrand } from "@/lib/use-panel";
import {
  connectGa4Property,
  connectGscProperty,
  connectBingSite,
  disconnectBing,
  disconnectGoogleAccount,
  disconnectIntegration,
  getBingStatus,
  getGoogleAccount,
  getIntegrations,
  listBingSiteOptions,
  listGa4PropertyOptions,
  listGscProperties,
  saveBingApiKey,
  startGoogleConnect,
  syncBing,
  syncGa4,
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
  const fetchGa4Properties = useServerFn(listGa4PropertyOptions);
  const saveGa4Property = useServerFn(connectGa4Property);
  const runGa4Sync = useServerFn(syncGa4);
  const fetchGoogleAccount = useServerFn(getGoogleAccount);
  const beginGoogleConnect = useServerFn(startGoogleConnect);
  const removeGoogleAccount = useServerFn(disconnectGoogleAccount);
  const fetchBing = useServerFn(getBingStatus);
  const storeBingKey = useServerFn(saveBingApiKey);
  const fetchBingSites = useServerFn(listBingSiteOptions);
  const saveBingSite = useServerFn(connectBingSite);
  const runBingSync = useServerFn(syncBing);
  const removeBing = useServerFn(disconnectBing);
  const [bingKey, setBingKey] = useState("");
  const [bingCandidates, setBingCandidates] = useState<string[] | null>(null);
  const [candidates, setCandidates] = useState<string[] | null>(null);
  const [ga4Candidates, setGa4Candidates] = useState<Array<{ propertyId: string; displayName: string; account: string }> | null>(null);

  const integrations = useQuery({
    queryKey: ["integrations", brand?.id],
    queryFn: () => fetchIntegrations({ data: { brandId: brand!.id } }),
    enabled: !!brand?.id,
  });

  const googleAccount = useQuery({
    queryKey: ["google-account", brand?.id],
    queryFn: () => fetchGoogleAccount({ data: { brandId: brand!.id } }),
    enabled: !!brand?.id,
  });

  // Google izin ekranindan donen mesaji goster.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("google");
    if (!status) return;
    const message = params.get("message") ?? "";
    if (status === "connected") toast.success(message || "Google hesabınız bağlandı");
    else toast.error(message || "Google bağlantısı tamamlanamadı");
    window.history.replaceState({}, "", window.location.pathname);
    void googleAccount.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectGoogle = useMutation({
    mutationFn: () => beginGoogleConnect({ data: { brandId: brand!.id, origin: window.location.origin } }),
    onSuccess: (result) => {
      window.location.href = result.url;
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const unlinkGoogle = useMutation({
    mutationFn: () => removeGoogleAccount({ data: { brandId: brand!.id } }),
    onSuccess: async () => {
      toast.success("Google hesabı kaldırıldı.");
      await googleAccount.refetch();
      await queryClient.invalidateQueries({ queryKey: ["integrations", brand?.id] });
    },
    onError: (error: Error) => toast.error(error.message),
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

  const loadGa4 = useMutation({
    mutationFn: () => fetchGa4Properties({ data: { brandId: brand!.id } }),
    onSuccess: (list) => {
      if (!list.length) {
        toast.error("Google Analytics bağlantısı bulunamadı. Google hesabınızı bağlayın, ardından mülkleri tekrar yükleyin.");
        return;
      }
      setGa4Candidates(list);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const chooseGa4 = useMutation({
    mutationFn: (propertyId: string) => saveGa4Property({ data: { brandId: brand!.id, propertyId } }),
    onSuccess: async () => {
      setGa4Candidates(null);
      await invalidate();
      ga4Sync.mutate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const ga4Sync = useMutation({
    mutationFn: () => runGa4Sync({ data: { brandId: brand!.id } }),
    onSuccess: async (result) => {
      toast.success(`GA4 verisi güncellendi (${result.sessions} oturum).`);
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const gsc = integrations.data?.connections.find((c) => c.provider === "gsc") ?? null;
  const ga4 = integrations.data?.connections.find((c) => c.provider === "ga4") ?? null;
  const ga4Snapshot = integrations.data?.ga4Snapshot ?? null;
  const snapshot = integrations.data?.gscSnapshot ?? null;

  return (
    <>
      <PanelSubnav items={WORKSPACE_SUBNAV} />
      <PanelPageHeading
        meta={{ title: "Entegrasyonlar", description: "Google Search Console ve analiz bağlantılarınızı yönetin.", icon: Plug }}
      />

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/50">
                <LogIn className="h-4.5 w-4.5" />
              </div>
              <CardTitle className="text-sm">Adım 1 · Google hesabı</CardTitle>
            </div>
            {googleAccount.data?.connected ? (
              <Badge variant="outline" className="gap-1 border-success/40 text-success">
                <CheckCircle2 className="h-3 w-3" /> {googleAccount.data.email ?? "Bağlı"}
              </Badge>
            ) : (
              <Badge variant="secondary">Bağlı değil</Badge>
            )}
          </div>
          <CardDescription className="pt-1">
            Önce hesabınıza tek seferlik yetki verirsiniz. Ardından aşağıdaki adım 2 kartlarında hangi Search Console ve
            Analytics mülkünün okunacağını seçersiniz. Her marka kendi hesabını bağlar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {googleAccount.data?.connected ? (
            <>
              <Button variant="outline" size="sm" disabled={connectGoogle.isPending} onClick={() => connectGoogle.mutate()}>
                Yeniden yetkilendir
              </Button>
              <Button variant="ghost" size="sm" disabled={unlinkGoogle.isPending} onClick={() => unlinkGoogle.mutate()}>
                <Unplug className="mr-1.5 h-3.5 w-3.5" /> Bağlantıyı kaldir
              </Button>
            </>
          ) : (
            <Button size="sm" disabled={!brand || connectGoogle.isPending} onClick={() => connectGoogle.mutate()}>
              {connectGoogle.isPending ? "Yonlendiriliyor…" : "Google hesabımı bağla"}
            </Button>
          )}
        </CardContent>
        {googleAccount.data?.redirectUri ? (
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              Google izin ekranında <strong>redirect_uri_mismatch</strong> hatası alırsanız, Google Cloud Console →
              Kimlik bilgileri → OAuth istemcisi → “Yetkili yönlendirme URI’leri” alanına şu adresi ekleyin:
            </p>
            <code className="mt-2 block break-all rounded-md border border-border bg-muted/40 px-2 py-1.5 font-mono text-[11px]">
              {googleAccount.data.redirectUri}
            </code>
          </CardContent>
        ) : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/50">
                  <Search className="h-4.5 w-4.5" />
                </div>
                <CardTitle className="text-sm">Adım 2 · Search Console mülkü</CardTitle>
              </div>
              {gsc?.status === "bağlı" ? (
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
              <Button
                size="sm"
                className="w-full"
                disabled={!brand || !googleAccount.data?.connected || loadProperties.isPending}
                onClick={() => loadProperties.mutate()}
              >
                {loadProperties.isPending
                  ? "Mülkler alınıyor…"
                  : googleAccount.data?.connected
                    ? "Mülk seç"
                    : "Önce Google hesabınızı bağlayın"}
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

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/50">
                  <BarChart3 className="h-4.5 w-4.5" />
                </div>
                <CardTitle className="text-sm">Adım 2 · Analytics 4 mülkü</CardTitle>
              </div>
              {ga4?.status === "bağlı" ? (
                <Badge variant="outline" className="gap-1 border-success/40 text-success"><CheckCircle2 className="h-3 w-3" /> Bağlı</Badge>
              ) : ga4?.status === "hata" ? (
                <Badge variant="destructive">Hata</Badge>
              ) : (
                <Badge variant="secondary">Bağlı değil</Badge>
              )}
            </div>
            <CardDescription className="pt-1">
              {ga4?.property_id ? `Mülk ${ga4.property_id}` : "Site trafiğinizi yapay zeka görünürlüğüyle karşılaştırın."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {ga4?.last_error ? <p className="text-xs text-destructive">{ga4.last_error}</p> : null}
            {ga4?.property_id ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Son senkronizasyon: {ga4.last_sync_at ? new Date(ga4.last_sync_at).toLocaleString("tr-TR") : "—"}
                  {ga4Snapshot ? ` · ${ga4Snapshot.totals.sessions} oturum / ${ga4Snapshot.totals.users} kullanıcı` : ""}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" disabled={ga4Sync.isPending} onClick={() => ga4Sync.mutate()}>
                    <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${ga4Sync.isPending ? "animate-spin" : ""}`} /> Senkronize et
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove.mutate("ga4")}><Unplug className="h-3.5 w-3.5" /></Button>
                </div>
              </>
            ) : (
              <Button
                size="sm"
                className="w-full"
                disabled={!brand || !googleAccount.data?.connected || loadGa4.isPending}
                onClick={() => loadGa4.mutate()}
              >
                {loadGa4.isPending
                  ? "Mülkler alınıyor…"
                  : googleAccount.data?.connected
                    ? "Mülk seç"
                    : "Önce Google hesabınızı bağlayın"}
              </Button>
            )}
            {ga4Candidates ? (
              <div className="space-y-1.5 rounded-md border border-border p-2">
                <p className="text-xs text-muted-foreground">Kullanılacak GA4 mülkünü seçin:</p>
                {ga4Candidates.map((property) => (
                  <Button
                    key={property.propertyId}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs"
                    disabled={chooseGa4.isPending}
                    onClick={() => chooseGa4.mutate(property.propertyId)}
                  >
                    {property.displayName}
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">{property.propertyId}</span>
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
