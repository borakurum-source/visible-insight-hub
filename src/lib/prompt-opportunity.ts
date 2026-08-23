// Fırsat Defteri çekirdek mantığı: saf, test edilebilir.
// Hiçbir I/O, hiçbir DB — ragsignalgeo'nun çekirdek fikirlerinin OneCite tiplerine uyarlanmış hâli.

import type { RowSource } from "./prompt-demand/types";

export type ObservationInput = {
  measured: boolean;
  ownDomainCited: boolean;
  brandMentioned: boolean;
};

export type PanelObservation = {
  model: string;
  measured: boolean;
  ownDomainCited: boolean;
  brandMentioned: boolean;
  position: number | null;
};

export type OpportunityStatus = "new" | "measuring" | "actionable" | "deferred" | "tracked" | "rejected";

export type OpportunityEvaluation = {
  status: OpportunityStatus;
  expectedValue: number | null;
  reason: string;
};

/**
 * Tek bir ölçüm gözlemini görünürlüğe çevir.
 * Kritik: gözlem yoksa null döner, hiçbir zaman sahte skor üretilmez.
 */
export function observedVisibility(o: ObservationInput): number | null {
  if (!o.measured) return null;  // Ölçülmediyse, skoru uydurmayız.
  if (o.ownDomainCited) return 100;  // Kendi domain'den kaynak gösterilmiş
  if (o.brandMentioned) return 50;   // Sadece marka adı geçiyor
  return 0;  // Ölçüldü ama hiçbir şey bulunamadı
}

/**
 * Panel: N gözlemin ortalaması. Sıfırları dahil eder (ölçülenler içinde).
 * Mesela: [100, 0, 50, 0] → 37.5
 */
export function panelVisibility(observations: PanelObservation[]): number | null {
  if (!observations.length) return null;
  const visibilities = observations.map((o) =>
    observedVisibility({
      measured: o.measured,
      ownDomainCited: o.ownDomainCited,
      brandMentioned: o.brandMentioned,
    })
  );
  const measured = visibilities.filter((v): v is number => v !== null);
  if (!measured.length) return null;
  return measured.reduce((s, v) => s + v, 0) / measured.length;
}

/**
 * Fırsat durum makinesi.
 *
 * Kritik kural (ragsignalgeo'nun çekirdek fikri):
 * - observedDemand === null → uydurma, deferred
 * - demandSource === "estimated" → model tahmini, deferred
 * - observedVisibility === null → henüz ölçülmedi, deferred
 *
 * İkisi de varsa: expectedValue = demand × (1 − visibility/100)
 * İkisi de gözlemlendiyse: actionable
 *
 * status_reason kullanıcıya neyin eksik olduğunu söyler.
 */
export function evaluateOpportunity(input: {
  observedDemand: number | null;
  demandSource: RowSource;
  observedVisibility: number | null;
  observationCount: number;
}): OpportunityEvaluation {
  // Talep sinyali yoksa: deferred
  if (input.observedDemand === null) {
    return {
      status: "deferred",
      expectedValue: null,
      reason: "Talep sinyali eksik — GSC bağlı değil, GA4 yok veya ölçüm eşleşemedi",
    };
  }

  // Talep sadece modelin tahmini: deferred (gözlem değil)
  if (input.demandSource === "estimated") {
    return {
      status: "deferred",
      expectedValue: null,
      reason: "Talep henüz ölçülmedi — GSC veya ölçümü bekleniyor",
    };
  }

  // Görünürlük henüz ölçülmediyse: measuring → deferred
  if (input.observedVisibility === null) {
    return {
      status: input.observationCount > 0 ? "measuring" : "new",
      expectedValue: null,
      reason: "Görünürlük henüz ölçülmedi",
    };
  }

  // İkisi de varsa: actionable + beklenen değer
  const clampedDemand = Math.max(0, Math.min(100, input.observedDemand));
  const clampedVisibility = Math.max(0, Math.min(100, input.observedVisibility));
  const expectedValue = Math.round(clampedDemand * (1 - clampedVisibility / 100));

  return {
    status: "actionable",
    expectedValue,
    reason: `Talep ${clampedDemand} / Görünürlük ${clampedVisibility}%`,
  };
}
