// Faithful port of client/src/components/panel-page-heading.tsx. Each route
// supplies its own meta object (title/description/icon) instead of looking
// it up from a pathname table, since TanStack routes are already 1:1 with
// pages.
import type { LucideIcon } from "lucide-react";
import { Hint } from "@/components/app/hint";

export type PanelPageMeta = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function PanelPageHeading({ meta, action, hint }: { meta: PanelPageMeta; action?: React.ReactNode; hint?: React.ReactNode }) {
  const Icon = meta.icon;

  return (
    <header
      className="flex flex-col gap-4 border-b border-border/80 pb-4 lg:flex-row lg:items-center lg:justify-between"
      aria-label="Sayfa başlığı ve bağlamsal eylemler"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h1 className="flex items-center gap-1.5 text-lg font-semibold tracking-[-0.015em] text-foreground">
            {meta.title}
            {hint ? <Hint title={meta.title}>{hint}</Hint> : null}
          </h1>
          <p className="mt-0.5 max-w-2xl text-sm leading-5 text-muted-foreground">{meta.description}</p>
        </div>
      </div>
      {action && <div className="flex flex-wrap items-center gap-2 lg:justify-end">{action}</div>}
    </header>
  );
}
