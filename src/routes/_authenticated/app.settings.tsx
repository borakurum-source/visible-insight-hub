import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Globe2, Moon, Plus, Settings, Star, Trash2 } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmAction } from "@/components/app/confirm-action";
import { activeBrand, activeDomains } from "@/lib/panel-mock/clients";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Ayarlar — OneCite Paneli" },
      { name: "description", content: "Marka domainlerini, görünüm tercihlerini ve profil bilgilerini yönetin." },
      { property: "og:title", content: "Ayarlar — OneCite Paneli" },
      { property: "og:description", content: "Domain yönetimi, tema ve profil ayarları." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [dark, setDark] = useState(false);
  const [newDomain, setNewDomain] = useState("");

  return (
    <>
      <PanelPageHeading meta={{ title: "Ayarlar", description: "Marka domainlerinizi, görünümü ve profil bilgilerinizi yönetin.", icon: Settings }} />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Genel</TabsTrigger>
          <TabsTrigger value="profile">Profil</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm"><Globe2 className="h-4 w-4" /> Marka domainleri</CardTitle>
              <CardDescription>Bir marka birden fazla domain içerebilir. Birincil domain varsayılan ölçüm bağlamıdır.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                <div>
                  <p className="text-sm font-semibold">{activeBrand.name}</p>
                  <p className="text-xs text-muted-foreground">{activeDomains.length} aktif domain</p>
                </div>
                <Badge variant="secondary">Marka çalışma alanı</Badge>
              </div>

              <div className="divide-y rounded-lg border border-border">
                {activeDomains.map((domain) => (
                  <div key={domain.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      {domain.isPrimary ? <Star className="h-4 w-4 shrink-0 fill-primary text-primary" /> : <Globe2 className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{domain.domain}</p>
                        <p className="text-xs text-muted-foreground">{domain.isPrimary ? "Birincil domain" : "Bağlı domain"} · Pazar: {domain.targetMarkets.join(", ")} · Dil: {domain.primaryLanguage}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {!domain.isPrimary && <Button variant="outline" size="sm">Birincil yap</Button>}
                      <ConfirmAction
                        trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></Button>}
                        title="Domain silinsin mi?"
                        description={`${domain.domain} kalıcı olarak silinecek.`}
                        onConfirm={() => {}}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
                <div className="min-w-[220px] flex-1 space-y-1.5">
                  <Label htmlFor="add-domain">Domain</Label>
                  <Input id="add-domain" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="ornek.com" />
                </div>
                <Button disabled={!newDomain.trim()}><Plus className="mr-2 h-4 w-4" /> Domain Ekle</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm"><Moon className="h-4 w-4" /> Görünüm</CardTitle>
              <CardDescription>Tema tercihi bu oturum için geçerlidir.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex max-w-sm items-center justify-between">
                <Label htmlFor="dark-mode-switch" className="text-sm">Koyu tema</Label>
                <Switch id="dark-mode-switch" checked={dark} onCheckedChange={setDark} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Profil</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Profil bilgileri hesap sağlayıcınız üzerinden yönetilir.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
