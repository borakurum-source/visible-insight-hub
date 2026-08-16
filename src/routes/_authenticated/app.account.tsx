import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { LogOut, Loader2, UserRound } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { updateProfile } from "@/lib/panel.functions";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/account")({
  head: () => ({
    meta: [
      { title: "Hesabım — OneCite Paneli" },
      { name: "description", content: "Profil bilgilerinizi güncelleyin ve oturumunuzu yönetin." },
      { property: "og:title", content: "Hesabım — OneCite Paneli" },
      { property: "og:description", content: "Profil ve oturum ayarları." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { profile, isAdmin, brands } = useActiveBrand();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const save = useServerFn(updateProfile);
  const [fullName, setFullName] = useState("");

  useEffect(() => { setFullName(profile?.full_name ?? ""); }, [profile?.full_name]);

  const saveMutation = useMutation({
    mutationFn: () => save({ data: { fullName: fullName.trim() } }),
    onSuccess: () => { toast.success("Profil güncellendi"); void queryClient.invalidateQueries({ queryKey: ["panel-session"] }); },
    onError: (error: Error) => toast.error(error.message),
  });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <>
      <PanelPageHeading meta={{ title: "Hesabım", description: "Profil bilgileriniz ve oturum yönetimi.", icon: UserRound }} />

      <Card>
        <CardHeader><CardTitle className="text-base">Profil</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="account-name">Ad soyad</Label>
              <Input id="account-name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account-email">E-posta</Label>
              <Input id="account-email" value={profile?.email ?? ""} readOnly disabled />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Kaydet
            </Button>
            <Badge variant={isAdmin ? "default" : "secondary"}>{isAdmin ? "Yönetici" : "Üye"}</Badge>
            <span className="text-xs text-muted-foreground">{brands.length} marka</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Oturum</CardTitle></CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-1.5 h-4 w-4" /> Çıkış yap
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
