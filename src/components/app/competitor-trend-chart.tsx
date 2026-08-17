import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Minus, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type CompetitorTrend = {
  points: Array<{ date: string } & Record<string, number | string>>;
  series: Array<{ key: string; name: string; isOwn: boolean; current: number; change: number; mentions: number }>;
  totalRuns: number;
};

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "#8b5cf6", "#06b6d4"];

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--popover-foreground)",
} as const;

export function CompetitorTrendChart({ data }: { data: CompetitorTrend }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const colorOf = useMemo(() => {
    const map = new Map<string, string>();
    data.series.forEach((s, i) => map.set(s.key, s.isOwn ? "var(--chart-1)" : COLORS[(i % (COLORS.length - 1)) + 1]!));
    return map;
  }, [data.series]);

  const hasData = data.totalRuns > 0 && data.series.some((s) => s.mentions > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" aria-hidden="true" />
              Rakiplerle karşılaştırmalı AI görünürlüğü
            </CardTitle>
            <CardDescription className="text-xs">
              Aynı promptlarda yapay zeka yanıtlarında geçme oranınız (%) — siz ve takip ettiğiniz rakipler.
            </CardDescription>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/app/competitors">Rakip takibi</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-64">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.points} margin={{ top: 6, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, key: string) => [
                    `%${value}`,
                    data.series.find((s) => s.key === key)?.name ?? key,
                  ]}
                />
                {data.series
                  .filter((s) => !hidden.has(s.key))
                  .map((s) => (
                    <Line
                      key={s.key}
                      type="monotone"
                      dataKey={s.key}
                      name={s.name}
                      stroke={colorOf.get(s.key)}
                      strokeWidth={s.isOwn ? 2.5 : 1.6}
                      strokeDasharray={s.isOwn ? undefined : "4 3"}
                      dot={false}
                      activeDot={{ r: 3 }}
                    />
                  ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-xs text-muted-foreground">
              Ölçüm çalıştırıp rakip eklediğinizde karşılaştırmalı trend burada oluşur.
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {data.series.map((s) => {
            const off = hidden.has(s.key);
            const Icon = s.change > 0 ? ArrowUpRight : s.change < 0 ? ArrowDownRight : Minus;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() =>
                  setHidden((prev) => {
                    const next = new Set(prev);
                    if (next.has(s.key)) next.delete(s.key);
                    else next.add(s.key);
                    return next;
                  })
                }
                className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition-colors ${
                  off ? "opacity-40" : "hover:border-primary/40"
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: colorOf.get(s.key) }} aria-hidden="true" />
                <span className={s.isOwn ? "font-semibold" : ""}>{s.name}{s.isOwn ? " (siz)" : ""}</span>
                <span className="text-muted-foreground">%{s.current}</span>
                <Icon
                  className={`h-3 w-3 ${s.change > 0 ? "text-emerald-500" : s.change < 0 ? "text-red-500" : "text-muted-foreground"}`}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
