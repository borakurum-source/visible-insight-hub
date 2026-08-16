import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LayoutDashboard, ListChecks, BookOpen, ShieldCheck, Quote, Activity, Sparkles } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getBrandOverview } from "@/lib/panel.functions";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      { title: "Komuta Merkezi — OneCite Paneli" },
      { name: "description", content: "Marka görünürlüğünüzün, promptlarınızın ve kanıt varlıklarınızın canlı özeti." },
      { property: "og:title", content: "Komuta Merkezi — OneCite Paneli" },
      { property: "og:description", content: "AI görünürlüğünüzün canlı özeti." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { brand } = useActiveBrand();
  const fetchOverview = useServerFn(getBrandOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["brand-overview", brand?.id],
    queryFn: () => fetchOverview({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
  });

  const stats = [
    { label: "Onaylı prompt", value: data?.approvedPrompts ?? 0, icon: ListChecks, to: "/app/prompts" },
    { label: "Bilgi kaynağı", value: data?.knowledgeSources ?? 0, icon: BookOpen, to: "/app/knowledge-base" },
    { label: "Marka iddiası", value: data?.claims ?? 0, icon: ShieldCheck, to: "/app/claims" },
    { label: "Alıntı", value: data?.citations ?? 0, icon: Quote, to: "/app/report" },
  ] as const;

  return (
    <>
      <PanelPageHeading
        meta={{
          title: "Komuta Merkezi",
          description: brand ? `${brand.name} · ${brand.domain}` : "Başlamak için bir marka ekleyin.",
          icon: LayoutDashboard,
        }}
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/app/onboarding"><Sparkles className="mr-1.5 h-4 w-4" /> Kurulum</Link>
          </Button>
        }
      />

      {!brand ? (
        <Card>
          <CardContent className="space-y-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">Henüz bir marka eklemediniz.</p>
            <Button asChild><Link to="/app/onboarding">Markanı ekle</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map(({ label, value, icon: Icon, to }) => (
              <Link key={label} to={to} className="group">
                <Card className="h-full transition-colors group-hover:border-primary/40">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </CardHeader>
                  <CardContent>
                    <p className="font-display text-2xl font-semibold">{isLoading ? "—" : value}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0">
              <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
              <CardTitle className="text-base">Görünürlük</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data && data.runs > 0 ? (
                <>
                  <p className="font-display text-3xl font-semibold">%{data.mentionRate}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.runs} yapay zekâ yanıtının {Math.round((data.mentionRate / 100) * data.runs)} tanesinde markanız geçiyor.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Henüz tarama yapılmadı. Onaylı promptlarınız ilk tarama turunda çalıştırılacak.
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/app/prompts">Promptları gör</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
