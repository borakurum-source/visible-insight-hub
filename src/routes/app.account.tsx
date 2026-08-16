import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CheckCircle2, Mail, UserCog, XCircle } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { mockUsage } from "@/lib/panel-mock/pricing";

export const Route = createFileRoute("/app/account")({
  head: () => ({
    meta: [
      { title: "Hesabım — OneCite Paneli" },
      { name: "description", content: "Plan kullanımınızı, açık özelliklerinizi ve destek seçeneklerinizi görüntüleyin." },
      { property: "og:title", content: "Hesabım — OneCite Paneli" },
      { property: "og:description", content: "Plan, kullanım ve destek bilgileri." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

const FEATURES = [
  { label: "Bilgi Bankası", enabled: true },
  { label: "Bilgi Grafiği", enabled: true },
  { label: "GSC / GA4 Entegrasyonu", enabled: true },
  { label: "White-label Domain", enabled: false },
];

function AccountPage() {
  return (
    <>
      <PanelPageHeading meta={{ title: "Hesabım", description: "Plan kullanımınızı ve açık özelliklerinizi görüntüleyin.", icon: UserCog }} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">Plan <Badge variant="secondary">{mockUsage.planLabel}</Badge></CardTitle>
          <CardDescription>Geçerli planınız.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Markalar</span>
              <span>{mockUsage.usage.clients} / {mockUsage.limits.maxClients}</span>
            </div>
            <Progress value={Math.min(100, (mockUsage.usage.clients / mockUsage.limits.maxClients) * 100)} />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-1 text-sm text-muted-foreground">
            <div>Marka başına en fazla prompt: {mockUsage.limits.maxPromptsPerClient}</div>
            <div>Marka başına en fazla rakip: {mockUsage.limits.maxCompetitorsPerClient}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Plan Özellikleri</CardTitle>
          <CardDescription>Planınızda açık/kapalı olan modüller.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {FEATURES.map((f) => (
            <div key={f.label} className="flex items-center justify-between py-1.5 text-sm">
              <span>{f.label}</span>
              {f.enabled ? (
                <span className="flex items-center gap-1 text-[hsl(var(--chart-2))]"><CheckCircle2 className="h-4 w-4" /> Açık</span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground"><XCircle className="h-4 w-4" /> Kapalı</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm"><ArrowUpRight className="h-4 w-4" /> Planı yükselt veya değiştir</CardTitle>
          <CardDescription>Planınızı dilediğiniz zaman kendi başınıza yükseltebilir veya değiştirebilirsiniz.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild><Link to="/app/pricing">Planı Değiştir</Link></Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4" /> Destek</CardTitle>
          <CardDescription>Faturalandırma, hesap veya teknik sorularınız için bizimle iletişime geçin.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Button asChild variant="outline"><a href="mailto:info@onecite.com">Bize Ulaşın</a></Button>
        </CardContent>
      </Card>
    </>
  );
}
