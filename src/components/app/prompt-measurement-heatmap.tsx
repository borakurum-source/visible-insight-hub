import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type PromptMeasurementMatrix = {
  columns: Array<{ id: string; date: string; promptSetChanged: boolean }>;
  rows: Array<{
    id: string;
    prompt: string;
    category: string;
    values: Array<number | null>;
  }>;
};

function heatColor(value: number | null) {
  if (value === null) return "bg-muted text-muted-foreground";
  if (value >= 70) return "bg-emerald-500/80 text-white";
  if (value >= 40) return "bg-amber-500/80 text-white";
  return "bg-rose-500/80 text-white";
}

export function PromptMeasurementHeatmap({ data }: { data: PromptMeasurementMatrix }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Prompt × tam ölçüm turu ısı haritası</CardTitle>
        <CardDescription>
          Aynı filtrelenmiş veri hem renk hem sayı olarak gösterilir. ● prompt kümesi kırılmasıdır.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.columns.length && data.rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-1 text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 min-w-64 bg-card p-2 text-left">Prompt</th>
                  {data.columns.map((column) => (
                    <th key={column.id} className="min-w-20 p-2 text-center font-medium">
                      {column.promptSetChanged ? (
                        <span className="text-destructive">● </span>
                      ) : null}
                      {column.date}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    <th className="sticky left-0 z-10 max-w-80 bg-card p-2 text-left font-normal">
                      <span className="line-clamp-2">{row.prompt}</span>
                      <span className="text-[10px] text-muted-foreground">{row.category}</span>
                    </th>
                    {row.values.map((value, index) => (
                      <td key={data.columns[index]?.id} className="p-0.5 text-center">
                        <span
                          className={`block rounded px-2 py-2 font-mono ${heatColor(value)}`}
                          title={
                            value === null
                              ? "Bu tam turda prompt ölçülmedi"
                              : `Görünürlük skoru: ${Math.round(value)}`
                          }
                        >
                          {value === null ? "—" : Math.round(value)}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Kaynak: agent_web_grounded · yalnız tamamlanan tam turlar · — eksik veridir, sıfır
              değildir.
            </p>
          </div>
        ) : (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Isı haritası ilk tamamlanan tam ölçümden sonra oluşur.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
