import { Link } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, BarChart3, Bot, Search, Sparkles, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TrafficOverview } from "@/lib/integrations.functions";

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--popover-foreground)",
} as const;

function fmt(value: number) {
  return new Intl.NumberFormat("tr-TR").format(value);
}

function shortDate(value: string) {
  return value.slice(5).replace("-", ".");
}

function MetricCard({
  icon: Icon,
  title,
  value,
  caption,
  metric,
  days,
  children,
}: {
  icon: typeof Search;
  title: string;
  value: string;
  caption: string;
  metric?: string;
  days: number;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          {metric ? (
            <Link to="/app/traffic/$metric" params={{ metric }} search={{ days }} className="hover:text-foreground hover:underline">
              {title}
            </Link>
          ) : (
            title
          )}
          {metric ? <ArrowUpRight className="h-3 w-3 opacity-60" aria-hidden="true" /> : null}
        </CardTitle>
        <p className="font-display text-2xl font-semibold">{value}</p>
        <CardDescription className="text-[11px]">{caption}</CardDescription>
      </CardHeader>
      <CardContent className="h-32 pt-1">{children}</CardContent>
    </Card>
  );
}

function Empty({ label, cta }: { label: string; cta?: { to: string; text: string } }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground">
      <span>{label}</span>
      {cta ? (
        <Button asChild size="sm" variant="outline">
          <Link to={cta.to}>{cta.text} <ArrowUpRight className="ml-1 h-3 w-3" /></Link>
        </Button>
      ) : null}
    </div>
  );
}

