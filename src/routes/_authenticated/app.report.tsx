import { createFileRoute } from "@tanstack/react-router";
import { FileBarChart, Printer } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockReportSummary } from "@/lib/panel-mock/report";
import { mockClusterStats } from "@/lib/panel-mock/overview";
import { activeBrand } from "@/lib/panel-mock/clients";

export const Route = createFileRoute("/_authenticated/app/report")({
  head: () => ({
    meta: [
      { title: "Rapor — OneCite Paneli" },
      { name: "description", content: "Görünürlük skorunu, cluster performansını ve öncelikli fırsatları içeren deterministik rapor şablonu." },
      { property: "og:title", content: "Rapor — OneCite Paneli" },
      { property: "og:description", content: "Yazdırılabilir görünürlük ve kanıt raporu." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  return (
    <>
      <PanelPageHeading
        meta={{ title: "Rapor", description: "Mevcut ölçüm verilerinden deterministik olarak üretilen yazdırılabilir rapor.", icon: FileBarChart }}
        action={<Button size="sm" onClick={() => window.print()}><Printer className="mr-2 h-3.5 w-3.5" /> Yazdır / PDF olarak kaydet</Button>}
      />

      <div className="space-y-8 print:space-y-6">
        <div className="space-y-1 border-b border-border pb-4">
          <h2 className="text-xl font-semibold">{activeBrand.name}</h2>
          <p className="text-sm text-muted-foreground">{activeBrand.domain} · Dönem: {mockReportSummary.period}</p>
        </div>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Genel Bakış</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Görünürlük Skoru</p><p className="text-2xl font-semibold">{mockReportSummary.visibilityScore}</p><p className="text-xs text-[hsl(var(--chart-2))]">{mockReportSummary.visibilityDelta}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Bahsedilme Oranı</p><p className="text-2xl font-semibold">%{Math.round(mockReportSummary.mentionRate * 100)}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Alıntılanma Oranı</p><p className="text-2xl font-semibold">%{Math.round(mockReportSummary.citedRate * 100)}</p></CardContent></Card>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Konu Kümesi Bazlı Görünürlük</h3>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Cluster</TableHead><TableHead className="text-right">Takip Edilen</TableHead><TableHead className="text-right">Ölçülen</TableHead><TableHead className="text-right">Görünürlük %</TableHead><TableHead className="text-right">Atıf %</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {mockClusterStats.map((c) => (
                <TableRow key={c.cluster}>
                  <TableCell className="font-medium">{c.cluster}</TableCell>
                  <TableCell className="text-right">{c.total}</TableCell>
                  <TableCell className="text-right">{c.measured}</TableCell>
                  <TableCell className="text-right">%{Math.round(c.mentionRate * 100)}</TableCell>
                  <TableCell className="text-right">%{Math.round(c.citedRate * 100)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Kazanımlar</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {mockReportSummary.topWins.map((w) => <li key={w}>{w}</li>)}
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Riskler</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {mockReportSummary.topRisks.map((r) => <li key={r}><Badge variant="outline" className="mr-2 text-[10px] text-destructive border-destructive/40">Risk</Badge>{r}</li>)}
          </ul>
        </section>

        <p className="border-t border-border pt-4 text-xs text-muted-foreground">
          Bu rapor, gerçek zamanlı ölçümlerden deterministik olarak üretilmiştir; LLM yorumu veya tahmini içermez.
        </p>
      </div>
    </>
  );
}
