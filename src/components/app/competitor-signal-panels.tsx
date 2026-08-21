import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CompetitorTrend } from "./competitor-trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};

export function CompetitorSignalPanels({ data }: { data: CompetitorTrend }) {
  const share = data.series.map((item) => ({
    name: item.name,
    görünürlük: item.current,
    bahsedilme: item.mentions,
  }));
  const own = data.series.find((item) => item.isOwn);
  const rival = data.series.find((item) => !item.isOwn);
  const radar = [
    { signal: "Görünürlük", marka: own?.current ?? 0, rakip: rival?.current ?? 0 },
    {
      signal: "Momentum",
      marka: Math.max(0, 50 + (own?.change ?? 0)),
      rakip: Math.max(0, 50 + (rival?.change ?? 0)),
    },
    {
      signal: "Bahsedilme",
      marka: Math.min(100, (own?.mentions ?? 0) * 10),
      rakip: Math.min(100, (rival?.mentions ?? 0) * 10),
    },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Share of voice karşılaştırması</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={share} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="görünürlük" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Marka–rakip sinyal radarı</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radar}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="signal" tick={{ fontSize: 11 }} />
              <Radar
                name={own?.name ?? "Marka"}
                dataKey="marka"
                stroke="var(--chart-1)"
                fill="var(--chart-1)"
                fillOpacity={0.2}
              />
              <Radar
                name={rival?.name ?? "Rakip"}
                dataKey="rakip"
                stroke="var(--chart-2)"
                fill="var(--chart-2)"
                fillOpacity={0.15}
              />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
