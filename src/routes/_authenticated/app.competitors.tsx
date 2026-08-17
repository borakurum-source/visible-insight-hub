import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Swords } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { PanelSubnav, VISIBILITY_SUBNAV } from "@/components/app/panel-subnav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompetitorFinder } from "@/components/app/competitor-finder";
import { getCompetitorInsights } from "@/lib/panel.functions";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/competitors")({
  head: () => ({
    meta: [
      { title: "Rakip Takibi — OneCite Paneli" },
      { name: "description", content: "Yapay zeka yanıtlarında sizin yerinize çıkan markaları bulun ve takip edin." },
      { property: "og:title", content: "Rakip Takibi — OneCite Paneli" },
      { property: "og:description", content: "Yanıtlarda one çıkan rakipleri izleyin." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CompetitorsPage,
});

function CompetitorsPage() {
  const { brand } = useActiveBrand();
  const fetchInsights = useServerFn(getCompetitorInsights);
  const { data } = useQuery({
    queryKey: ["competitor-insights", brand?.id],
    queryFn: () => fetchInsights({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
  });

  if (!brand) {
    return (
      <>
        <PanelPageHeading meta={{ title: "Rakip Takibi", description: "Önce bir marka ekleyin.", icon: Swords }} />
        <Card><CardContent className="py-10 text-center"><Button asChild><Link to="/app/onboarding">Markani ekle</Link></Button></CardContent></Card>
      </>
    );
  }

  return (
    <>
      <PanelPageHeading
        hint={
          <>
            <p>Yapay zeka yanıtlarında markanız yerine hangi firmaların kaynak gösterildiğini burada görürsünüz.</p>
            <p>Aşağıdaki listeden bir alan adını takibe alın; sonraki ölçümlerde bu markalarla karşılaştırılırsınız.</p>
          </>
        }
        meta={{
          title: "Rakip Takibi",
          description: "Ölçüm sonuçlarında one çıkan markaları keşfedin, takibe alın ve karşılaştırın.",
          icon: Swords,
        }}
      />
      <PanelSubnav items={VISIBILITY_SUBNAV} />

      <CompetitorFinder brandId={brand.id} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Sorgu sonuclarindan çıkan adaylar</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data?.suggestions.length ? (
            <ul className="divide-y divide-border text-sm">
              {data.suggestions.map((row) => (
                <li key={row.domain} className="flex items-center gap-3 px-4 py-2">
                  <span className="min-w-0 flex-1 truncate font-mono text-xs">{row.domain}</span>
                  <span className="text-[11px] text-muted-foreground">{row.mentions} kez kaynak gosterildi</span>
                  {row.tracked ? (
                    <span className="text-[11px] text-chart-2">takipte</span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">yukaridaki alandan ekleyin</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              Henüz ölçüm kaynağı yok. Ölçümü calistirdiginizda yanıtlarda geçen siteler burada listelenir.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
