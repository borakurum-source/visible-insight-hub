import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type CitationDiscoveryAnalytics = {
  mix: Array<{ name: string; value: number }>;
  topDomains: Array<{ domain: string; count: number; isOwn: boolean }>;
  trend: Array<{ week: string; own: number; thirdParty: number }>;
  totalCitations: number;
};

const MIX_COLORS = ["var(--chart-1)", "var(--chart-5)", "var(--chart-3)"];

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--popover-foreground)",
} as const;

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-56 pt-2">{children}</CardContent>
    </Card>
  );
}

export function CitationDiscoveryCharts({ data }: { data: CitationDiscoveryAnalytics }) {
  const mixData = data.mix.filter((m) => m.value > 0);
  const hasTrend = data.trend.length > 1;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ChartCard
        title="Kaynak dağılımı"
        description="Atıf yapılan siteler kimin — siz, rakip mi, tarafsız mı?"
      >
        {mixData.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={mixData}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
              >
                {mixData.map((entry, index) => (
                  <Cell key={entry.name} fill={MIX_COLORS[index % MIX_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => [`${value} atıf`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="Henüz atıf kaydı yok." />
        )}
      </ChartCard>

      <ChartCard
        title="En çok atıf yapılan domainler"
        description="İlk 10 domain, atıf sayısına göre."
      >
        {data.topDomains.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.topDomains}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                stroke="var(--muted-foreground)"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="domain"
                width={110}
                tick={{ fontSize: 11 }}
                stroke="var(--muted-foreground)"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [`${value} atıf`, "Atıf sayısı"]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.topDomains.map((row) => (
                  <Cell key={row.domain} fill={row.isOwn ? "var(--chart-1)" : "var(--chart-3)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="Ölçüm yapıldığında domainler burada çıkar." />
        )}
      </ChartCard>

      <ChartCard
        title="Zaman içinde atıflar"
        description="Haftalık, kendi siteniz vs. üçüncü taraf."
      >
        {hasTrend ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="ownFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="thirdPartyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11 }}
                stroke="var(--muted-foreground)"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="var(--muted-foreground)"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="own"
                name="Kendi siteniz"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#ownFill)"
              />
              <Area
                type="monotone"
                dataKey="thirdParty"
                name="Üçüncü taraf"
                stroke="var(--chart-3)"
                strokeWidth={2}
                fill="url(#thirdPartyFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="Trend için en az iki haftalık veri gerekir." />
        )}
      </ChartCard>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
      {label}
    </div>
  );
}
