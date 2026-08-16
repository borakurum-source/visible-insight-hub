import { createFileRoute } from "@tanstack/react-router";
import { Compass, ExternalLink, ShieldAlert } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockCitationSources } from "@/lib/panel-mock/discovery";

export const Route = createFileRoute("/app/citation-discovery")({
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
        {mockCitationSources.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <a href={`https://${item.domain}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm font-medium hover:underline">
                    {item.domain} <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                  {!item.mentionsBrand && (
                    <Badge variant="destructive" className="gap-1 text-[10px]"><ShieldAlert className="h-3 w-3" /> Marka geçmiyor</Badge>
                  )}
                  <Badge variant="outline" className="text-[10px]">Otorite {item.authorityScore}</Badge>
                </div>
                <p className="line-clamp-1 text-xs text-muted-foreground">{item.title}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-semibold tabular-nums">{item.citedInPrompts}</p>
                <p className="text-xs text-muted-foreground">{item.lastSeen}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
