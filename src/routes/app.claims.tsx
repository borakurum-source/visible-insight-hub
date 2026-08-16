import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BrainCircuit, Check, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockClaims } from "@/lib/panel-mock/claims";

export const Route = createFileRoute("/app/claims")({
  head: () => ({
    meta: [
      { title: "Marka İddiaları — OneCite Paneli" },
      { name: "description", content: "Marka iddialarını onaylayın ve ajan hafızasına kalıcı marka notları ekleyin." },
      { property: "og:title", content: "Marka İddiaları — OneCite Paneli" },
      { property: "og:description", content: "Kanonik iddia onayı ve ajan hafızası yönetimi." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClaimsPage,
});

const statusLabel: Record<string, { label: string; className: string }> = {
  dogrulandi: { label: "Doğrulandı", className: "text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]" },
  beklemede: { label: "Beklemede", className: "text-[hsl(var(--chart-5))] border-[hsl(var(--chart-5))]" },
  reddedildi: { label: "Reddedildi", className: "text-destructive border-destructive/40" },
};

function ClaimsPage() {
  const [memoryText, setMemoryText] = useState("");
  const [memories, setMemories] = useState([
    { id: 1, text: "Artık düğün fotoğrafçılığı sunmuyoruz.", active: true },
    { id: 2, text: "Her zaman aynı gün teslimatı vurgula.", active: true },
  ]);

  return (
    <>
      <PanelPageHeading
        meta={{ title: "Marka İddiaları", description: "Kanonik iddiaları onaylayın ve ajan hafızasına kalıcı notlar ekleyin.", icon: ShieldCheck }}
      />

      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-6 md:flex-row">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Marka İddiaları &amp; Ajan Hafızası</p>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Curator otomatik olarak bilgi bankasındaki chunk'ları aynı iddiaya göre gruplar; burada
              çelişen veya eskiyen versiyonlar arasından tek bir kanonik metni onaylarsınız.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="claims">
        <TabsList>
          <TabsTrigger value="claims"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Marka İddiaları</TabsTrigger>
          <TabsTrigger value="memories"><BrainCircuit className="mr-1.5 h-3.5 w-3.5" /> Ajan Hafızası</TabsTrigger>
        </TabsList>

        <TabsContent value="claims" className="space-y-3 pt-4">
          {mockClaims.map((c) => {
            const status = statusLabel[c.status]!;
            return (
              <Card key={c.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">{c.statement}</p>
                    <Badge variant="outline" className={`shrink-0 text-xs ${status.className}`}>{status.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Kaynak: {c.source} · {c.usedInAnswers} cevapta kullanıldı</p>
                  {c.status === "beklemede" && (
                    <div className="flex justify-end"><Button size="sm"><Check className="mr-1.5 h-3.5 w-3.5" /> Kanonik Olarak Onayla</Button></div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="memories" className="space-y-4 pt-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-medium">Yeni not ekle</p>
              <Textarea rows={2} placeholder="Örn: Artık düğün fotoğrafçılığı sunmuyoruz." value={memoryText} onChange={(e) => setMemoryText(e.target.value)} />
              <div className="flex justify-end">
                <Button size="sm" disabled={!memoryText.trim()} onClick={() => { setMemories((m) => [...m, { id: Date.now(), text: memoryText, active: true }]); setMemoryText(""); }}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Ekle
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-2">
            {memories.map((m) => (
              <Card key={m.id}>
                <CardContent className="flex items-center justify-between gap-3 p-3">
                  <p className={`flex-1 text-sm ${m.active ? "" : "text-muted-foreground line-through"}`}>{m.text}</p>
                  <div className="flex shrink-0 items-center gap-2">
                    <Switch checked={m.active} onCheckedChange={(checked) => setMemories((ms) => ms.map((x) => x.id === m.id ? { ...x, active: checked } : x))} />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMemories((ms) => ms.filter((x) => x.id !== m.id))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
