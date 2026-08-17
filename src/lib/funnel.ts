export type FunnelStage = "top" | "middle" | "bottom";

export const FUNNEL_STAGES: FunnelStage[] = ["top", "middle", "bottom"];

export const FUNNEL_LABEL: Record<FunnelStage, string> = {
  top: "Huni üstü",
  middle: "Huni ortası",
  bottom: "Huni altı",
};

export const FUNNEL_HINT: Record<FunnelStage, string> = {
  top: "Farkındalık: kullanıcı sorunu yeni araştırıyor.",
  middle: "Değerlendirme: seçenekleri karşılaştırıyor.",
  bottom: "Satın alma: sağlayıcı seçmeye hazır.",
};

export function normalizeFunnel(value: unknown): FunnelStage {
  const raw = String(value ?? "").toLowerCase();
  return raw === "top" || raw === "bottom" ? raw : "middle";
}
