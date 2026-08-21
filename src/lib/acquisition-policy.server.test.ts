import { describe, expect, it } from "vitest";

import {
  acquisitionBudget,
  canonicalizeEvidenceUrl,
  decideAcquisition,
} from "./acquisition-policy.server";

describe("canonical evidence acquisition", () => {
  it("removes tracking noise while preserving meaningful sorted query parameters", () => {
    expect(canonicalizeEvidenceUrl("HTTPS://www.Example.com/a/?utm_source=x&b=2&a=1#section")).toBe(
      "https://example.com/a?a=1&b=2",
    );
  });

  it("does not fetch the same fresh canonical URL twice", () => {
    expect(
      decideAcquisition({ url: "https://example.com", cachedUntil: "2099-01-01T00:00:00.000Z" }),
    ).toEqual({
      action: "cache",
      canonicalUrl: "https://example.com/",
      provider: null,
    });
  });

  it("uses Agent fetch for selected evidence and Firecrawl for deterministic JS fallback", () => {
    expect(decideAcquisition({ url: "https://example.com/report", highValue: true })).toMatchObject(
      {
        action: "fetch",
        provider: "perplexity_fetch",
      },
    );
    expect(decideAcquisition({ url: "https://example.com/app", jsHeavy: true })).toMatchObject({
      action: "fetch",
      provider: "firecrawl_scrape",
    });
  });

  it("keeps balanced plan limits in one configuration", () => {
    expect(acquisitionBudget).toEqual({
      searchResults: 10,
      agentFetchPerQuery: 3,
      onboardingMapUrls: 1000,
      onboardingCrawlPages: 100,
      competitorPages: 30,
      activeCompetitors: 5,
    });
  });
});
