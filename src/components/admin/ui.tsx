import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-white md:text-2xl">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-slate-400">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function AdminCard({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-white/10 bg-[#0B1220] p-4 md:p-5", className)}>
      {title || action ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? <h2 className="text-sm font-semibold text-white">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint, tone = "default" }: { label: string; value: ReactNode; hint?: string; tone?: "default" | "good" | "warn" | "bad" }) {
  const toneClass =
    tone === "good" ? "text-emerald-400" : tone === "warn" ? "text-amber-400" : tone === "bad" ? "text-red-400" : "text-white";
  return (
    <div className="rounded-xl border border-white/10 bg-[#0B1220] p-4">
      <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className={cn("mt-2 text-2xl font-bold tabular-nums", toneClass)}>{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

export function Pill({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "good" | "warn" | "bad" | "info" }) {
  const map = {
    default: "bg-white/5 text-slate-300 border-white/10",
    good: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    warn: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    bad: "bg-red-500/10 text-red-300 border-red-500/30",
    info: "bg-cyan/10 text-cyan border-cyan/30",
  } as const;
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", map[tone])}>{children}</span>;
}

export function EmptyRow({ children, colSpan }: { children: ReactNode; colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-8 text-center text-sm text-slate-500">{children}</td>
    </tr>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
            {head.map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">{children}</tbody>
      </table>
    </div>
  );
}

export const money = (value: number) => `$${value.toFixed(value < 10 ? 3 : 2)}`;
export const dateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "—";
export const dateOnly = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("tr-TR", { dateStyle: "medium" }) : "—";

export const PLAN_LABEL: Record<string, string> = {
  trial: "Deneme",
  expired: "Süresi doldu",
  free: "Ücretsiz",
  starter: "Starter",
  growth: "Growth",
  agency: "Agency",
};
