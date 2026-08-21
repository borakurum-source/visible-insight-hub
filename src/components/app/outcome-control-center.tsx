import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type OutcomeControlData = {
  findings: Array<{
    id: string;
    title: string;
    impact: number;
    effort: number;
    confidence: number;
    evidenceCount: number;
    status: string;
    createdAt: string;
  }>;
  funnel: { pending: number; approved: number; completed: number };
  coverage: number | null;
  confidence: number | null;
  lastUpdated: string | null;
};

export function OutcomeControlCenter({ data }: { data: OutcomeControlData }) {
  const scatter = data.findings.map((item) => ({
    x: item.effort,
    y: item.impact,
    z: Math.max(20, item.evidenceCount * 20),
    name: item.title,
  }));
  const max = Math.max(1, data.funnel.pending, data.funnel.approved, data.funnel.completed);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Veri kapsamı</p>
            <p className="mt-1 text-2xl font-semibold">
              {data.coverage == null ? "—" : `%${Math.round(data.coverage * 100)}`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Güven seviyesi</p>
            <p className="mt-1 text-2xl font-semibold">
              {data.confidence == null ? "—" : `%${Math.round(data.confidence * 100)}`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Son güncelleme</p>
            <p className="mt-2 text-sm font-medium">
              {data.lastUpdated
                ? new Date(data.lastUpdated).toLocaleString("tr-TR")
                : "Henüz run yok"}
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Etki–efor öncelik haritası</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {scatter.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -10 }}>
                  <CartesianGrid stroke="var(--border)" />
                  <XAxis type="number" dataKey="x" name="Efor" domain={[0, 100]} />
                  <YAxis type="number" dataKey="y" name="Etki" domain={[0, 100]} />
                  <ZAxis type="number" dataKey="z" range={[50, 500]} />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                  <Scatter data={scatter} fill="var(--chart-1)" />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                İlk araştırma bulgularıyla oluşur.
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Aksiyon hunisi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {[
              {
                label: "Bekleyen bulgu",
                value: data.funnel.pending,
                icon: AlertTriangle,
                color: "bg-warning",
              },
              {
                label: "Onaylanan aksiyon",
                value: data.funnel.approved,
                icon: Clock3,
                color: "bg-chart-2",
              },
              {
                label: "Tamamlanan görev",
                value: data.funnel.completed,
                icon: CheckCircle2,
                color: "bg-success",
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </span>
                  <Badge variant="outline">{item.value}</Badge>
                </div>
                <div className="h-8 rounded bg-muted">
                  <div
                    className={`h-full rounded ${item.color}`}
                    style={{ width: `${Math.max(item.value ? 12 : 0, (item.value / max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      {data.findings.length ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Son ölçümden beri ne değişti?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.findings.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 border-l-2 border-primary/40 pl-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.evidenceCount} kanıt · güven %{Math.round(item.confidence * 100)}
                  </p>
                </div>
                <Badge variant="outline">Etki {item.impact}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
