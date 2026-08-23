import { describe, it, expect } from "vitest";
import {
  observedVisibility,
  panelVisibility,
  evaluateOpportunity,
} from "./prompt-opportunity";

describe("prompt-opportunity", () => {
  describe("observedVisibility", () => {
    it("returns null if not measured", () => {
      expect(observedVisibility({ measured: false, ownDomainCited: false, brandMentioned: false })).toBe(null);
    });

    it("returns 100 if own domain cited", () => {
      expect(observedVisibility({ measured: true, ownDomainCited: true, brandMentioned: false })).toBe(100);
    });

    it("returns 50 if only brand mentioned", () => {
      expect(observedVisibility({ measured: true, ownDomainCited: false, brandMentioned: true })).toBe(50);
    });

    it("returns 0 if measured but nothing found", () => {
      expect(observedVisibility({ measured: true, ownDomainCited: false, brandMentioned: false })).toBe(0);
    });
  });

  describe("panelVisibility", () => {
    it("returns null if empty", () => {
      expect(panelVisibility([])).toBe(null);
    });

    it("includes zeros in average", () => {
      // [100, 0, 50, 0] → 37.5
      expect(
        panelVisibility([
          { model: "a", measured: true, ownDomainCited: true, brandMentioned: false, position: null },
          { model: "b", measured: true, ownDomainCited: false, brandMentioned: false, position: null },
          { model: "c", measured: true, ownDomainCited: false, brandMentioned: true, position: null },
          { model: "d", measured: true, ownDomainCited: false, brandMentioned: false, position: null },
        ]),
      ).toBe(37.5);
    });

    it("returns null if all unmeasured", () => {
      expect(
        panelVisibility([
          { model: "a", measured: false, ownDomainCited: false, brandMentioned: false, position: null },
          { model: "b", measured: false, ownDomainCited: false, brandMentioned: false, position: null },
        ]),
      ).toBe(null);
    });
  });

  describe("evaluateOpportunity", () => {
    it("returns deferred if no observed demand", () => {
      const result = evaluateOpportunity({
        observedDemand: null,
        demandSource: "measured",
        observedVisibility: 50,
        observationCount: 2,
      });
      expect(result.status).toBe("deferred");
      expect(result.expectedValue).toBe(null);
      expect(result.reason).toContain("eksik");
    });

    it("returns deferred if demand is estimated (not gözlemlenen)", () => {
      const result = evaluateOpportunity({
        observedDemand: 60,
        demandSource: "estimated",
        observedVisibility: 50,
        observationCount: 2,
      });
      expect(result.status).toBe("deferred");
      expect(result.expectedValue).toBe(null);
    });

    it("returns measuring/deferred if visibility not yet measured", () => {
      const result = evaluateOpportunity({
        observedDemand: 60,
        demandSource: "measured",
        observedVisibility: null,
        observationCount: 0,
      });
      expect(result.status).toBe("new");
      expect(result.expectedValue).toBe(null);
    });

    it("returns actionable with expected value if both measured", () => {
      // demand 60 × (1 - visibility 50/100) = 60 × 0.5 = 30
      const result = evaluateOpportunity({
        observedDemand: 60,
        demandSource: "measured",
        observedVisibility: 50,
        observationCount: 2,
      });
      expect(result.status).toBe("actionable");
      expect(result.expectedValue).toBe(30);
    });

    it("clamps demand and visibility to 0-100 range", () => {
      const result = evaluateOpportunity({
        observedDemand: 150,
        demandSource: "measured",
        observedVisibility: -50,
        observationCount: 2,
      });
      expect(result.expectedValue).toBe(100); // 100 × (1 - 0/100) = 100
    });
  });
});
