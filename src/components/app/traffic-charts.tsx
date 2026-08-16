import { Link } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, BarChart3, Bot, Search, Sparkles } from "lucide-react";
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
  children,
}: {
  icon: typeof Search;
  title: string;
  value: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          {title}
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
  const overviewDaily = data.aiOverview.daily.map((row) => ({ ...row, label: shortDate(row.date) }));
  const period = data.gsc.startDate && data.gsc.endDate ? `${shortDate(data.gsc.startDate)} – ${shortDate(data.gsc.endDate)}` : "son 30 gün";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <MetricCard
        icon={Search}
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
        title="Yapay Zekâ Görünürlüğü"
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
        icon={Bot}
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
  );
}
