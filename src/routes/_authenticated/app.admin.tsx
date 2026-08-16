import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldAlert } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminListBrands } from "@/lib/panel.functions";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/admin")({
  head: () => ({
    meta: [
      { title: "Yönetim — OneCite Paneli" },
      { name: "description", content: "Platformdaki tüm markaların ve kurulum durumlarının yönetici görünümü." },
      { property: "og:title", content: "Yönetim — OneCite Paneli" },
      { property: "og:description", content: "Yönetici görünümü." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, isLoading: sessionLoading } = useActiveBrand();
  const fetchBrands = useServerFn(adminListBrands);
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: () => fetchBrands(),
    enabled: isAdmin,
  });

  if (!sessionLoading && !isAdmin) {
    return (
      <>
        <PanelPageHeading meta={{ title: "Yönetim", description: "Bu sayfaya erişim yetkiniz yok.", icon: ShieldAlert }} />
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Yalnızca yöneticiler görüntüleyebilir.</CardContent></Card>
      </>
    );
  }

  return (
    <>
      <PanelPageHeading meta={{ title: "Yönetim", description: "Platformdaki tüm markalar ve kurulum durumları.", icon: ShieldAlert }} />
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…</p>
          ) : data.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Henüz marka yok.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.map((brand) => (
                <li key={brand.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{brand.name}</span>
                    <span className="block font-mono text-xs text-muted-foreground">{brand.domain}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{brand.memberCount} üye</span>
                  <Badge variant={brand.onboarding_completed ? "default" : "secondary"}>
                    {brand.onboarding_completed ? "Kurulum tamam" : "Kurulumda"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(brand.created_at).toLocaleDateString("tr-TR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
