import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/app/hint";
import type { ScoreComponent } from "@/lib/score-model";

function grade(total: number) {
  if (total >= 75) return { label: "Güçlü", tone: "text-chart-2" };
  if (total >= 45) return { label: "Gelişmekte", tone: "text-foreground" };
  return { label: "Zayıf", tone: "text-destructive" };
}

// Skoru düşük kalan her başlık için gidilecek sayfa.
const FIX: Record<string, { to: string; label: string; tip: string }> = {
  mention: { to: "/app/prompts", label: "Promptları düzenle", tip: "Markanızın geçmediği sorulara odaklanın ve içerik üretin." },
  citation: { to: "/app/knowledge-base", label: "Bilgi bankasını güçlendir", tip: "Kendi sayfalarınız kaynak gösterilmiyor; kanıt sayfaları ekleyin." },
  position: { to: "/app/content", label: "İçerik üret", tip: "Listelerde üst sırada çıkmak için karşılaştırma ve rehber içeriği gerekir." },
  knowledge: { to: "/app/knowledge-base", label: "Kaynak ekle", tip: "Hedef 10 kaynak. Site haritanızdan önemli sayfaları ekleyin." },
  claims: { to: "/app/claims", label: "İddia kanıtla", tip: "Her iddiaya kaynak bağlantısı ekleyin." },
};

// Görünürlük skoru + kırılımı tek kompakt kart: "OneCite Score".
export function ScoreBreakdown({
  total, components, runs, lastRunAt,
}: {
  total: number;
  components: ScoreComponent[];
  runs: number;
  lastRunAt?: string | null;
}) {
  const g = grade(total);
  const weakest = [...components].sort((a, b) => a.points / a.weight - b.points / b.weight)[0];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          OneCite Score
          <Hint title="OneCite Score">
            <p>Markanızın yapay zeka yanıtlarındaki genel görünürlüğünü 0–100 arasında özetler.</p>
            <p>
              Beş başlık toplanır: yanıtlarda anılma (40), kendi sitenizin kaynak gösterilme payı (25),
              yanıt içindeki sıra kaliteniz (15), bilgi bankası kapsamınız (10) ve kanıtlı iddialarınız (10).
            </p>
            <p>75+ güçlü, 45–74 gelişmekte, 45 altı zayıf. En düşük başlık en hızlı kazançtır.</p>
          </Hint>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-end gap-2 sm:w-40 sm:shrink-0">
            <p className="font-display text-5xl font-semibold leading-none tracking-tight">{total}</p>
            <div className="pb-1">
              <p className="text-[11px] text-muted-foreground">/ 100</p>
              <p className={`text-xs font-medium ${g.tone}`}>{g.label}</p>
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <Progress value={total} className="h-1.5" />
            <p className="text-[11px] text-muted-foreground">
              {runs} yanıt üzerinden{lastRunAt ? ` · ${new Date(lastRunAt).toLocaleDateString("tr-TR")}` : ""}
              {weakest ? ` · En zayıf: ${weakest.label}` : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {components.map((c) => {
            const ratio = c.weight ? c.points / c.weight : 0;
            const weak = ratio < 0.6;
            const fix = FIX[c.key];
            return (
              <div key={c.key} className="flex flex-col rounded-md border border-border p-2">
                <p className="truncate text-[11px] font-medium" title={c.label}>{c.label}</p>
                <p className={`font-mono text-sm ${weak ? "text-destructive" : "text-foreground"}`}>
                  {c.points}
                  <span className="text-[10px] text-muted-foreground"> / {c.weight}</span>
                </p>
                <Progress value={ratio * 100} className="mt-1 h-1" />
                {weak && fix ? (
                  <Button asChild size="sm" variant="outline" className="mt-2 h-6 w-full px-1 text-[10px]">
                    <Link to={fix.to} title={fix.tip}>{fix.label} <ArrowUpRight className="ml-0.5 h-3 w-3" /></Link>
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
