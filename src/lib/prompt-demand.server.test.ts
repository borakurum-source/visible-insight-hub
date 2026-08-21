import { describe, expect, it } from "vitest";

import { candidateFromExpansion } from "./prompt-demand.server";

describe("demand source truth", () => {
  it("never turns model or Firecrawl counts into observed search volume", () => {
    const row = candidateFromExpansion({
      text: "en iyi geo platformu hangisi",
      intent: "commercial",
      shape: "question",
      semanticConfidence: 0.8,
      monthlyVolume: 99999,
      relatedVolume: 55555,
      autocompleteStrength: 1,
      trend: 1.5,
    });

    expect(row?.signal).toEqual({
      directVolume: 0,
      relatedVolume: 0,
      autocompleteStrength: 0.5,
      historicalTrend: 1,
    });
    expect(row?.origin).toBe("model");
    expect(row?.source).toBe("estimated");
  });
});
