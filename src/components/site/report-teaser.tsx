const SAMPLE_CATEGORIES = [
  { label: "Teknik", value: 21 },
  { label: "Yapı. Veri", value: 14 },
  { label: "AI Bot", value: 18 },
  { label: "İçerik", value: 19 },
];

export function ReportTeaser({ testId }: { testId?: string }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card p-4" aria-hidden="true" data-testid={testId}>
      <div className="pointer-events-none select-none space-y-3 blur-[6px]">
        <div>
          <p className="text-xs font-medium text-muted-foreground">AI Hazırlık Skoru</p>
          <p className="mt-1 text-5xl font-bold text-primary">74</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {SAMPLE_CATEGORIES.map((category) => (
            <div key={category.label} className="rounded-md border border-border p-2 text-center">
              <p className="text-[10px] text-muted-foreground">{category.label}</p>
              <p className="text-base font-semibold">{category.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
