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

export type VisibilityAnalytics = {
  trend: Array<{ date: string; score: number }>;
  share: Array<{ name: string; mentions: number; isOwn: boolean }>;
  mix: Array<{ name: string; value: number }>;
  categories: Array<{ category: string; total: number; mentioned: number; rate: number }>;
  totalRuns: number;
  mentionRate: number;
  avgPosition: number | null;
};

const MIX_COLORS = ["var(--chart-1)", "var(--chart-5)", "var(--chart-3)"];

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--popover-foreground)",
} as const;

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
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

export function VisibilityCharts({ data }: { data: VisibilityAnalytics }) {
  const hasTrend = data.trend.length > 1;
  const shareData = data.share.filter((s) => s.mentions > 0);
  const mixData = data.mix.filter((m) => m.value > 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard
        title="Görünürlük skoru trendi"
        description={hasTrend ? "Her tamamlanan ölçüm turu bir nokta." : "İkinci ölçümden sonra trend çizgisi oluşur."}
      >
        {hasTrend ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value} puan`, "Skor"]} />
              <Area type="monotone" dataKey="score" stroke="var(--chart-1)" strokeWidth={2} fill="url(#scoreFill)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="Henüz yeterli ölçüm turu yok." />
        )}
      </ChartCard>

      <ChartCard title="Rakip payı" description="Yanıtlarda kaç kez geçildiği — siz ve rakipleriniz.">
        {shareData.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shareData} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value} yanıt`, "Geçme"]} />
              <Bar dataKey="mentions" radius={[0, 4, 4, 0]}>
                {shareData.map((row) => (
                  <Cell key={row.name} fill={row.isOwn ? "var(--chart-1)" : "var(--chart-3)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="Ölçüm yapıldığında rakip payı burada çıkar." />
        )}
      </ChartCard>

      <ChartCard title="Atıf kaynağı dağılımı" description="Yapay zekânın gösterdiği kaynaklar kimin sitesinden geliyor?">
        {mixData.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={mixData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                {mixData.map((entry, index) => (
                  <Cell key={entry.name} fill={MIX_COLORS[index % MIX_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [`${value} atıf`, name]} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="Henüz atıf kaydı yok." />
        )}
      </ChartCard>

      <ChartCard title="Soru kategorisi kırılımı" description="Hangi soru tipinde görünürlüğünüz güçlü?">
        {data.categories.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.categories} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="category" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`%${value}`, "Görünürlük"]} />
              <Bar dataKey="rate" radius={[4, 4, 0, 0]} fill="var(--chart-2)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="Ölçüm sonrası kategori kırılımı görünür." />
        )}
      </ChartCard>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return <div className="flex h-full items-center justify-center text-xs text-muted-foreground">{label}</div>;
}
