// Port of the reusable bits of client/src/pages/panel-shared.tsx that are
// still relevant without a live backend: small display primitives used
// across the panel pages (KPI cards, status/sentiment badges, info tips).
import type { ReactNode } from "react";
import { HelpCircle, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex text-muted-foreground transition-colors hover:text-foreground" aria-label="Açıklama">
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-xs leading-relaxed">{text}</TooltipContent>
    </Tooltip>
  );
}

export function KpiCard({
  icon,
  label,
  value,
  sub,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="shrink-0 rounded-md bg-accent p-2 text-accent-foreground">{icon}</div>
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-xs leading-tight text-muted-foreground">
            {label}
            {hint && <InfoTip text={hint} />}
          </p>
          <p className="mt-0.5 text-xl font-semibold leading-tight tabular-nums">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return ok ? (
    <Badge variant="outline" className="gap-1 border-[hsl(var(--chart-2))] text-[hsl(var(--chart-2))]">
      <CheckCircle2 className="h-3 w-3" /> {label}
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <XCircle className="h-3 w-3" /> {label}
    </Badge>
  );
}

const ACTION_STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: "Taslak", className: "text-muted-foreground" },
  queued_computer: { label: "Computer'da Kuyrukta", className: "text-[hsl(var(--chart-5))] border-[hsl(var(--chart-5))]" },
  done_manual: { label: "Manuel Tamamlandı", className: "text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]" },
  done_computer: { label: "Computer Tamamladı", className: "text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]" },
};

export function ActionStatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  const cfg = ACTION_STATUS_MAP[status] ?? ACTION_STATUS_MAP['draft']!;
  return <Badge variant="outline" className={`text-xs ${cfg.className}`}>{cfg.label}</Badge>;
}

const FUNNEL_STAGE_MAP: Record<string, { label: string; className: string }> = {
  tofu: { label: "TOFU · Farkındalık", className: "text-[hsl(var(--chart-5))] border-[hsl(var(--chart-5))]" },
  mofu: { label: "MOFU · Değerlendirme", className: "text-[hsl(var(--chart-1))] border-[hsl(var(--chart-1))]" },
  bofu: { label: "BOFU · Karar", className: "text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]" },
};

export function FunnelStageBadge({ stage }: { stage: string | null | undefined }) {
  if (!stage || !FUNNEL_STAGE_MAP[stage]) return <span className="text-xs text-muted-foreground">—</span>;
  const cfg = FUNNEL_STAGE_MAP[stage];
  return <Badge variant="outline" className={`whitespace-nowrap text-xs ${cfg.className}`}>{cfg.label}</Badge>;
}

const SENTIMENT_MAP: Record<string, { label: string; className: string }> = {
  positive: { label: "Olumlu", className: "text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]" },
  neutral: { label: "Nötr", className: "text-muted-foreground border-border" },
  negative: { label: "Olumsuz", className: "text-destructive border-destructive/40" },
};
const POSITION_MAP: Record<string, string> = { early: "Erken", mid: "Orta", late: "Geç" };

export function SentimentPositionTag({
  position,
  sentiment,
}: {
  position: "early" | "mid" | "late" | null;
  sentiment: "positive" | "neutral" | "negative" | null;
}) {
  if (!sentiment && !position) return null;
  const cfg = sentiment ? SENTIMENT_MAP[sentiment] : null;
  return (
    <div className="mt-1 flex items-center gap-1">
      {cfg && <Badge variant="outline" className={`px-1 py-0 text-[10px] ${cfg.className}`}>{cfg.label}</Badge>}
      {position && <span className="text-[10px] text-muted-foreground">{POSITION_MAP[position]}</span>}
    </div>
  );
}
