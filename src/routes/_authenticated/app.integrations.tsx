import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, CheckCircle2, Globe2, Plug, RefreshCw, Search, Unplug } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { PanelSubnav } from "@/components/app/panel-subnav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockGscQueries, mockIntegrations } from "@/lib/panel-mock/integrations";

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

const iconMap: Record<string, typeof Search> = { gsc: Search, ga4: BarChart3, webhook: Globe2 };

function IntegrationsPage() {
  return (
    <>
      <PanelSubnav items={[{ to: "/app/settings", label: "Ayarlar" }, { to: "/app/integrations", label: "Entegrasyonlar" }, { to: "/app/account", label: "Hesabım" }, { to: "/app/pricing", label: "Fiyatlandırma" }]} />
      <PanelPageHeading
        meta={{ title: "Entegrasyonlar", description: "Google Search Console, GA4 ve webhook bağlantılarınızı yönetin.", icon: Plug }}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {mockIntegrations.map((integration) => {
          const Icon = iconMap[integration.id] ?? Plug;
          const connected = integration.status === "bagli";
          return (
            <Card key={integration.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/50">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <CardTitle className="text-sm">{integration.name}</CardTitle>
                  </div>
                  {connected ? (
                    <Badge variant="outline" className="gap-1 border-[hsl(var(--chart-2))] text-[hsl(var(--chart-2))]"><CheckCircle2 className="h-3 w-3" /> Bağlı</Badge>
                  ) : (
                    <Badge variant="secondary">Bağlı değil</Badge>
                  )}
                </div>
                <CardDescription className="pt-1">{integration.detail}</CardDescription>
              </CardHeader>
              <CardContent>
                {connected ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Son senkronizasyon: {integration.lastSync}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1"><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Senkronize et</Button>
                      <Button variant="ghost" size="sm"><Unplug className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" className="w-full">Bağlan</Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Search Console Sorguları</CardTitle>
          <CardDescription>Prompt bazlı eşleştirmeyle birlikte en yüksek trafikli sorgular.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sorgu</TableHead>
                <TableHead className="text-right">Tıklama</TableHead>
                <TableHead className="text-right">Gösterim</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">Pozisyon</TableHead>
                <TableHead>Prompt Bağlantısı</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockGscQueries.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">{q.query}</TableCell>
                  <TableCell className="text-right">{q.clicks}</TableCell>
                  <TableCell className="text-right">{q.impressions}</TableCell>
                  <TableCell className="text-right">%{(q.ctr * 100).toFixed(1)}</TableCell>
                  <TableCell className="text-right">{q.position}</TableCell>
                  <TableCell>{q.promptLinked ? <Badge variant="outline" className="text-xs">Bağlı</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
