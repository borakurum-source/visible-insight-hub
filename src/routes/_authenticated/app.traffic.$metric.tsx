import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, LineChart } from "lucide-react";
import { PanelPageHeading } from "@/components/app/panel-page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTrafficOverview } from "@/lib/integrations.functions";
import { useActiveBrand } from "@/lib/use-panel";

export const Route = createFileRoute("/_authenticated/app/traffic/$metric")({
  head: () => ({
    meta: [
      { title: "Metrik Detayı — OneCite Paneli" },
      { name: "description", content: "Seçilen metriğin günlük serisi ve kaynak kırılımları." },
      { property: "og:title", content: "Metrik Detayı — OneCite Paneli" },
      { property: "og:description", content: "Günlük seri ve kaynak kırılımları." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { days: number } => ({
    days: [7, 30, 90].includes(Number(search["days"])) ? Number(search["days"]) : 30,
  }),
  component: MetricDetailPage,
});

const RANGES = [7, 30, 90] as const;

function fmt(value: number) {
  return new Intl.NumberFormat("tr-TR").format(value);
}

function MetricDetailPage() {
  const { metric } = Route.useParams();
  const { brand } = useActiveBrand();
  const { days } = Route.useSearch();
  const fetchTraffic = useServerFn(getTrafficOverview);
  const { data } = useQuery({
    queryKey: ["traffic-overview", brand?.id, days],
    queryFn: () => fetchTraffic({ data: { brandId: brand!.id, days } }),
    enabled: Boolean(brand?.id),
  });

  const config = {
    "gsc-clicks": { title: "Google Arama Tıklamaları", key: "clicks", label: "Tıklama" },
    "gsc-impressions": { title: "Arama Gösterimleri", key: "impressions", label: "Gösterim" },
    "ga4-sessions": { title: "Site Trafiği (GA4)", key: "sessions", label: "Oturum" },
    "ga4-ai": { title: "AI Referral Trafiği (GA4)", key: "sessions", label: "Oturum" },
    "ai-citations": { title: "AI Atıf Trafiği", key: "citations", label: "Atıf" },
    "ai-visibility": { title: "Yapay Zeka Görünürlüğü", key: "mentioned", label: "Markanın geçtiği yanıt" },
  }[metric as string] ?? { title: "Metrik", key: "value", label: "Deger" };

  const series: Array<Record<string, number | string>> = data
    ? metric.startsWith("gsc")
      ? data.gsc.daily
      : metric.startsWith("ga4")
        ? data.ga4.daily
        : metric === "ai-citations"
          ? data.aiReferral.daily
          : data.aiOverview.daily
    : [];

  const total = series.reduce((sum, row) => sum + Number(row[config.key] ?? 0), 0);

  // Metrige gore birden fazla kirilim: sorgular, sayfalar, kanallar, AI platform/sayfa/kampanya.
  const sections: Array<{ title: string; hint?: string; rows: Array<{ label: string; value: number; meta?: string }> }> = [];
  if (data && metric.startsWith("gsc")) {
    const useClicks = metric === "gsc-clicks";
    sections.push({
      title: "En çok performans gösteren sorgular",
      rows: data.gsc.queries.map((q) => ({
        label: q.query,
        value: useClicks ? q.clicks : q.impressions,
        meta: `poz. ${q.position}`,
      })),
    });
    sections.push({
      title: "Kaynak sayfalar",
      hint: "Yapay zeka asistanlarının alıntıladığı içerikler genelde bu sayfalardır.",
      rows: data.gsc.pages.map((p) => ({
        label: p.page,
        value: useClicks ? p.clicks : p.impressions,
        meta: `poz. ${p.position}`,
      })),
    });
  }
  if (data && metric.startsWith("ga4")) {
    if (metric === "ga4-ai") {
      sections.push({
        title: "Yapay zeka platformları",
        rows: data.ga4.ai.platforms.map((p) => ({
          label: p.platform,
          value: p.sessions,
          meta: p.sources.join(", "),
        })),
      });
      sections.push({
        title: "Kaynak sayfalar (giriş sayfası)",
        hint: "Yapay zeka yanıtlarından gelen ziyaretçilerin ilk açtığı sayfalar.",
        rows: data.ga4.ai.pages.map((p) => ({ label: p.label, value: p.sessions, meta: p.platforms.join(", ") })),
      });
      sections.push({
        title: "Kampanya kırılımı",
        rows: data.ga4.ai.campaigns.map((c) => ({ label: c.label, value: c.sessions, meta: c.platforms.join(", ") })),
      });
    }
    sections.push({
      title: "Kanal kırılımı",
      rows: data.ga4.channels.map((c) => ({ label: c.channel, value: c.sessions })),
    });
  }
  const visibleSections = sections.filter((section) => section.rows.length);

  return (
    <>
      <PanelPageHeading
        meta={{ title: config.title, description: `Son ${days} günlük günlük seri ve kaynak kırılımı.`, icon: LineChart }}
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/app"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Dashboard</Link>
          </Button>
        }
      />

      <div className="flex gap-1.5">
        {RANGES.map((range) => (
          <Button key={range} asChild size="sm" variant={range === days ? "default" : "outline"}>
            <Link to="/app/traffic/$metric" params={{ metric }} search={{ days: range }}>Son {range} gun</Link>
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {config.label} · toplam {fmt(total)}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {series.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="detailFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={40} />
                <Tooltip formatter={(value: number) => [fmt(value), config.label]} />
                <Area type="monotone" dataKey={config.key} stroke="var(--chart-1)" strokeWidth={2} fill="url(#detailFill)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="flex h-full items-center justify-center text-xs text-muted-foreground">Bu aralıkta veri yok.</p>
          )}
        </CardContent>
      </Card>

      {visibleSections.map((section) => (
        <Card key={section.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{section.title}</CardTitle>
            {section.hint ? <p className="text-[11px] text-muted-foreground">{section.hint}</p> : null}
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border text-sm">
              {section.rows.slice(0, 25).map((row) => (
                <li key={row.label} className="flex items-center gap-3 px-4 py-2">
                  <span className="min-w-0 flex-1 truncate">{row.label}</span>
                  {row.meta ? <span className="hidden max-w-[40%] truncate text-[11px] text-muted-foreground sm:block">{row.meta}</span> : null}
                  <span className="font-mono text-xs">{fmt(row.value)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
