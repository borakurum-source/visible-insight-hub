import { z } from "zod";

import { aiGateway, type AiMessage } from "./ai-gateway.server";

type ChatMessage = { role: "system" | "user"; content: string };

export type CitationSource = { url: string; domain: string; title: string };
export type PerplexityResult<T> = { result: T; citations: string[]; sources: CitationSource[] };

function normalizeDomainFromUrl(raw: string): string {
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return url.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return raw
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "")
      .replace(/^www\./i, "")
      .toLowerCase();
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
    if (!out.has(url))
      out.set(url, {
        url,
        domain,
        title: String(item?.title ?? item?.name ?? "").trim() || domain,
      });
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

type JsonSchema = {
  type?: string;
  enum?: unknown[];
  required?: string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
};

function matchesJsonSchema(value: unknown, schema: JsonSchema): boolean {
  if (schema.enum && !schema.enum.some((item) => Object.is(item, value))) return false;
  if (schema.type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const record = value as Record<string, unknown>;
    if ((schema.required ?? []).some((key) => !(key in record))) return false;
    return Object.entries(schema.properties ?? {}).every(
      ([key, child]) => !(key in record) || matchesJsonSchema(record[key], child),
    );
  }
  if (schema.type === "array")
    return (
      Array.isArray(value) && value.every((item) => matchesJsonSchema(item, schema.items ?? {}))
    );
  if (schema.type === "integer") return typeof value === "number" && Number.isInteger(value);
  if (schema.type === "number") return typeof value === "number" && Number.isFinite(value);
  if (schema.type === "string") return typeof value === "string";
  if (schema.type === "boolean") return typeof value === "boolean";
  if (schema.type === "null") return value === null;
  return true;
}

export async function perplexityJson<T>(
  messages: ChatMessage[],
  schema: { name: string; schema: object },
  _legacyFallbackShape: T,
): Promise<PerplexityResult<T>> {
  const { withCache, CACHE_TTL } = await import("./cache.server");
  return withCache<PerplexityResult<T>>(
    "perplexity",
    { messages, schema, surface: "agent_web_grounded" },
    CACHE_TTL.perplexity,
    async () => {
      const response = await aiGateway.json({
        role: "search_fast",
        messages: messages as AiMessage[],
        tools: [{ type: "web_search" }],
        schema: z.custom<T>((value) => matchesJsonSchema(value, schema.schema as JsonSchema), {
          message: "Output does not match the requested JSON schema",
        }),
        jsonSchema: schema,
        maxOutputTokens: 2048,
      });
      return {
        result: response.data,
        citations: response.citations,
        sources: response.sources.map(({ url, domain, title }) => ({ url, domain, title })),
      };
    },
    (value) => Boolean(value.result),
  );
}

export async function perplexitySearch(
  messages: ChatMessage[],
): Promise<{ answer: string; citations: string[] }> {
  const { withCache, CACHE_TTL } = await import("./cache.server");
  return withCache(
    "perplexity",
    { search: messages, surface: "agent_web_grounded" },
    CACHE_TTL.perplexity,
    async () => {
      const response = await aiGateway.text({
        role: "search_fast",
        messages: messages as AiMessage[],
        tools: [{ type: "web_search" }],
        maxOutputTokens: 2048,
      });
      return { answer: response.data, citations: response.citations };
    },
    (value) => Boolean(value.answer),
  );
}

export function extractDomainsFromCitations(citations: string[]): string[] {
  return Array.from(
    new Set(citations.map(normalizeDomainFromUrl).filter((domain) => domain.includes("."))),
  );
}