export function TrafficCharts({ data }: { data: TrafficOverview }) {
  const gscDaily = data.gsc.daily.map((row) => ({ ...row, label: shortDate(row.date) }));
  const referralDaily = data.aiReferral.daily.map((row) => ({ ...row, label: shortDate(row.date) }));
  const ga4Daily = data.ga4.daily.map((row) => ({ ...row, label: shortDate(row.date) }));
  const overviewDaily = data.aiOverview.daily.map((row) => ({ ...row, label: shortDate(row.date) }));
  const period = data.gsc.startDate && data.gsc.endDate ? `${shortDate(data.gsc.startDate)} – ${shortDate(data.gsc.endDate)}` : "son 30 gün";

  const aiPlatforms = data.ga4.ai?.platforms ?? [];

  return (
    <>
    <div className="grid gap-4 md:grid-cols-2">
      <MetricCard
        icon={Search}
        days={data.rangeDays}
        metric="gsc-clicks"
        title="Google Arama Trafiği (GSC)"
        value={data.gsc.connected ? fmt(data.gsc.totals.clicks) : "—"}
        caption={data.gsc.connected ? `tıklama · ${fmt(data.gsc.totals.impressions)} gösterim · ${period}` : "Search Console bağlı değil"}
      >
        {data.gsc.connected && gscDaily.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={gscDaily} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="gscFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
              <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={34} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name) => [fmt(value), name === "clicks" ? "Tıklama" : "Gösterim"]} />
              <Area type="monotone" dataKey="clicks" stroke="var(--chart-1)" strokeWidth={2} fill="url(#gscFill)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Empty label="Search Console verisi yok." cta={{ to: "/app/integrations", text: "Bağla" }} />
        )}
      </MetricCard>

      <MetricCard
        icon={BarChart3}
        days={data.rangeDays}
        metric="gsc-impressions"
        title="Arama Görünürlüğü (Gösterim)"
        value={data.gsc.connected ? fmt(data.gsc.totals.impressions) : "—"}
        caption={data.gsc.connected ? `gösterim · ${data.gsc.queries.length} sorgu takipte` : "Bağlantı sonrası dolar"}
      >
        {data.gsc.connected && gscDaily.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gscDaily} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
              <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={34} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [fmt(value), "Gösterim"]} />
              <Bar dataKey="impressions" radius={[3, 3, 0, 0]} fill="var(--chart-2)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Empty label="Gösterim verisi yok." cta={{ to: "/app/integrations", text: "Bağla" }} />
        )}
      </MetricCard>

      <MetricCard
        icon={Sparkles}
        days={data.rangeDays}
        metric="ai-visibility"
        title="Yapay Zeka Görünürlüğü"
        value={`%${data.aiOverview.rate}`}
        caption={`${fmt(data.aiOverview.mentioned)} / ${fmt(data.aiOverview.total)} yanıtta markanız geçti (30 gün)`}
      >
        {data.aiOverview.total ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={overviewDaily} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
              <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={34} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name) => [fmt(value), name === "mentioned" ? "Geçtiği yanıt" : "Toplam yanıt"]} />
              <Line type="monotone" dataKey="total" stroke="var(--chart-3)" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="mentioned" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Empty label="Henüz ölçüm yapılmadı." cta={{ to: "/app/measurement", text: "Ölçümü başlat" }} />
        )}
      </MetricCard>

      <MetricCard
        icon={Users}
        days={data.rangeDays}
        metric="ga4-sessions"
        title="Site Trafiği (GA4)"
        value={data.ga4.connected ? fmt(data.ga4.totals.sessions) : "—"}
        caption={
          data.ga4.connected
            ? `oturum · ${fmt(data.ga4.totals.users)} kullanıcı · son 28 gün`
            : "Google Analytics bağlı değil"
        }
      >
        {data.ga4.connected && ga4Daily.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ga4Daily} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="ga4Fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
              <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={34} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name) => [fmt(value), name === "sessions" ? "Oturum" : "Kullanıcı"]} />
              <Area type="monotone" dataKey="sessions" stroke="var(--chart-4)" strokeWidth={2} fill="url(#ga4Fill)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Empty label="GA4 verisi yok." cta={{ to: "/app/integrations", text: "Bağla" }} />
        )}
      </MetricCard>

      <MetricCard
        icon={Bot}
        days={data.rangeDays}
        metric="ai-citations"
        title="AI Atıf Trafiği"
        value={fmt(data.aiReferral.total)}
        caption={`atıf · ${fmt(data.aiReferral.ownDomain)} tanesi kendi siteniz (30 gün)`}
      >
        {data.aiReferral.total ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={referralDaily} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="refFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-5)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--chart-5)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
              <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={34} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [fmt(value), "Atıf"]} />
              <Area type="monotone" dataKey="citations" stroke="var(--chart-5)" strokeWidth={2} fill="url(#refFill)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Empty label="Henüz atıf kaydı yok." cta={{ to: "/app/measurement", text: "Ölçümü başlat" }} />
        )}
      </MetricCard>
    </div>

    {/* GA4 kaynak kirilimi: hangi yapay zeka platformundan gercek ziyaret geliyor. */}
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          Yapay Zekadan Gelen Site Trafiği (GA4)
        </CardTitle>
        <CardDescription className="text-[11px]">
          {data.ga4.connected
            ? `Son 28 günde ${fmt(data.ga4.ai?.sessions ?? 0)} oturum yapay zeka asistanlarından geldi · toplam trafiğin %${data.ga4.ai?.share ?? 0}'i`
            : "Google Analytics bağlı değil."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!data.ga4.connected ? (
          <div className="h-40">
            <Empty label="GA4 bağlandığında yapay zeka kaynakları burada listelenir." cta={{ to: "/app/integrations", text: "Bağla" }} />
          </div>
        ) : aiPlatforms.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aiPlatforms} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="platform" width={120} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [fmt(value), "Oturum"]} />
                  <Bar dataKey="sessions" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-1.5">
              {aiPlatforms.map((row) => (
                <li key={row.platform} className="flex items-start justify-between gap-3 rounded-md border border-border px-2.5 py-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-medium">{row.platform}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {row.sources.length ? row.sources.join(", ") : "kaynak bilgisi yok"}
                    </p>
                  </div>
                  <span className="shrink-0 font-display font-semibold">{fmt(row.sessions)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="h-40">
            <Empty label="Son 28 günde yapay zeka asistanlarından gelen oturum kaydedilmedi." />
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
