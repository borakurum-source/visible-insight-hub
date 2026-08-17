import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileBarChart, Printer } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { PanelSubnav, VISIBILITY_SUBNAV } from "@/components/app/panel-subnav";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QuerySkeleton, QueryEmpty } from "@/components/app/panel-query-states";
import { ScoreBreakdown } from "@/components/app/score-breakdown";
import { getMeasurementState, listCitationSources } from "@/lib/panel.functions";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/report")({
  head: () => ({
    meta: [
      { title: "Rapor — OneCite Paneli" },
      { name: "description", content: "Görünürlük skorunuzu, skor kırılımını ve kaynak dağılımını içeren yazdırılabilir rapor." },
      { property: "og:title", content: "Rapor — OneCite Paneli" },
      { property: "og:description", content: "Yazdırılabilir görünürlük ve kanıt raporu." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { brand } = useActiveBrand();
  const fetchState = useServerFn(getMeasurementState);
  const fetchSources = useServerFn(listCitationSources);

  const { data, isLoading } = useQuery({
    queryKey: ["measurement-state", brand?.id],
    queryFn: () => fetchState({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
  });
  const { data: sources } = useQuery({
    queryKey: ["citation-sources", brand?.id],
    queryFn: () => fetchSources({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
  });

  return (
    <>
      <PanelSubnav items={VISIBILITY_SUBNAV} />
      <PanelPageHeading
        meta={{ title: "Rapor", description: "Ölçüm verilerinizden deterministik olarak üretilen yazdırılabilir rapor.", icon: FileBarChart }}
        action={<Button size="sm" onClick={() => window.print()}><Printer className="mr-2 h-3.5 w-3.5" /> Yazdır / PDF</Button>}
      />

      {!brand ? (
        <QueryEmpty title="Önce bir marka ekleyin." />
      ) : isLoading ? (
        <QuerySkeleton rows={4} />
      ) : (
        <div className="space-y-8 print:space-y-6">
          <div className="space-y-1 border-b border-border pb-4">
            <h2 className="text-xl font-semibold">{brand.name}</h2>
            <p className="text-sm text-muted-foreground">
              {brand.domain} · Rapor tarihi: {new Date().toLocaleDateString("tr-TR")}
            </p>
          </div>

          <ScoreBreakdown
            total={data?.score.total ?? 0}
            components={data?.score.components ?? []}
            runs={data?.totalRuns ?? 0}
            lastRunAt={data?.batch?.finished_at ?? null}
          />

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Kaynak Dağılımı</h3>
            {sources && sources.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alan adı</TableHead>
                    <TableHead className="text-right">Kaynak gösterimi</TableHead>
                    <TableHead className="text-right">Tür</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.slice(0, 15).map((s) => (
                    <TableRow key={s.domain}>
                      <TableCell className="font-medium">{s.domain}</TableCell>
                      <TableCell className="text-right">{s.count}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {s.isOwn ? "Kendi siteniz" : "Üçüncü taraf"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <QueryEmpty title="Henüz kaynak verisi yok." description="Bir ölçüm turu çalıştırdığınızda kaynaklar burada listelenir." />
            )}
          </section>

          <p className="border-t border-border pt-4 text-xs text-muted-foreground">
            Bu rapor, ölçüm turlarında toplanan gerçek yanıt verilerinden deterministik olarak hesaplanmıştır.
          </p>
        </div>
      )}
    </>
  );
}
