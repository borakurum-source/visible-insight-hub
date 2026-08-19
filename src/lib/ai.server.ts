type ChatMessage = { role: "system" | "user"; content: string };

const NO_CIRCUMFLEX_RULE =
  "Yaz\u0131m kural\u0131: \u00e2 ve \u00c2 karakterlerini asla kullanma; her zaman a ve A yaz.";

/** Uretilen tum metinlerden duzeltme isaretli a karakterini temizler. */
export function stripCircumflex<T>(value: T): T {
  if (typeof value === "string") return value.replace(/\u00e2/g, "a").replace(/\u00c2/g, "A") as unknown as T;
  if (Array.isArray(value)) return value.map((item) => stripCircumflex(item)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = stripCircumflex(v);
    return out as unknown as T;
  }
  return value;
}

export async function aiJson<T>(messages: ChatMessage[], fallback: T, options?: { maxTokens?: number }): Promise<T> {
  // Üretim ve analiz işlemleri yalnızca DeepSeek üzerinden çalışır (önbellekli).
  if (!process.env["DEEPSEEK_API_KEY"]) {
    console.warn("DEEPSEEK_API_KEY missing");
    return fallback;
  }
  try {
    const { deepseekJson } = await import("./deepseek.server");
    const withRule: ChatMessage[] = messages.map((m, i) =>
      i === 0 && m.role === "system" ? { ...m, content: `${m.content}\n${NO_CIRCUMFLEX_RULE}` } : m,
    );
    if (!withRule.some((m) => m.role === "system")) withRule.unshift({ role: "system", content: NO_CIRCUMFLEX_RULE });
    return stripCircumflex(await deepseekJson<T>(withRule, fallback, options));
  } catch (error) {
    console.error("DeepSeek failure", error);
    return fallback;
  }
}

export function normalizeDomain(raw: string): string {
  return raw.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").replace(/^www\./i, "").toLowerCase();
}

// Marka zekasi taramasi da bilgi bankasiyla ayni temiz cikarim katmanini kullanir.
export async function fetchSiteText(domain: string): Promise<string> {
  const { fetchExtracted } = await import("./extract.server");
  const outcome = await fetchExtracted(`https://${domain}`);
  if (outcome.status !== "ok") return "";
  return [outcome.page.structured, outcome.page.text].filter(Boolean).join("\n\n").slice(0, 40000);
}

async function readXml(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; OneCiteBot/1.0; +https://1cite.com)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

function locations(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((match) => (match[1] ?? "").trim()).filter(Boolean);
}

// Yuksek kanit degeri tasiyan yollar once, hukuki/dusuk degerli yollar en sona.
function urlPriority(url: string): number {
  const path = url.toLowerCase();
  if (/(kvkk|gizlilik|privacy|cerez|çerez|cookie|kullanim-kosullari|terms|mesafeli|iade|refund|tag|etiket|author|yazar|\?)/.test(path)) return 9;
  if (/\/(hakkimizda|hakkinda|about|kurumsal)/.test(path)) return 1;
  if (/(urun|ürün|product|hizmet|service|cozum|çözüm|solution)/.test(path)) return 2;
  if (/(fiyat|price|pricing|paket|plan)/.test(path)) return 2;
  if (/(sss|faq|sikca-sorulan)/.test(path)) return 3;
  if (/(vaka|case|referans|musteri|müşteri)/.test(path)) return 4;
  if (/(blog|haber|news|makale|article)/.test(path)) return 7;
  const depth = (path.split("/").length || 1) - 3;
  return 5 + Math.min(depth, 2);
}

/** robots.txt + sitemap index dahil, onceliklendirilmis sayfa listesi. */
export async function fetchSitemapUrls(domain: string, limit = 40): Promise<string[]> {
  const roots = new Set<string>();

  const robots = await readXml(`https://${domain}/robots.txt`);
  for (const line of robots.split("\n")) {
    const match = line.match(/^\s*sitemap:\s*(\S+)/i);
    if (match?.[1]) roots.add(match[1]);
  }
  roots.add(`https://${domain}/sitemap.xml`);
  roots.add(`https://${domain}/sitemap_index.xml`);

  const pages = new Set<string>();
  const childSitemaps: string[] = [];

  for (const root of [...roots].slice(0, 5)) {
    const xml = await readXml(root);
    if (!xml) continue;
    for (const loc of locations(xml)) {
      if (/\.xml(\.gz)?$/i.test(loc)) childSitemaps.push(loc);
      else pages.add(loc);
    }
  }

  // Sitemap index ise bir seviye asagi in.
  for (const child of childSitemaps.slice(0, 5)) {
    if (pages.size >= limit * 4) break;
    const xml = await readXml(child);
    for (const loc of locations(xml)) if (!/\.xml(\.gz)?$/i.test(loc)) pages.add(loc);
  }

  return [...pages]
    .filter((url) => urlPriority(url) < 9)
    .sort((a, b) => urlPriority(a) - urlPriority(b) || a.length - b.length)
    .slice(0, limit);
}
