import type { ReactNode } from "react";

export function WizardFrame({
  title,
  subtitle,
  step,
  total,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  step: number;
  total: number;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 py-4">
      <header className="space-y-2 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mx-auto max-w-xl text-sm text-muted-foreground">{subtitle}</p> : null}
      </header>
      <div className="space-y-5">{children}</div>
      {footer ? <div className="flex flex-wrap items-center justify-center gap-3 pt-2">{footer}</div> : null}
      <div className="flex items-center justify-center gap-2 pt-1" aria-label={`Adım ${step} / ${total}`}>
        {Array.from({ length: total }).map((_, index) => (
          <span
            key={index}
            className={`h-1.5 rounded-full transition-all ${index + 1 === step ? "w-5 bg-primary" : index + 1 < step ? "w-1.5 bg-primary/60" : "w-1.5 bg-muted-foreground/25"}`}
          />
        ))}
      </div>
    </div>
  );
}
