import type { ReactNode } from "react";

/** Ürün ekran görüntüsünü macOS pencere çerçevesi ve marka gradientli zemin içinde gösterir. */
export function FeatureShot({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="feature-shot-surface relative overflow-hidden rounded-2xl border border-border p-3 md:p-5">
      <div className="overflow-hidden rounded-xl border border-border/80 bg-background shadow-[0_24px_60px_-24px_rgba(15,23,42,0.45)]">
        <div className="flex items-center gap-1.5 border-b border-border bg-secondary/60 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" aria-hidden="true" />
          <span className="ml-3 truncate font-mono text-[10px] text-muted-foreground">app.1cite.com</span>
        </div>
        <img src={src} alt={alt} loading="lazy" decoding="async" className="block w-full" />
      </div>
      {caption ? <figcaption className="mt-3 text-center text-[11px] text-muted-foreground">{caption}</figcaption> : null}
    </figure>
  );
}

/** Kod ile çizilmiş hafif panel mockup'ı — alt özellik kartlarında kullanılır. */
export function MiniMock({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-3">
      <div className="rounded-lg border border-border bg-background p-3">{children}</div>
    </div>
  );
}

export function MockBars({ items }: { items: { label: string; value: number; tone?: "primary" | "muted" }[] }) {
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="truncate">{item.label}</span>
            <span className="font-mono">{item.value}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className={item.tone === "muted" ? "h-full rounded-full bg-muted-foreground/40" : "h-full rounded-full bg-primary"}
              style={{ width: `${Math.min(100, Math.max(3, item.value))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MockRows({ rows }: { rows: { left: string; right: string; badge?: string }[] }) {
  return (
    <div className="divide-y divide-border">
      {rows.map((row) => (
        <div key={row.left} className="flex items-center justify-between gap-2 py-2 text-[11px]">
          <span className="truncate text-foreground">{row.left}</span>
          <span className="flex shrink-0 items-center gap-1.5">
            {row.badge ? (
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-primary">{row.badge}</span>
            ) : null}
            <span className="font-mono text-muted-foreground">{row.right}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function MockSpark({ points, label }: { points: number[]; label: string }) {
  const max = Math.max(...points, 1);
  const path = points
    .map((p, i) => `${(i / (points.length - 1)) * 100},${34 - (p / max) * 30}`)
    .join(" ");
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <svg viewBox="0 0 100 36" className="mt-1.5 h-14 w-full" preserveAspectRatio="none" aria-hidden="true">
        <polyline points={path} fill="none" stroke="currentColor" strokeWidth="1.6" className="text-primary" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
