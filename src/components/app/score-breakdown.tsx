import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ScoreComponent } from "@/lib/measurement.server";

function grade(total: number) {
  if (total >= 75) return { label: "Güçlü", tone: "text-[hsl(var(--chart-2))]" };
  if (total >= 45) return { label: "Gelişmekte", tone: "text-foreground" };
  return { label: "Zayıf", tone: "text-destructive" };
}

export function ScoreBreakdown({
  total, components, runs, lastRunAt,
}: {
  total: number;
  components: ScoreComponent[];
  runs: number;
  lastRunAt?: string | null;
}) {
  const g = grade(total);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Görünürlük skoru</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline gap-3">
            <p className="font-display text-4xl font-semibold">{total}</p>
            <span className="text-sm text-muted-foreground">/ 100</span>
            <span className={`text-sm font-medium ${g.tone}`}>{g.label}</span>
          </div>
          <Progress value={total} />
          <p className="text-xs text-muted-foreground">
            {runs} yapay zekâ yanıtı üzerinden hesaplandı
            {lastRunAt ? ` · son ölçüm ${new Date(lastRunAt).toLocaleString("tr-TR")}` : ""}.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Skor kırılımı</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {components.map((c) => (
            <div key={c.key} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium">{c.label}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {c.points} / {c.weight} puan
                </p>
              </div>
              <Progress value={(c.points / c.weight) * 100} className="h-1.5" />
              <p className="text-xs text-muted-foreground">{c.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
