import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, AlertTriangle, CheckCircle2, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportTeaser } from "@/components/site/report-teaser";
import { getPublicReport } from "@/lib/public-report.functions";

export const Route = createFileRoute("/r/$token")({
  head: () => ({
    meta: [
      { title: "AI Hazırlık Raporu | OneCite" },
      { name: "description", content: "Sitenizin AI botları ve yapay zeka arama sistemleri için teknik hazırlık skorunu görüntüleyin." },
      { property: "og:title", content: "AI Hazırlık Raporu | OneCite" },
      { property: "og:description", content: "Sitenizin AI hazırlık skorunu ve bulgularını görüntüleyin." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ params }) => getPublicReport({ data: { token: params.token } }),
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold">Rapor yüklenemedi</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </main>
  ),
  component: PublicReportPage,
});

type Severity = "good" | "attention" | "critical";
type Finding = { key: string; category: string; state: Severity; title: string; description: string; recommendation: string };

const categoryNames: Record<string, string> = {
  technical: "Teknik Erişim",
  structured_data: "Yapılandırılmış Veri",
  ai_bot_compatibility: "AI Bot Uyumluluğu",
  content_readability: "İçerik Okunabilirliği",
};
const severityRank: Record<Severity, number> = { critical: 0, attention: 1, good: 2 };
const severityStyle: Record<Severity, { icon: typeof AlertCircle; iconClass: string; borderClass: string }> = {
  critical: { icon: AlertCircle, iconClass: "text-destructive", borderClass: "border-destructive/30" },
  attention: { icon: AlertTriangle, iconClass: "text-amber-500", borderClass: "border-amber-500/30" },
  good: { icon: CheckCircle2, iconClass: "text-emerald-500", borderClass: "border-border" },
};

function scoreTone(score: number): Severity {
  if (score < 40) return "critical";
  if (score < 70) return "attention";
  return "good";
}
const scoreToneClass: Record<Severity, string> = { critical: "text-destructive", attention: "text-amber-500", good: "text-emerald-500" };

function FindingsSeverityBanner({ criticalCount, attentionCount }: { criticalCount: number; attentionCount: number }) {
  if (criticalCount > 0) {
    return (
      <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
        <p className="text-sm text-destructive">
          <strong>{criticalCount} kritik sorun</strong> tespit edildi{attentionCount > 0 ? `, ${attentionCount} nokta da dikkat gerektiriyor` : ""} — AI botları (ChatGPT, Perplexity, Gemini) sitenizi bu eksiklikler yüzünden eksik veya hatalı okuyabilir.
        </p>
      </div>
    );
  }
  if (attentionCount > 0) {
    return (
      <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
        <p className="text-sm text-amber-700 dark:text-amber-400"><strong>{attentionCount} nokta</strong> dikkat gerektiriyor — bunları düzelterek AI hazırlığınızı artırabilirsiniz.</p>
      </div>
    );
  }
  return (
    <div className="mt-4 flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
      <p className="text-sm text-emerald-700 dark:text-emerald-400">Teknik AI hazırlığınız iyi durumda.</p>
    </div>
  );
}

function PublicReportPage() {
  const report = Route.useLoaderData();

  if (!report) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Rapor bulunamadı</h1>
        <p className="mt-2 text-sm text-muted-foreground">Bağlantı geçersiz olabilir. Yeni bir ücretsiz analiz başlatabilirsiniz.</p>
        <Button className="mt-5" asChild><Link to="/ucretsiz-yapay-zeka-gorunurluk-raporu">Ücretsiz analiz başlat</Link></Button>
      </main>
    );
  }

  const tone = scoreTone(report.score);
  const criticalCount = report.findings.filter((finding) => finding.state === "critical").length;
  const attentionCount = report.findings.filter((finding) => finding.state === "attention").length;
  const sortedFindings = [...report.findings].sort((a, b) => severityRank[a.state] - severityRank[b.state]);
  const scannedAt = new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short" }).format(new Date(report.createdAt));

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-4xl space-y-8">
        <header>
          <p className="text-sm text-muted-foreground">{report.domain} · {scannedAt} tarihinde tarandı</p>
          <h1 className="text-3xl font-semibold">AI Hazırlık Skoru</h1>
          <p className={`mt-3 text-6xl font-bold ${scoreToneClass[tone]}`}>{report.score}</p>
          <p className="mt-2 text-sm text-muted-foreground">Bu skor teknik ve makine-okunabilirlik hazırlığını ölçer; AI cevaplarında görünürlüğünüzü ölçmez.</p>
          <FindingsSeverityBanner criticalCount={criticalCount} attentionCount={attentionCount} />
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          {Object.entries(report.categoryScores).map(([key, categoryScore]) => (
            <div key={key} className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">{categoryNames[key] ?? key}</p>
              <p className="text-2xl font-semibold">{categoryScore}</p>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Bulgular</h2>
          {sortedFindings.map((finding) => {
            const style = severityStyle[finding.state];
            const Icon = style.icon;
            return (
              <article key={finding.key} className={`rounded-lg border ${style.borderClass} p-4`}>
                <div className="flex items-start gap-2.5">
                  <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${style.iconClass}`} />
                  <div className="flex-1">
                    <p className="font-medium">{finding.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{finding.description}</p>
                    <p className="mt-2 text-sm"><span className="font-medium">Öneri:</span> {finding.recommendation}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {report.citation.checked ? (
          <section className="rounded-lg border border-border p-5">
            <div className="flex items-start gap-2.5">
              <Quote className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">Canlı atıf kontrolü</h2>
                <p className="mt-1 text-sm text-muted-foreground">Perplexity'ye şu soru soruldu: “{report.citation.question}”</p>
                <p className="mt-3 text-sm">
                  {report.citation.cited
                    ? `Yanıtın kaynakları arasında ${report.domain} yer alıyor.`
                    : `Yanıtın kaynakları arasında ${report.domain} yer almıyor.`}
                </p>
                {report.citation.citedDomains.length ? (
                  <p className="mt-2 text-xs text-muted-foreground">Kullanılan kaynaklar: {report.citation.citedDomains.join(", ")}</p>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <div className="rounded-lg border border-border bg-card p-5">
          <ReportTeaser testId="report-teaser" />
          <p className="mt-4 text-sm text-muted-foreground">Bu bulguları OneCite ile birlikte çözelim.</p>
          <Button className="mt-3" asChild><Link to="/ucretsiz-yapay-zeka-gorunurluk-raporu">Ücretsiz ölçüm başlat</Link></Button>
        </div>
      </div>
    </main>
  );
}
