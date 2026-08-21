export const acquisitionBudget = Object.freeze({
  searchResults: 10,
  agentFetchPerQuery: 3,
  onboardingMapUrls: 1000,
  onboardingCrawlPages: 100,
  competitorPages: 30,
  activeCompetitors: 5,
});

const TRACKING_PARAMETERS = new Set([
  "fbclid",
  "gclid",
  "msclkid",
  "ref",
  "referrer",
  "mc_cid",
  "mc_eid",
]);

export function canonicalizeEvidenceUrl(raw: string): string {
  const url = new URL(raw.trim());
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
  url.hash = "";
  const kept = [...url.searchParams.entries()]
    .filter(
      ([key]) =>
        !key.toLowerCase().startsWith("utm_") && !TRACKING_PARAMETERS.has(key.toLowerCase()),
    )
    .sort(
      ([aKey, aValue], [bKey, bValue]) => aKey.localeCompare(bKey) || aValue.localeCompare(bValue),
    );
  url.search = "";
  for (const [key, value] of kept) url.searchParams.append(key, value);
  url.pathname = url.pathname.replace(/\/{2,}/g, "/");
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/$/, "");
  return url.toString();
}

export type AcquisitionProvenance = "perplexity_fetch" | "firecrawl_scrape";

export function decideAcquisition(input: {
  url: string;
  cachedUntil?: string | null;
  highValue?: boolean;
  jsHeavy?: boolean;
}): {
  action: "cache" | "fetch";
  canonicalUrl: string;
  provider: AcquisitionProvenance | null;
} {
  const canonicalUrl = canonicalizeEvidenceUrl(input.url);
  if (input.cachedUntil && new Date(input.cachedUntil).getTime() > Date.now()) {
    return { action: "cache", canonicalUrl, provider: null };
  }
  return {
    action: "fetch",
    canonicalUrl,
    provider: input.jsHeavy ? "firecrawl_scrape" : "perplexity_fetch",
  };
}
