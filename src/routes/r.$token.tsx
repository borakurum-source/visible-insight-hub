import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportTeaser } from "@/components/site/report-teaser";

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

// Backend henüz bağlı değil; bu sayfa mock bir rapor gösterir.
function buildMockReport(token: string) {
  return {
    normalizedDomain: token.replace(/-/g, "."),
    score: 74,
    categoryScores: { technical: 21, structured_data: 14, ai_bot_compatibility: 18, content_readability: 19 },
    findings: [
      { key: "robots", category: "technical", state: "good" as Severity, title: "robots.txt AI botlarını engellemiyor", description: "GPTBot, PerplexityBot ve ClaudeBot erişimi açık.", recommendation: "Mevcut yapılandırmayı koruyun." },
      { key: "jsonld", category: "structured_data", state: "attention" as Severity, title: "JSON-LD şeması eksik", description: "Organizasyon ve ürün şeması bulunamadı.", recommendation: "schema.org Organization ve Product/Service şemalarını ekleyin." },
      { key: "sitemap", category: "technical", state: "good" as Severity, title: "Sitemap erişilebilir", description: "sitemap.xml düzgün biçimde yayınlanıyor.", recommendation: "Güncel tutmaya devam edin." },
      { key: "readability", category: "content_readability", state: "critical" as Severity, title: "İçerik JS render'a bağımlı", description: "Ana içerik yalnızca istemci tarafı render sonrası görünüyor.", recommendation: "Kritik içeriği sunucu tarafında render edin veya statik HTML olarak sunun." },
    ],
  };
}

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
  const { token } = Route.useParams();
  const report = useMemo(() => buildMockReport(token), [token]);
  const tone = scoreTone(report.score);
  const criticalCount = report.findings.filter((finding) => finding.state === "critical").length;
  const attentionCount = report.findings.filter((finding) => finding.state === "attention").length;
  const sortedFindings = [...report.findings].sort((a, b) => severityRank[a.state] - severityRank[b.state]);

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-4xl space-y-8">
        <header>
          <p className="text-sm text-muted-foreground">{report.normalizedDomain}</p>
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

        <div className="rounded-lg border border-border bg-card p-5">
          <ReportTeaser testId="report-teaser" />
          <p className="mt-4 text-sm text-muted-foreground">Bu bulguları OneCite ile birlikte çözelim.</p>
          <Button className="mt-3" asChild><Link to="/ucretsiz-yapay-zeka-gorunurluk-raporu">Ücretsiz ölçüm başlat</Link></Button>
        </div>
      </div>
    </main>
  );
}
