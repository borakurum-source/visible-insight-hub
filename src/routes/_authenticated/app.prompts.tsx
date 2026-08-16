import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListChecks, Plus, Search } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { FunnelStageBadge, SentimentPositionTag } from "@/components/app/panel-shared";
import { ActionStatusBadge } from "@/components/app/panel-shared";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockPrompts } from "@/lib/panel-mock/prompts";

export const Route = createFileRoute("/app/prompts")({
  head: () => ({
    meta: [
      { title: "Promptlar — OneCite Paneli" },
      { name: "description", content: "Takip edilen promptları, cluster ve huni aşamasına göre filtreleyip son ölçüm sonuçlarını inceleyin." },
      { property: "og:title", content: "Promptlar — OneCite Paneli" },
      { property: "og:description", content: "Takip edilen prompt listesi ve son ölçüm sonuçları." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PromptsPage,
});

function PromptsPage() {
  const [search, setSearch] = useState("");
  const [cluster, setCluster] = useState("all");
  const [funnelStage, setFunnelStage] = useState("all");

  const clusters = useMemo(() => Array.from(new Set(mockPrompts.map((p) => p.cluster))), []);

  const filtered = useMemo(() => {
    return mockPrompts.filter((p) => {
      if (cluster !== "all" && p.cluster !== cluster) return false;
      if (funnelStage !== "all" && p.funnelStage !== funnelStage) return false;
      if (search && !p.promptText.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [cluster, funnelStage, search]);

  return (
    <>
      <PanelPageHeading
        meta={{ title: "Promptlar", description: "Seçili domain için takip edilen prompt listesi ve son ölçüm sonuçları.", icon: ListChecks }}
        action={<Button size="sm"><Plus className="mr-2 h-3.5 w-3.5" /> Prompt Ekle</Button>}
      />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Prompt ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Select value={cluster} onValueChange={setCluster}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Cluster filtrele" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm cluster'lar</SelectItem>
              {clusters.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={funnelStage} onValueChange={setFunnelStage}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Huni aşaması" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm huni aşamaları</SelectItem>
              <SelectItem value="tofu">TOFU · Farkındalık</SelectItem>
              <SelectItem value="mofu">MOFU · Değerlendirme</SelectItem>
              <SelectItem value="bofu">BOFU · Karar</SelectItem>
            </SelectContent>
          </Select>
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} / {mockPrompts.length} prompt gösteriliyor</span>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px] px-3">Prompt</TableHead>
                <TableHead className="px-3">Cluster</TableHead>
                <TableHead className="px-2">Huni Aşaması</TableHead>
                <TableHead className="px-2">Mentioned</TableHead>
                <TableHead className="px-2">Cited</TableHead>
                <TableHead className="px-2">Runs</TableHead>
                <TableHead className="px-2">Rakip</TableHead>
                <TableHead className="px-2">Durum</TableHead>
                <TableHead className="px-2">Son Çalıştırma</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">Kriterlere uyan prompt bulunamadı.</TableCell></TableRow>
              )}
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="px-3 font-medium">
                    {p.promptText}
                    <SentimentPositionTag position={p.latestRun?.position ?? null} sentiment={p.latestRun?.sentiment ?? null} />
                  </TableCell>
                  <TableCell className="px-3"><Badge variant="secondary">{p.cluster}</Badge></TableCell>
                  <TableCell className="px-2"><FunnelStageBadge stage={p.funnelStage} /></TableCell>
                  <TableCell className="px-2">{p.latestRun ? (p.latestRun.mentioned ? "Evet" : "Hayır") : "—"}</TableCell>
                  <TableCell className="px-2">{p.latestRun ? (p.latestRun.cited ? "Evet" : "Hayır") : "—"}</TableCell>
                  <TableCell className="px-2">{p.totalRuns}</TableCell>
                  <TableCell className="px-2 text-xs text-muted-foreground">{p.latestRun?.competitorsFound.join(", ") || "—"}</TableCell>
                  <TableCell className="px-2"><ActionStatusBadge status={p.latestRun?.actionStatus ?? null} /></TableCell>
                  <TableCell className="px-2 text-xs text-muted-foreground">{p.latestRun?.timestamp ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
