import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, FileText, Globe, Plus, RefreshCw, Search, Sparkles, Trash2, Upload } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { KpiCard } from "@/components/app/panel-shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmAction } from "@/components/app/confirm-action";
import { mockKbSummary, mockKbSources, mockBrandFacts, type MockKbSource } from "@/lib/panel-mock/knowledge-base";

export const Route = createFileRoute("/_authenticated/app/knowledge-base")({
  head: () => ({
    meta: [
      { title: "Bilgi Bankası — OneCite Paneli" },
      { name: "description", content: "Marka kaynaklarını yönetin, bilgi bankası sağlığını izleyin ve marka zekasını görüntüleyin." },
      { property: "og:title", content: "Bilgi Bankası — OneCite Paneli" },
      { property: "og:description", content: "Kaynak yönetimi, arama ve marka zekası özeti tek ekranda." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: KnowledgeBasePage,
});

const typeIcon: Record<MockKbSource["type"], typeof FileText> = { sayfa: Globe, pdf: FileText, sss: FileText, manuel: Upload };
const statusLabel: Record<MockKbSource["status"], { label: string; className: string }> = {
  guncel: { label: "Güncel", className: "text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]" },
  eski: { label: "Eski", className: "text-destructive border-destructive/40" },
  isleniyor: { label: "İşleniyor", className: "text-[hsl(var(--chart-5))] border-[hsl(var(--chart-5))]" },
};

function KnowledgeBasePage() {
  const [search, setSearch] = useState("");
  const [sourceToDelete, setSourceToDelete] = useState<MockKbSource | null>(null);

  return (
    <>
      <PanelPageHeading
        meta={{ title: "Bilgi Bankası", description: "Marka kaynaklarınızı yönetin ve bilgi bankası sağlığını izleyin.", icon: Sparkles }}
        action={<Button size="sm"><Plus className="mr-2 h-3.5 w-3.5" /> Kaynak Ekle</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={<Sparkles className="h-4 w-4" />} label="Sağlık skoru" value={`${mockKbSummary.score}/100`} />
        <KpiCard icon={<FileText className="h-4 w-4" />} label="Kaynak sayısı" value={String(mockKbSummary.sourceCount)} sub={`${mockKbSummary.pageCount} sayfa`} />
        <KpiCard icon={<CheckCircle2 className="h-4 w-4" />} label="Parça sayısı" value={String(mockKbSummary.chunkCount)} sub={`%${mockKbSummary.embeddedPct} vektörlenmiş`} />
        <KpiCard icon={<RefreshCw className="h-4 w-4" />} label="Eski kaynaklar" value={String(mockKbSummary.staleSourceCount)} />
      </div>

      <Tabs defaultValue="sources">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted/60 p-1 sm:grid-cols-4">
          <TabsTrigger value="sources">Kaynaklar</TabsTrigger>
          <TabsTrigger value="search">Arama</TabsTrigger>
          <TabsTrigger value="brand">Marka Zekası</TabsTrigger>
          <TabsTrigger value="audit">Sayfa Denetimi</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-3 pt-4">
          <div className="space-y-2">
            {mockKbSources.map((s) => {
              const Icon = typeIcon[s.type];
              const status = statusLabel[s.status];
              return (
                <Card key={s.id}>
                  <CardContent className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{s.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{s.url} · {s.chunkCount} parça · {s.updatedAt}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${status.className}`}>{status.label}</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSourceToDelete(s)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-3 pt-4">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Bilgi bankasında ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <p className="text-sm text-muted-foreground">Arama sonuçları semantik + lexical hibrit sıralamayla gösterilir.</p>
        </TabsContent>

        <TabsContent value="brand" className="space-y-3 pt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Marka Özeti</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">{mockBrandFacts.brandSummary}</p>
              <div><p className="text-xs text-muted-foreground">Hizmetler</p><p>{mockBrandFacts.services.join(", ")}</p></div>
              <div><p className="text-xs text-muted-foreground">USP</p><p>{mockBrandFacts.usp}</p></div>
              <div><p className="text-xs text-muted-foreground">Hedef kitle</p><p>{mockBrandFacts.targetAudience}</p></div>
              <div><p className="text-xs text-muted-foreground">Ton</p><p>{mockBrandFacts.tone}</p></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-3 pt-4">
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Sayfa/GEO denetimi henüz çalıştırılmadı. Kaynak eklendikçe otomatik hesaplanacak.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmAction
        trigger={<span />}
        title="Kaynak silinsin mi?"
        description={`"${sourceToDelete?.title ?? ""}" kalıcı olarak silinecek.`}
        onConfirm={() => setSourceToDelete(null)}
      />
    </>
  );
}
