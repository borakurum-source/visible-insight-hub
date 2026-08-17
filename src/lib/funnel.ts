export type FunnelStage = "top" | "middle" | "bottom";

export const FUNNEL_STAGES: FunnelStage[] = ["top", "middle", "bottom"];

export const FUNNEL_LABEL: Record<FunnelStage, string> = {
  top: "Huni ustu",
  middle: "Huni ortasi",
  bottom: "Huni alti",
};

export const FUNNEL_HINT: Record<FunnelStage, string> = {
  top: "Farkindalik: kullanici sorunu yeni arastiriyor.",
  middle: "Degerlendirme: secenekleri karsilastiriyor.",
  bottom: "Satin alma: saglayici secmeye hazir.",
};

export function normalizeFunnel(value: unknown): FunnelStage {
  const raw = String(value ?? "").toLowerCase();
  return raw === "top" || raw === "bottom" ? raw : "middle";
}
