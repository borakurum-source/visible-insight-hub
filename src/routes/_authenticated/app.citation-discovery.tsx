import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Compass, ExternalLink, Loader2, ShieldAlert } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listCitationSources } from "@/lib/panel.functions";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/citation-discovery")({
  head: () => ({
    meta: [
      { title: "Kaynak Keşfi — OneCite Paneli" },
      { name: "description", content: "AI cevaplarında en sık kaynak gösterilen üçüncü taraf siteleri keşfedin ve otorite fırsatlarını belirleyin." },
      { property: "og:title", content: "Kaynak Keşfi — OneCite Paneli" },
      { property: "og:description", content: "Ölçüm geçmişindeki en sık kaynak gösterilen domainler." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CitationDiscoveryPage,
});

function CitationDiscoveryPage() {
  const { brand } = useActiveBrand();
  const fetchSources = useServerFn(listCitationSources);
  const { data = [], isLoading } = useQuery({
    queryKey: ["citation-sources", brand?.id],
    queryFn: () => fetchSources({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
  });

  if (!brand) {
    return (
      <>
        <PanelPageHeading meta={{ title: "Kaynak Keşfi", description: "Önce bir marka ekleyin.", icon: Compass }} />
        <Card><CardContent className="py-10 text-center"><Button asChild><Link to="/app/onboarding">Markanı ekle</Link></Button></CardContent></Card>
      </>
    );
  }

  return (
    <>
      <PanelPageHeading
        meta={{
          title: "Kaynak Keşfi",
          description: "AI cevaplarında en sık kaynak gösterilen üçüncü taraf siteler — dış otorite çalışması için somut hedefler.",
          icon: Compass,
        }}
      />

      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-6 md:flex-row">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Compass className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Kaynak Keşfi</p>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Seçili domain için ölçülen prompt çalıştırmalarında AI'nın en sık kaynak gösterdiği üçüncü
              taraf siteler. Bu sitelerde yer almak veya onlarla işbirliği aramak, AI cevaplarındaki
              görünürlüğü artırma ihtimalini yükseltir.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {isLoading ? (
          <Card><CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Kaynaklar yükleniyor…</CardContent></Card>
        ) : null}
        {!isLoading && data.length === 0 ? (
          <Card>
            <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
              <p>Henüz ölçüm yok — kaynak listesi ilk prompt çalıştırmasından sonra dolar.</p>
              <Button asChild size="sm"><Link to="/app/prompts">Prompt setini gözden geçir</Link></Button>
            </CardContent>
          </Card>
        ) : null}
        {data.map((item) => (
          <Card key={item.domain}>
            <CardContent className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <a href={`https://${item.domain}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm font-medium hover:underline">
                    {item.domain} <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                  {item.isOwn ? (
                    <Badge variant="outline" className="text-[10px]">Kendi domaininiz</Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1 text-[10px]"><ShieldAlert className="h-3 w-3" /> Üçüncü taraf</Badge>
                  )}
                </div>
                <p className="line-clamp-1 font-mono text-xs text-muted-foreground">{item.sampleUrl}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-semibold tabular-nums">{item.count}</p>
                <p className="text-xs text-muted-foreground">{new Date(item.lastSeen).toLocaleDateString("tr-TR")}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
