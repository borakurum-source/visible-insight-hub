import { recordApiUsage } from "./observability.server";
import { acquisitionBudget } from "./acquisition-policy.server";

type FirecrawlOptions = {
  apiKey?: string;
  fetch?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
};

export type FirecrawlPage = {
  url: string;
  title: string;
  description?: string;
  markdown?: string;
  metadata?: Record<string, unknown>;
};

export function createFirecrawlV2(options: FirecrawlOptions = {}) {
  const apiKey = options.apiKey ?? process.env["FIRECRAWL_API_KEY"];
  const fetchImpl = options.fetch ?? fetch;
  const sleep =
    options.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));

  async function request<T>(operation: string, body: object): Promise<T> {
    if (!apiKey) throw new Error("FIRECRAWL_API_KEY missing");
    const startedAt = Date.now();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetchImpl(`https://api.firecrawl.dev/v2/${operation}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(90_000),
      });
      const text = await response.text();
      if (response.ok) {
        const payload = JSON.parse(text) as T;
        recordApiUsage({ provider: "firecrawl", operation, durationMs: Date.now() - startedAt });
        return payload;
      }
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === 2) {
        recordApiUsage({
          provider: "firecrawl",
          operation,
          durationMs: Date.now() - startedAt,
          status: response.status === 429 ? "rate_limited" : "error",
          error: `${response.status} ${text.slice(0, 500)}`,
        });
        throw new Error(
          `Firecrawl ${operation} failed [${response.status}]: ${text.slice(0, 500)}`,
        );
      }
      await sleep(500 * 2 ** attempt);
    }
    throw new Error(`Firecrawl ${operation} retry loop exhausted`);
  }

  async function map(
    url: string,
    limit = acquisitionBudget.onboardingMapUrls,
  ): Promise<FirecrawlPage[]> {
    const payload = await request<{
      links?: Array<{ url?: string; title?: string; description?: string }>;
    }>("map", {
      url,
      sitemap: "include",
      includeSubdomains: false,
      ignoreQueryParameters: true,
      limit: Math.min(limit, acquisitionBudget.onboardingMapUrls),
      timeout: 60_000,
    });
    return (payload.links ?? []).flatMap((link) =>
      link.url
        ? [{ url: link.url, title: link.title ?? link.url, description: link.description }]
        : [],
    );
  }

  async function scrape(url: string, changeTracking = false) {
    return request<Record<string, unknown>>("scrape", {
      url,
      formats: changeTracking
        ? ["markdown", { type: "changeTracking", modes: ["git-diff"] }]
        : ["markdown"],
      onlyMainContent: true,
      maxAge: 86_400_000,
      storeInCache: true,
      timeout: 60_000,
    });
  }

  async function crawl(url: string, limit: number, kind: "brand" | "competitor" = "brand") {
    const cap =
      kind === "competitor"
        ? acquisitionBudget.competitorPages
        : acquisitionBudget.onboardingCrawlPages;
    return request<{ id?: string; url?: string }>("crawl", {
      url,
      sitemap: "include",
      ignoreQueryParameters: true,
      limit: Math.min(limit, cap),
      crawlEntireDomain: false,
      allowExternalLinks: false,
      allowSubdomains: false,
      ignoreRobotsTxt: false,
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true, maxAge: 86_400_000 },
    });
  }

  async function search(query: string, input?: { country?: string; includeDomains?: string[] }) {
    return request<Record<string, unknown>>("search", {
      query,
      limit: acquisitionBudget.searchResults,
      sources: ["web"],
      country: input?.country ?? "TR",
      includeDomains: input?.includeDomains,
      ignoreInvalidURLs: true,
      timeout: 60_000,
    });
  }

  return {
    map,
    crawl,
    scrape,
    search,
    /** Firecrawl v2 degisim izleme, scrape'in changeTracking formatiyla yapilir. */
    monitor: (url: string) => scrape(url, true),
  };
}

export const firecrawlV2 = createFirecrawlV2();
