import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Plus, Settings2, Sparkles } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { PanelSubnav, WORKSPACE_SUBNAV } from "@/components/app/panel-subnav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createBrand, deleteBrand, updateBrand } from "@/lib/panel.functions";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/settings")({
  head: () => ({
    meta: [
      { title: "Marka Ayarları — OneCite Paneli" },
      { name: "description", content: "Marka adınızı, alan adınızı ve kurulum tercihlerinizi yönetin." },
      { property: "og:title", content: "Marka Ayarları — OneCite Paneli" },
      { property: "og:description", content: "Marka ayarlarınızı yönetin." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { brand, selectBrand } = useActiveBrand();
  const queryClient = useQueryClient();
  const save = useServerFn(updateBrand);
  const remove = useServerFn(deleteBrand);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");

  useEffect(() => { setName(brand?.name ?? ""); setDomain(brand?.domain ?? ""); }, [brand?.id, brand?.name, brand?.domain]);

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["panel-session"] });

  const saveMutation = useMutation({
    mutationFn: () => save({ data: { brandId: brand!.id, name, domain } }),
    onSuccess: () => { toast.success("Marka güncellendi"); invalidate(); },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => remove({ data: { brandId: brand!.id } }),
    onSuccess: () => { toast.success("Marka silindi"); invalidate(); },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!brand) {
    return (
      <>
        <PanelSubnav items={WORKSPACE_SUBNAV} />
        <PanelPageHeading meta={{ title: "Marka Ayarları", description: "Önce bir marka ekleyin.", icon: Settings2 }} />
        <NewBrandCard onCreated={selectBrand} />
      </>
    );
  }

  return (
    <>
      <PanelSubnav items={WORKSPACE_SUBNAV} />
      <PanelPageHeading
        meta={{ title: "Marka Ayarları", description: "Takip edilen markanın temel bilgileri.", icon: Settings2 }}
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/app/onboarding"><Sparkles className="mr-1.5 h-4 w-4" /> Kurulumu aç</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader><CardTitle className="text-base">Genel</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="settings-name">Marka adı</Label>
              <Input id="settings-name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-domain">Alan adı</Label>
              <Input id="settings-domain" value={domain} onChange={(event) => setDomain(event.target.value)} />
            </div>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Kaydet
          </Button>
        </CardContent>
      </Card>

      <NewBrandCard onCreated={selectBrand} />

      <Card>
        <CardHeader><CardTitle className="text-base text-destructive">Tehlikeli bölge</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Markayı silmek promptları, bilgi kaynaklarını ve raporları da kalıcı olarak siler.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleteMutation.isPending}>Markayı sil</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{brand.name} silinsin mi?</AlertDialogTitle>
                <AlertDialogDescription>Bu işlem geri alınamaz.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteMutation.mutate()}>Sil</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </>
  );
}
