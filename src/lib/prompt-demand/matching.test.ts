import { describe, expect, it } from "vitest";
import { cosine, prefilterCandidates, bestMatch, thresholdsFor } from "./matching.server";
import { MATCH_PAIRS } from "./__fixtures__/match-pairs";
import { impressionsToDemand, calibrationRatio, demandRange, ga4ClickSignal } from "./engine";

describe("cosine", () => {
  it("özdeş vektörlerde 1, dik vektörlerde 0 döner", () => {
    expect(cosine([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 6);
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0, 6);
  });
  it("boş veya sıfır vektörde 0 döner (NaN sızdırmaz)", () => {
    expect(cosine([], [1, 2])).toBe(0);
    expect(cosine([0, 0], [1, 2])).toBe(0);
  });
});

describe("prefilterCandidates", () => {
  it("doğru eşleşmelerin hedef sorgusunu ön filtreden geçirir", () => {
    const positives = MATCH_PAIRS.filter((p) => p.expected);
    const queries = MATCH_PAIRS.map((p) => p.query);
    let recalled = 0;
    positives.forEach((pair) => {
      const pool = prefilterCandidates(pair.candidate, queries);
      if (pool.includes(queries.indexOf(pair.query))) recalled += 1;
    });
    // On filtre kosinus hesabindan once calisir; dogru esleşmeyi elemesi en pahali hatadir.
    expect(recalled / positives.length).toBeGreaterThanOrEqual(0.9);
  });
});

describe("bestMatch — Jaccard yedeği (embedding yokken)", () => {
  const { measuredPromptMatch } = thresholdsFor();
  it("vektör yokken de karar üretir ve eşiğin altını reddeder", () => {
    const queries = ["yapay zeka görünürlük aracı", "yapay zeka hisse senedi fiyatları"];
    const hit = bestMatch("yapay zeka görünürlük aracı", queries, null, measuredPromptMatch, 0.55);
    expect(hit?.method).toBe("jaccard");
    expect(hit?.index).toBe(0);
    const miss = bestMatch("kargo entegrasyonu", queries, null, measuredPromptMatch, 0.99);
    expect(miss).toBeNull();
  });
  it("eşiğe çok yakın kabulleri borderline işaretler", () => {
    const hit = bestMatch("ai görünürlük aracı", ["ai görünürlük aracı"], null, 0.8, 0.99);
    expect(hit?.borderline).toBe(true);
  });
});

describe("impressionsToDemand", () => {
  it("gösterimi CTR eğrisiyle büyütür ve üst sınırı aşmaz", () => {
    const top = impressionsToDemand(100, 1);
    expect(top.ctr).toBe(0.27);
    expect(top.demand).toBe(Math.round(100 / 0.27));
    const deep = impressionsToDemand(100, 50);
    // 1/0.008 = 125 ama carpan CTR_MAX_MULTIPLIER (12) ile kirpilir.
    expect(deep.demand).toBe(1200);
  });
  it("negatif gösterimde 0 döner", () => {
    expect(impressionsToDemand(-5, 3).demand).toBe(0);
  });
});

describe("calibrationRatio", () => {
  it("yetersiz örneklemde uygulanmaz", () => {
    const info = calibrationRatio([{ actual: 100, predicted: 50 }]);
    expect(info.applied).toBe(false);
    expect(info.matchedSampleSize).toBe(1);
  });
  it("yeterli örneklemde ortanca oranı döner ve sınırlar içinde kalır", () => {
    const pairs = Array.from({ length: 6 }, () => ({ actual: 200, predicted: 100 }));
    const info = calibrationRatio(pairs);
    expect(info.applied).toBe(true);
    expect(info.ratio).toBe(2);
    const extreme = calibrationRatio(Array.from({ length: 6 }, () => ({ actual: 10000, predicted: 1 })));
    expect(extreme.ratio).toBe(4); // CALIBRATION_CLAMP.max
  });
});

describe("demandRange", () => {
  it("güven arttıkça bant daralır", () => {
    const low = demandRange(1000, 0.2);
    const high = demandRange(1000, 0.95);
    expect(high.high - high.low).toBeLessThan(low.high - low.low);
    expect(low.mid).toBe(1000);
  });
});

describe("ga4ClickSignal", () => {
  it("bağlı değilken veya örneklem küçükken güvenilmez işaretler", () => {
    expect(ga4ClickSignal({ connected: false, referralSessions: 0, predictedDemand: 100 }).hasEnoughData).toBe(false);
    expect(ga4ClickSignal({ connected: true, referralSessions: 5, predictedDemand: 100 }).hasEnoughData).toBe(false);
  });
  it("yeterli oturumda tıklanma tutarlılığı üretir", () => {
    const signal = ga4ClickSignal({ connected: true, referralSessions: 500, predictedDemand: 1000 });
    expect(signal.hasEnoughData).toBe(true);
    expect(signal.clickConsistency).toBe("high");
  });
});
