import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Download, PenSquare, Sparkles } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockContentDrafts, mockContentGaps } from "@/lib/panel-mock/content";

export const Route = createFileRoute("/_authenticated/app/content")({
  head: () => ({
    meta: [
      { title: "İçerik Üretimi — OneCite Paneli" },
      { name: "description", content: "İçerik fırsatlarını inceleyin ve bilgi bankasına dayalı içerik taslakları üretin." },
      { property: "og:title", content: "İçerik Üretimi — OneCite Paneli" },
      { property: "og:description", content: "Content gap analizi ve taslak yönetimi." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ContentPage,
});

const impactTone: Record<string, string> = {
  yuksek: "text-destructive border-destructive/40",
  orta: "text-amber-600 dark:text-amber-400 border-amber-500/40",
  dusuk: "text-muted-foreground border-border",
};

const statusLabel: Record<string, string> = { taslak: "Taslak", incelemede: "İncelemede", yayinlandi: "Yayınlandı" };

function ContentPage() {
  return (
    <>
      <PanelPageHeading
        meta={{ title: "İçerik Üretimi", description: "Content gap → taslak: bilgi bankanıza dayalı içerik fırsatlarını yakalayın.", icon: PenSquare }}
        action={<Button variant="outline" size="sm"><Download className="mr-2 h-3.5 w-3.5" /> Tümünü Dışa Aktar</Button>}
      />

      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-6 md:flex-row">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PenSquare className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">İçerik Üretimi (Content Gap → Taslak)</p>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Prompt Discovery'de tespit edilen fırsat sorgularını Bilgi Bankası'ndaki gerçek içerikle
              karşılaştırır; kapsamı zayıf veya hiç olmayan sorguları önceliklendirir. Taslak üretimi
              sadece Bilgi Bankası alıntılarına ve Marka Zekası'na dayanır.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-6">
          <p className="flex items-center gap-1.5 text-sm font-medium"><Sparkles className="h-4 w-4" /> İçerik Fırsatları</p>
          <div className="space-y-2">
            {mockContentGaps.map((g) => (
              <div key={g.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{g.gap}</p>
                  <p className="text-xs text-muted-foreground">{g.cluster}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`gap-1 text-[10px] ${impactTone[g.impact]}`}><AlertTriangle className="h-3 w-3" /> {g.impact}</Badge>
                  <Button size="sm" variant="secondary"><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Taslak üret</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-6">
          <p className="text-sm font-medium">Taslaklar</p>
          <div className="space-y-2">
            {mockContentDrafts.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.title}</p>
                  <p className="truncate text-xs text-muted-foreground">Hedef: {d.targetPrompt} · {d.wordCount} kelime · {d.updatedAt}</p>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">{statusLabel[d.status]}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
