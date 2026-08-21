type ChatMessage = { role: "system" | "user"; content: string };

export type CitationSource = { url: string; domain: string; title: string };
export type PerplexityResult<T> = { result: T; citations: string[]; sources: CitationSource[] };

function normalizeDomainFromUrl(raw: string): string {
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return url.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return raw.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").replace(/^www\./i, "").toLowerCase();
  }
}

type RawSearchResult = { url?: string; title?: string; name?: string };

export function buildCitationSources(
  citations: string[] | undefined,
  searchResults: RawSearchResult[] | undefined,
): CitationSource[] {
  const out = new Map<string, CitationSource>();
  for (const item of searchResults ?? []) {
    const url = String(item?.url ?? "").trim();
    if (!url) continue;
    const domain = normalizeDomainFromUrl(url);
    if (!domain.includes(".")) continue;
    if (!out.has(url)) out.set(url, { url, domain, title: String(item?.title ?? item?.name ?? "").trim() || domain });
  }
  for (const raw of citations ?? []) {
    const url = String(raw ?? "").trim();
    if (!url) continue;
    const domain = normalizeDomainFromUrl(url);
    if (!domain.includes(".")) continue;
    if (!out.has(url)) out.set(url, { url, domain, title: domain });
  }
  return Array.from(out.values());
}

export async function perplexityJson<T>(
  messages: ChatMessage[],
  schema: { name: string; schema: object },
  fallback: T,
): Promise<PerplexityResult<T>> {
  const { withCache, CACHE_TTL } = await import("./cache.server");
  return withCache<PerplexityResult<T>>(
    "perplexity",
    { messages, schema },
    CACHE_TTL.perplexity,
    () => perplexityJsonUncached(messages, schema, fallback),
    (value) => value.result !== fallback,
  );
}

async function perplexityJsonUncached<T>(
  messages: ChatMessage[],
  schema: { name: string; schema: object },
  fallback: T,
): Promise<PerplexityResult<T>> {
  const { recordApiUsage } = await import("./observability.server");
  const startedAt = Date.now();
  const key = process.env["PERPLEXITY_API_KEY"];
  if (!key) {
    console.warn("PERPLEXITY_API_KEY missing");
    throw new Error("PERPLEXITY_API_KEY missing");
  }
  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "sonar",
        messages,
        response_format: { type: "json_schema", json_schema: schema },
        max_tokens: 1024,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(30000),
    });
    const bodyText = await res.text();
    if (!res.ok) {
      console.error("Perplexity error", res.status, bodyText);
      recordApiUsage({
        provider: "perplexity", operation: "chat.json", model: "sonar",
        durationMs: Date.now() - startedAt,
        status: res.status === 429 ? "rate_limited" : "error",
        error: `${res.status} ${bodyText.slice(0, 400)}`,
      });
      if (res.status === 401 && bodyText.includes("insufficient_quota")) {
        throw new Error("Perplexity API credits exhausted. Buy credits at https://console.perplexity.ai");
      }
      throw new Error(`Perplexity request failed [${res.status}]: ${bodyText}`);
    }
    const json = JSON.parse(bodyText) as {
      choices?: Array<{ message?: { content?: string } }>;
      citations?: string[];
      search_results?: RawSearchResult[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    recordApiUsage({
      provider: "perplexity", operation: "chat.json", model: "sonar",
      durationMs: Date.now() - startedAt,
      inputTokens: json.usage?.prompt_tokens ?? 0,
      outputTokens: json.usage?.completion_tokens ?? 0,
    });
    const sources = buildCitationSources(json.citations, json.search_results);
    const content = json.choices?.[0]?.message?.content;
    if (!content) return { result: fallback, citations: json.citations ?? [], sources };
    return { result: JSON.parse(content) as T, citations: json.citations ?? [], sources };
  } catch (error) {
    console.error("Perplexity failure", error);
    throw error;
  }
}

export async function perplexitySearch(messages: ChatMessage[]): Promise<{ answer: string; citations: string[] }> {
  const { withCache, CACHE_TTL } = await import("./cache.server");
  return withCache(
    "perplexity",
    { search: messages },
    CACHE_TTL.perplexity,
    () => perplexitySearchUncached(messages),
    (value) => Boolean(value.answer),
  );
}

async function perplexitySearchUncached(
  messages: ChatMessage[],
): Promise<{ answer: string; citations: string[] }> {
  const { recordApiUsage } = await import("./observability.server");
  const startedAt = Date.now();
  const key = process.env["PERPLEXITY_API_KEY"];
  if (!key) throw new Error("PERPLEXITY_API_KEY missing");
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonar",
      messages,
      max_tokens: 1024,
      temperature: 0.2,
    }),
  });
  const bodyText = await res.text();
  if (!res.ok) {
    console.error("Perplexity error", res.status, bodyText);
    recordApiUsage({
      provider: "perplexity", operation: "search", model: "sonar",
      durationMs: Date.now() - startedAt,
      status: res.status === 429 ? "rate_limited" : "error",
      error: `${res.status} ${bodyText.slice(0, 400)}`,
    });
    if (res.status === 401 && bodyText.includes("insufficient_quota")) {
      throw new Error("Perplexity API credits exhausted. Buy credits at https://console.perplexity.ai");
    }
    throw new Error(`Perplexity request failed [${res.status}]: ${bodyText}`);
  }
  const json = JSON.parse(bodyText) as {
    choices?: Array<{ message?: { content?: string } }>;
    citations?: string[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  recordApiUsage({
    provider: "perplexity", operation: "search", model: "sonar",
    durationMs: Date.now() - startedAt,
    inputTokens: json.usage?.prompt_tokens ?? 0,
    outputTokens: json.usage?.completion_tokens ?? 0,
  });
  return {
    answer: json.choices?.[0]?.message?.content ?? "",
    citations: json.citations ?? [],
  };
}

export function extractDomainsFromCitations(citations: string[]): string[] {
  return Array.from(new Set(citations.map(normalizeDomainFromUrl).filter((d) => d.includes("."))));
}
