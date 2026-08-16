type ChatMessage = { role: "system" | "user"; content: string };

export async function aiJson<T>(messages: ChatMessage[], fallback: T): Promise<T> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return fallback;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      console.error("AI gateway error", res.status, await res.text());
      return fallback;
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return fallback;
    return JSON.parse(content) as T;
  } catch (error) {
    console.error("AI gateway failure", error);
    return fallback;
  }
}

export function normalizeDomain(raw: string): string {
  return raw.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").replace(/^www\./i, "").toLowerCase();
}

export async function fetchSiteText(domain: string): Promise<string> {
  try {
    const res = await fetch(`https://${domain}`, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; OneCiteBot/1.0)" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .slice(0, 12000);
  } catch {
    return "";
  }
}

export async function fetchSitemapUrls(domain: string): Promise<string[]> {
  for (const path of ["/sitemap.xml", "/sitemap_index.xml"]) {
    try {
      const res = await fetch(`https://${domain}${path}`, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;
      const xml = await res.text();
      const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1] ?? "");
      const pages = urls.filter((u) => u && !/\.xml$/i.test(u));
      if (pages.length) return pages.slice(0, 40);
    } catch {
      /* ignore */
    }
  }
  return [];
}
