import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, ShieldAlert, Users } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockAdminOrgs, mockAdminUsage } from "@/lib/panel-mock/admin";

export const Route = createFileRoute("/_authenticated/app/admin")({
  head: () => ({
    meta: [
      { title: "Admin — OneCite Paneli" },
      { name: "description", content: "Organizasyonları, kullanım kotalarını ve hata loglarını yönetim ekranından izleyin." },
      { property: "og:title", content: "Admin — OneCite Paneli" },
      { property: "og:description", content: "Organizasyon, kullanım ve hata log yönetimi." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const statusBadge: Record<string, { label: string; className: string }> = {
  aktif: { label: "Aktif", className: "text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]" },
  askida: { label: "Askıya alındı", className: "text-destructive border-destructive/40" },
};

function AdminPage() {
  return (
    <>
      <PanelPageHeading meta={{ title: "Admin", description: "Organizasyonları, kullanım kotalarını ve sistem hatalarını yönetin.", icon: ShieldAlert }} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Organizasyon</p><p className="text-2xl font-semibold">{mockAdminUsage.totalOrgs}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Toplam marka</p><p className="text-2xl font-semibold">{mockAdminUsage.totalClients}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Bugünkü çalıştırma</p><p className="text-2xl font-semibold">{mockAdminUsage.totalRunsToday}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="orgs">
        <TabsList>
          <TabsTrigger value="orgs"><Users className="mr-1.5 h-3.5 w-3.5" /> Organizasyonlar</TabsTrigger>
          <TabsTrigger value="logs"><AlertCircle className="mr-1.5 h-3.5 w-3.5" /> Hata Logları</TabsTrigger>
        </TabsList>

        <TabsContent value="orgs" className="pt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Tüm Organizasyonlar</CardTitle>
              <CardDescription>{mockAdminOrgs.length} organizasyon</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Organizasyon</TableHead><TableHead>Plan</TableHead><TableHead>Marka</TableHead><TableHead>Üye</TableHead><TableHead>Durum</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {mockAdminOrgs.map((org) => {
                    const status = statusBadge[org.status]!;
                    return (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell><Badge variant="secondary">{org.plan}</Badge></TableCell>
                        <TableCell>{org.clients}</TableCell>
                        <TableCell>{org.members}</TableCell>
                        <TableCell><Badge variant="outline" className={status.className}>{status.label}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="pt-4">
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="h-5 w-5 text-[hsl(var(--chart-2))]" />
              Çözülmemiş bir hata kaydı yok.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
