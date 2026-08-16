type ChatMessage = { role: "system" | "user"; content: string };

export type PerplexityResult<T> = { result: T; citations: string[] };

function normalizeDomainFromUrl(raw: string): string {
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return url.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return raw.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").replace(/^www\./i, "").toLowerCase();
  }
}

export async function perplexityJson<T>(
  messages: ChatMessage[],
  schema: { name: string; schema: object },
  fallback: T,
): Promise<PerplexityResult<T>> {
  const key = process.env["PERPLEXITY_API_KEY"];
  if (!key) {
    console.warn("PERPLEXITY_API_KEY missing");
    return { result: fallback, citations: [] };
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
    });
    const bodyText = await res.text();
    if (!res.ok) {
      console.error("Perplexity error", res.status, bodyText);
      if (res.status === 401 && bodyText.includes("insufficient_quota")) {
        throw new Error("Perplexity API credits exhausted. Buy credits at https://console.perplexity.ai");
      }
      return { result: fallback, citations: [] };
    }
    const json = JSON.parse(bodyText) as {
      choices?: Array<{ message?: { content?: string } }>;
      citations?: string[];
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return { result: fallback, citations: json.citations ?? [] };
    return { result: JSON.parse(content) as T, citations: json.citations ?? [] };
  } catch (error) {
    console.error("Perplexity failure", error);
    return { result: fallback, citations: [] };
  }
}

export async function perplexitySearch(messages: ChatMessage[]): Promise<{ answer: string; citations: string[] }> {
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
    if (res.status === 401 && bodyText.includes("insufficient_quota")) {
      throw new Error("Perplexity API credits exhausted. Buy credits at https://console.perplexity.ai");
    }
    throw new Error(`Perplexity request failed [${res.status}]: ${bodyText}`);
  }
  const json = JSON.parse(bodyText) as {
    choices?: Array<{ message?: { content?: string } }>;
    citations?: string[];
  };
  return {
    answer: json.choices?.[0]?.message?.content ?? "",
    citations: json.citations ?? [],
  };
}

export function extractDomainsFromCitations(citations: string[]): string[] {
  return Array.from(new Set(citations.map(normalizeDomainFromUrl).filter((d) => d.includes("."))));
}
