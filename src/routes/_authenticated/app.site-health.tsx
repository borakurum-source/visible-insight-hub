import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Copy, Loader2, RefreshCw, RotateCcw, ShieldCheck } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { ACTIONS_SUBNAV, PanelSubnav } from "@/components/app/panel-subnav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listSiteHealthFindings,
  listSiteHealthPages,
  reopenSiteHealthFinding,
  resolveSiteHealthFinding,
  runSiteHealthAudit,
} from "@/lib/site-health.functions";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/site-health")({
  head: () => ({
    meta: [
      { title: "Site Sağlığı — OneCite Paneli" },
      {
        name: "description",
        content: "Sitenizin teknik SEO ve AEO sağlığını tarayın, bulguları görün ve düzeltin.",
      },
      { property: "og:title", content: "Site Sağlığı — OneCite Paneli" },
      {
        property: "og:description",
        content: "Teknik ve AEO taraması, sayfa bazlı skorlar ve düzeltilebilir bulgular.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SiteHealthPage,
});

const CATEGORY_LABEL: Record<string, string> = { technical: "Teknik", aeo: "AEO" };
const SEVERITY_LABEL: Record<string, string> = { high: "Yüksek", medium: "Orta", low: "Düşük" };
const SEVERITY_VARIANT: Record<string, "destructive" | "outline" | "secondary"> = {
  high: "destructive",
  medium: "outline",
  low: "secondary",
};

function buildCopyPrompt(finding: {
  title: string;
  detection: string;
  recommendation: string;
  affected_entities: Array<{ url: string }> | null;
}) {
  const url =
    Array.isArray(finding.affected_entities) && finding.affected_entities[0]?.url
      ? String(finding.affected_entities[0].url)
      : "";
  return `Şu SEO/AEO sorununu düzelt:\n\nSayfa: ${url}\nSorun: ${finding.title}\nTespit: ${finding.detection}\nÖnerilen çözüm: ${finding.recommendation}`;
}

function SiteHealthPage() {
  const { brand } = useActiveBrand();
  const queryClient = useQueryClient();
  const fetchPages = useServerFn(listSiteHealthPages);
  const fetchFindings = useServerFn(listSiteHealthFindings);
  const runAudit = useServerFn(runSiteHealthAudit);
  const resolve = useServerFn(resolveSiteHealthFinding);
  const reopen = useServerFn(reopenSiteHealthFinding);

  const pagesKey = ["site-health-pages", brand?.id];
  const findingsKey = ["site-health-findings", brand?.id];

  const pages = useQuery({
    queryKey: pagesKey,
    queryFn: () => fetchPages({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
  });
  const findings = useQuery({
    queryKey: findingsKey,
    queryFn: () => fetchFindings({ data: { brandId: brand!.id } }),
    enabled: Boolean(brand?.id),
  });

  const auditMutation = useMutation({
    mutationFn: () => runAudit({ data: { brandId: brand!.id } }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: pagesKey });
      void queryClient.invalidateQueries({ queryKey: findingsKey });
      toast.success(
        `${result.pagesAudited} sayfa tarandı · ${result.findingsOpened} yeni bulgu, ${result.findingsResolved} bulgu düzeldi.`,
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const resolveMutation = useMutation({
    mutationFn: (findingId: string) => resolve({ data: { findingId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: findingsKey });
      toast.success("Bulgu düzeltildi olarak işaretlendi.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reopenMutation = useMutation({
    mutationFn: (findingId: string) => reopen({ data: { findingId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: findingsKey });
      toast.success("Bulgu yeniden açıldı.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!brand) {
    return (
      <>
        <PanelSubnav items={ACTIONS_SUBNAV} />
        <PanelPageHeading
          meta={{
            title: "Site Sağlığı",
            description: "Önce bir marka ekleyin.",
            icon: ShieldCheck,
          }}
        />
        <Card>
          <CardContent className="py-10 text-center">
            <Button asChild>
              <Link to="/app/onboarding">Markanı ekle</Link>
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const pageRows = pages.data ?? [];
  const technicalAvg = pageRows.length
    ? Math.round(pageRows.reduce((sum, p) => sum + p.technical_score, 0) / pageRows.length)
    : null;
  const aeoAvg = pageRows.length
    ? Math.round(pageRows.reduce((sum, p) => sum + p.aeo_score, 0) / pageRows.length)
    : null;

  const findingRows = findings.data ?? [];
  const openFindings = findingRows.filter((f) => f.status === "open");
  const resolvedFindings = findingRows.filter((f) => f.status !== "open");

  const copyPrompt = (finding: (typeof findingRows)[number]) => {
    const text = buildCopyPrompt(finding);
    navigator.clipboard?.writeText(text).then(() => toast.info("Panoya kopyalandı"));
  };

  return (
    <>
      <PanelSubnav items={ACTIONS_SUBNAV} />
      <PanelPageHeading
        meta={{
          title: "Site Sağlığı",
          description:
            "Teknik SEO ve AEO taraması — sayfalarınızı yapay zekaların rahat okuyabileceği şekle getirin.",
          icon: ShieldCheck,
        }}
        action={
          <Button onClick={() => auditMutation.mutate()} disabled={auditMutation.isPending}>
            {auditMutation.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-4 w-4" />
            )}
            Yeniden Tara
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Teknik Skor</CardTitle>
          </CardHeader>
          <CardContent>
            {pages.isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <p className="font-display text-5xl font-semibold leading-none tracking-tight">
                {technicalAvg ?? "—"}
                <span className="ml-1 text-base font-normal text-muted-foreground">/ 100</span>
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">AEO Skor</CardTitle>
          </CardHeader>
          <CardContent>
            {pages.isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <p className="font-display text-5xl font-semibold leading-none tracking-tight">
                {aeoAvg ?? "—"}
                <span className="ml-1 text-base font-normal text-muted-foreground">/ 100</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Açık Bulgular</h2>
        {findings.isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…
          </p>
        ) : openFindings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Açık bulgu yok. “Yeniden Tara” ile sitenizi kontrol edin.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {openFindings.map((finding) => (
              <Card key={finding.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={SEVERITY_VARIANT[finding.severity ?? "low"] ?? "outline"}>
                      {SEVERITY_LABEL[finding.severity ?? ""] ?? finding.severity ?? "—"}
                    </Badge>
                    <Badge variant="outline">
                      {CATEGORY_LABEL[finding.category ?? ""] ?? finding.category ?? "—"}
                    </Badge>
                    <p className="text-sm font-semibold">{finding.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{finding.detection}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveMutation.mutate(finding.id)}
                      disabled={resolveMutation.isPending}
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      Düzeltildi olarak işaretle
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => copyPrompt(finding)}>
                      <Copy className="mr-1.5 h-4 w-4" />
                      Prompt kopyala
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {resolvedFindings.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Düzeltilmiş Bulgular</h2>
          <div className="space-y-2">
            {resolvedFindings.map((finding) => (
              <Card key={finding.id} className="border-border/60 bg-muted/20">
                <CardContent className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {SEVERITY_LABEL[finding.severity ?? ""] ?? finding.severity ?? "—"}
                    </Badge>
                    <Badge variant="outline">
                      {CATEGORY_LABEL[finding.category ?? ""] ?? finding.category ?? "—"}
                    </Badge>
                    <p className="text-sm font-medium text-muted-foreground line-through">
                      {finding.title}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => reopenMutation.mutate(finding.id)}
                    disabled={reopenMutation.isPending}
                  >
                    <RotateCcw className="mr-1.5 h-4 w-4" />
                    Geri Aç
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Sayfa Denetimi</h2>
        <Card>
          <CardContent className="p-0">
            {pages.isLoading ? (
              <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…
              </p>
            ) : pageRows.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                Henüz taranmış sayfa yok. “Yeniden Tara” ile başlayın.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead className="text-right">Sorun</TableHead>
                    <TableHead className="text-right">Teknik</TableHead>
                    <TableHead className="text-right">AEO</TableHead>
                    <TableHead className="text-right">Son Tarama</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell className="max-w-xs truncate font-medium" title={page.url}>
                        {page.url}
                      </TableCell>
                      <TableCell className="text-right">{page.issue_count}</TableCell>
                      <TableCell className="text-right">{page.technical_score}</TableCell>
                      <TableCell className="text-right">{page.aeo_score}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {page.last_audited_at
                          ? new Date(page.last_audited_at).toLocaleDateString("tr-TR")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
