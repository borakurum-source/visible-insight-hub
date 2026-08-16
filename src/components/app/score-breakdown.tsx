import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Hint } from "@/components/app/hint";
import type { ScoreComponent } from "@/lib/score-model";

function grade(total: number) {
  if (total >= 75) return { label: "Güçlü", tone: "text-chart-2" };
  if (total >= 45) return { label: "Gelişmekte", tone: "text-foreground" };
  return { label: "Zayıf", tone: "text-destructive" };
}

// Görünürlük skoru + kırılımı tek kart: "OneCite Score".
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-1.5 text-base">
          OneCite Score
          <Hint title="OneCite Score">
            <p>
              Markanızın yapay zekâ yanıtlarındaki genel görünürlüğünü <strong>0–100</strong> arasında özetler.
            </p>
            <p>
              Dört başlıktan oluşur: yanıtlarda anılma, yanıt içindeki sıranız, kendi sitenizin kaynak gösterilme payı ve
              kanıt altyapınızın (bilgi bankası, iddialar) gücü. Aşağıdaki kırılım her başlıkta kaç puan aldığınızı gösterir.
            </p>
            <p><strong>75+</strong> güçlü, <strong>45–74</strong> gelişmekte, <strong>45 altı</strong> zayıf.</p>
          </Hint>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-baseline gap-3">
            <p className="font-display text-5xl font-semibold leading-none">{total}</p>
            <span className="text-sm text-muted-foreground">/ 100</span>
            <span className={`text-sm font-medium ${g.tone}`}>{g.label}</span>
          </div>
          <Progress value={total} />
          <p className="text-xs text-muted-foreground">
            {runs} yapay zekâ yanıtı üzerinden hesaplandı
            {lastRunAt ? ` · son ölçüm ${new Date(lastRunAt).toLocaleString("tr-TR")}` : ""}.
          </p>
        </div>

        <div className="space-y-4 border-t border-border pt-4">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Skor kırılımı
            <Hint title="Skor kırılımı">
              <p>Her başlığın kendi ağırlığı var; toplamları 100 puanı verir.</p>
              <p>En düşük puanlı başlık, en hızlı kazanç sağlayacağınız alandır — oradan başlayın.</p>
            </Hint>
          </p>
          {components.map((c) => (
            <div key={c.key} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium">{c.label}</p>
                <p className="font-mono text-xs text-muted-foreground">{c.points} / {c.weight} puan</p>
              </div>
              <Progress value={(c.points / c.weight) * 100} className="h-1.5" />
              <p className="text-xs text-muted-foreground">{c.detail}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
