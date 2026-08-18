import type { PlatformDemand, PromptDemandRow } from "@/lib/prompt-demand/types";

const number = new Intl.NumberFormat("tr-TR");

export function PlatformBars({ items }: { items: PlatformDemand[] }) {
  const max = Math.max(1, ...items.map((item) => item.demand));
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium">{number.format(item.demand)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${(item.demand / max) * 100}%` }} />
          </div>
        </div>
      ))}
      <p className="pt-1 text-[11px] text-muted-foreground">
        Platform dağılımı modellenmiş kullanım katsayılarına dayanır; sağlayıcı verisi değildir.
      </p>
    </div>
  );
}

/** Talep - Kaynak gösterimi matrisi: dört bolge, aksiyon onceliklendirme icin. */
export function DemandCitationMatrix({
  prompts,
  onSelect,
}: {
  prompts: PromptDemandRow[];
  onSelect: (prompt: PromptDemandRow) => void;
}) {
  const maxDemand = Math.max(1, ...prompts.map((p) => p.uniqueDemand));
  return (
    <div className="space-y-3">
      <div className="relative h-64 rounded-lg border border-border bg-muted/20">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          <div className="border-b border-r border-dashed border-border/70 p-2 text-[10px] text-muted-foreground">
            Yüksek talep · Kaynak gösterilmiyor (öncelik)
          </div>
          <div className="border-b border-dashed border-border/70 p-2 text-right text-[10px] text-muted-foreground">
            Yüksek talep · Kaynak gösteriliyor (koru)
          </div>
          <div className="border-r border-dashed border-border/70 p-2 text-[10px] text-muted-foreground">
            Düşük talep · Kaynak gösterilmiyor (izle)
          </div>
          <div className="p-2 text-right text-[10px] text-muted-foreground">Düşük talep · Kaynak gösteriliyor</div>
        </div>
        {prompts.map((prompt) => {
          const x = prompt.citationStatus === "cited" ? 0.62 + Math.random() * 0.3 : 0.08 + Math.random() * 0.3;
          const y = 1 - prompt.uniqueDemand / maxDemand;
          return (
            <button
              key={prompt.id}
              type="button"
              onClick={() => onSelect(prompt)}
              title={`${prompt.text} — ${number.format(prompt.uniqueDemand)} talep`}
              className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background bg-primary transition-transform hover:scale-150"
              style={{ left: `${x * 100}%`, top: `${8 + y * 84}%` }}
            />
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Noktaya tıklayarak prompt detayını açın. Sol üst bölge en yüksek kaynak gösterim fırsatıdır.
      </p>
    </div>
  );
}