import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/app/hint";
import type { ScoreComponent } from "@/lib/score-model";

function grade(total: number) {
  if (total >= 75) return { label: "Ğüçlü", tone: "text-chart-2" };
  if (total >= 45) return { label: "Ğelişmekte", tone: "text-foreground" };
  return { label: "Zayıf", tone: "text-destructive" };
}

// Skoru düşük kalan her başlık için gidilecek sayfa.
const FIX: Record<string, { to: string; label: string; tip: string }> = {
  mention: { to: "/app/prompts", label: "Promptları düzenle", tip: "Markanızın geçmediği sorulara odaklanın ve içerik üretin." },
  citation: { to: "/app/knowledge-base", label: "Bilgi bankasını güçlendir", tip: "Kendi sayfalarınız kaynak gösterilmiyor; kanıt sayfaları ekleyin." },
  position: { to: "/app/content", label: "İçerik üret", tip: "Listelerde üst sırada çıkmak için karşılaştırma ve rehber içeriği gerekir." },
  knowledge: { to: "/app/knowledge-base", label: "Kaynak ekle", tip: "Hedef 10 kaynak. Site haritanızdan önemli sayfaları ekleyin." },
  claims: { to: "/app/claims", label: "Iddia kanıtla", tip: "Her iddiaya kaynak bağlantısı ekleyin." },
};

// Ğörünürlük skoru + kırılımı tek kompakt kart: "OneCite Score".
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
              Bes başlık toplanir: yanıtlarda anilma (40), kendi sitenizin kaynak gosterilme payi (25),
              yanıt icindeki sira kaliteniz (15), bilgi bankasi kapsaminiz (10) ve kanitli iddialariniz (10).
            </p>
            <p>75+ güçlü, 45–74 gelişmekte, 45 altı zayıf. En düşük başlık en hızlı kazançtır.</p>
          </Hint>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
          <p className="font-display text-4xl font-semibold leading-none">{total}</p>
          <span className="text-xs text-muted-foreground">/ 100</span>
          <span className={`text-xs font-medium ${g.tone}`}>{g.label}</span>
          <p className="ml-auto text-[11px] text-muted-foreground">
            {runs} yanıt uzerinden{lastRunAt ? ` · ${new Date(lastRunAt).toLocaleDateString("tr-TR")}` : ""}
          </p>
        </div>
        <Progress value={total} className="h-1.5" />

        {weakest ? (
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
            En zayıf alaniniz <strong className="text-foreground">{weakest.label}</strong>:{" "}
            {FIX[weakest.key]?.tip ?? weakest.detail}
          </p>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          {components.map((c) => {
            const ratio = c.weight ? c.points / c.weight : 0;
            const weak = ratio < 0.6;
            const fix = FIX[c.key];
            return (
              <div key={c.key} className="rounded-md border border-border p-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-medium">{c.label}</p>
                  <p className={`font-mono text-[11px] ${weak ? "text-destructive" : "text-muted-foreground"}`}>
                    {c.points} / {c.weight}
                  </p>
                </div>
                <Progress value={ratio * 100} className="mt-1.5 h-1" />
                <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">{c.detail}</p>
                {weak && fix ? (
                  <Button asChild size="sm" variant="outline" className="mt-2 h-7 w-full text-[11px]">
                    <Link to={fix.to}>{fix.label} <ArrowUpRight className="ml-1 h-3 w-3" /></Link>
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
