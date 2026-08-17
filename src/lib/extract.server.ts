// HTML -> temiz metin cikarim katmani (DOM tabanli, cheerio).
// Amac: cerez bandi, menu, footer, form gibi gurultuyu atip yalnizca kanit degeri
// tasiyan ana icerigi, baslik hiyerarsisini ve JSON-LD verisini birakmak.
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";

export type ExtractedPage = {
  title: string;
  description: string;
  /** Basliklari "## Baslik" olarak koruyan temiz metin. */
  text: string;
  /** JSON-LD'den turetilmis yapisal ozet (varsa). */
  structured: string;
  /** Ham metnin ne kadarinin gurultu olarak atildigi (0-1). */
  noiseRatio: number;
  /** Icerigin nasil elde edildigi: statik fetch mi, JS render mi. */
  method: "static" | "render";
  /** Kosullu istek icin HTTP dogrulayicilar. */
  etag?: string | null;
  lastModified?: string | null;
};

const NOISE_SELECTORS = [
  "script", "style", "noscript", "template", "svg", "iframe", "form",
  "nav", "header", "footer", "aside", "dialog", "select", "button",
  "[hidden]", "[aria-hidden=true]",
];

// class/id/role icinde bu kaliplar geciyorsa dugum tamamen atilir.
const NOISE_PATTERN =
  /(cookie|consent|gdpr|kvkk|çerez|cerez|banner|popup|modal|newsletter|bulten|bülten|subscribe|abone|breadcrumb|sidebar|side-bar|menu|navbar|navigation|social|share|paylas|comment|yorum|related|benzer|promo|advert|\bads?\b|sticky|offcanvas|drawer|backdrop|skip-link|cta-bar|announcement)/i;

// Bu cumleler sayfadan bagimsiz gurultudur; satir bazinda atilir.
const NOISE_LINE_PATTERN =
  /(çerez|cerez|cookie|kvkk|gizlilik politikas|kullanım koşullar|kullanim kosullar|tüm hakları saklıdır|tum haklari saklidir|all rights reserved|bültenimize|bultenimize|newsletter|abone ol|subscribe|sepete ekle|giriş yap|giris yap|kayıt ol|kayit ol|menüyü aç|menuyu ac|we value your privacy|consent preferences|manage consent|accept all|reject all|customise consent|customize consent|privacy policy|terms of service|book a demo|sign in|sign up|log in)/i;

// Cerez tablosu satirlari: "1 year 1 month 4 days", "_ga | 2 years | ...".
const CONSENT_ROW_PATTERN =
  /^(_|\w+_)?[\w.-]*\s*\|?\s*(\d+\s*(year|month|day|hour|minute|second|yıl|ay|gün|saat)s?\b)/i;

function stripNoise($: CheerioAPI) {
  $(NOISE_SELECTORS.join(",")).remove();
  $("*").each((_, element) => {
    const node = $(element);
    const signature = [
      node.attr("class") ?? "",
      node.attr("id") ?? "",
      node.attr("role") ?? "",
      node.attr("data-testid") ?? "",
      node.attr("aria-label") ?? "",
    ].join(" ");
    if (signature.trim() && NOISE_PATTERN.test(signature)) node.remove();
  });
}

/** Ana icerik dugumu: once semantik seciciler, yoksa metin yogunlugu en yuksek blok. */
function pickMainContent($: CheerioAPI): cheerio.Cheerio<any> {
  for (const selector of ["main", "article", "[role=main]", "#content", "#main", ".content", ".entry-content"]) {
    const found = $(selector).first();
    if (found.length && found.text().replace(/\s+/g, " ").trim().length > 400) return found;
  }

  // Icerik yogunlugu: metin uzunlugu / link metni orani. Menuler otomatik elenir.
  let best: { node: cheerio.Cheerio<any>; score: number } | null = null;
  $("body div, body section").each((_, element) => {
    const node = $(element);
    const text = node.text().replace(/\s+/g, " ").trim();
    if (text.length < 500) return;
    const linkText = node.find("a").text().replace(/\s+/g, " ").trim().length;
    const density = 1 - Math.min(1, linkText / text.length);
    const paragraphs = node.find("p").length;
    const score = text.length * density * (1 + Math.min(paragraphs, 20) / 20);
    if (!best || score > best.score) best = { node, score };
  });
  if (best) return (best as { node: cheerio.Cheerio<any> }).node;
  return $("body").length ? $("body") : $.root();
}

function readJsonLd($: CheerioAPI): string {
  const lines: string[] = [];
  const wanted = new Set(["organization", "localbusiness", "product", "service", "faqpage", "offer", "aggregaterating"]);
  const visit = (node: unknown, depth = 0) => {
    if (depth > 4 || !node) return;
    if (Array.isArray(node)) { node.forEach((item) => visit(item, depth + 1)); return; }
    if (typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    const type = String(record["@type"] ?? "").toLowerCase();
    if (type && wanted.has(type)) {
      const fields = ["name", "description", "brand", "priceRange", "price", "areaServed", "slogan", "founder", "foundingDate", "telephone", "address"];
      const parts = fields
        .map((field) => {
          const value = record[field];
          if (!value) return "";
          if (typeof value === "string" || typeof value === "number") return `${field}: ${value}`;
          if (typeof value === "object") {
            const nested = value as Record<string, unknown>;
            const label = nested["name"] ?? nested["addressLocality"] ?? nested["value"];
            return label ? `${field}: ${String(label)}` : "";
          }
          return "";
        })
        .filter(Boolean);
      if (parts.length) lines.push(`${record["@type"]} — ${parts.join(" · ")}`);
      if (type === "faqpage") {
        const entities = record["mainEntity"];
        if (Array.isArray(entities)) {
          for (const item of entities.slice(0, 20)) {
            const question = (item as Record<string, unknown>)["name"];
            const answer = (item as Record<string, unknown>)["acceptedAnswer"] as Record<string, unknown> | undefined;
            const text = answer?.["text"];
            if (question && text) {
              lines.push(`SSS — ${String(question)}: ${cheerio.load(String(text)).text().replace(/\s+/g, " ").slice(0, 400)}`);
            }
          }
        }
      }
    }
    for (const value of Object.values(record)) visit(value, depth + 1);
  };
  $('script[type="application/ld+json"]').each((_, element) => {
    try { visit(JSON.parse($(element).text().trim())); } catch { /* bozuk json-ld yok sayilir */ }
  });
  return lines.slice(0, 30).join("\n");
}

/** Ana icerik dugumunu satir yapisi korunmus duz metne cevirir. */
function nodeToText($: CheerioAPI, root: cheerio.Cheerio<any>): string {
  root.find("h1, h2, h3").each((_, element) => {
    const node = $(element);
    node.replaceWith(`\n## ${node.text().replace(/\s+/g, " ").trim()}\n`);
  });
  root.find("h4, h5, h6").each((_, element) => {
    const node = $(element);
    node.replaceWith(`\n### ${node.text().replace(/\s+/g, " ").trim()}\n`);
  });
  root.find("li").each((_, element) => {
    const node = $(element);
    node.replaceWith(`\n- ${node.text().replace(/\s+/g, " ").trim()}\n`);
  });
  root.find("td, th").each((_, element) => {
    const node = $(element);
    node.replaceWith(` | ${node.text().replace(/\s+/g, " ").trim()}`);
  });
  root.find("br").replaceWith("\n");
  root.find("p, tr, div, section, h1, h2, h3, h4, h5, h6, blockquote").each((_, element) => {
    $(element).append("\n");
  });
  return root.text();
}

/** Ham HTML'i temiz, baslik hiyerarsisi korunmus metne cevirir. */
export function extractFromHtml(html: string, maxChars = 120000): ExtractedPage {
  const $ = cheerio.load(html);
  const rawLength = $.root().text().replace(/\s+/g, " ").trim().length;

  const title = ($("title").first().text() || $("h1").first().text() || "").replace(/\s+/g, " ").trim().slice(0, 200);
  const description = ($('meta[name="description"]').attr("content") ?? $('meta[property="og:description"]').attr("content") ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);
  const structured = readJsonLd($);

  stripNoise($);
  const main = pickMainContent($);
  const rawText = nodeToText($, main);

  const lines = rawText
    .split("\n")
    .map((line) => line.replace(/[ \t\u00a0]+/g, " ").trim())
    .filter((line) => {
      if (!line) return false;
      if (line.startsWith("##")) return line.replace(/#/g, "").trim().length > 1;
      if (line.length < 3) return false;
      if (NOISE_LINE_PATTERN.test(line) && line.length < 220) return false;
      if (CONSENT_ROW_PATTERN.test(line) && line.length < 220) return false;
      // Menu kirintisi: kisa, noktalama icermeyen tek kelimelik satirlar.
      if (line.length < 25 && !/[.!?:]/.test(line) && line.split(" ").length <= 3) return false;
      return true;
    });

  // Ayni sayfada birebir tekrarlanan satirlari tekille (menu/footer artiklari).
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const line of lines) {
    const key = line.toLowerCase();
    if (!line.startsWith("##") && seen.has(key)) continue;
    seen.add(key);
    deduped.push(line);
  }

  const text = deduped.join("\n").slice(0, maxChars);
  const noiseRatio = rawLength > 0 ? Math.max(0, Math.min(1, 1 - text.length / rawLength)) : 0;

  return { title, description, text, structured, noiseRatio, method: "static" };
}

/** Markdown ciktisini (Firecrawl) ayni ExtractedPage sekline cevirir. */
export function extractFromMarkdown(markdown: string, meta: { title?: string; description?: string } = {}, maxChars = 120000): ExtractedPage {
  const lines = markdown
    .split("\n")
    .map((line) => line.replace(/[ \t\u00a0]+/g, " ").trim())
    .map((line) => line.replace(/^#{1,3}\s+/, "## ").replace(/^#{4,6}\s+/, "### "))
    .map((line) => line.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1"))
    .filter((line) => {
      if (!line || line === "---") return false;
      if (line.startsWith("##")) return line.replace(/#/g, "").trim().length > 1;
      if (NOISE_LINE_PATTERN.test(line) && line.length < 220) return false;
      if (CONSENT_ROW_PATTERN.test(line) && line.length < 220) return false;
      if (line.length < 25 && !/[.!?:]/.test(line) && line.split(" ").length <= 3) return false;
      return true;
    });
  const text = lines.join("\n").slice(0, maxChars);
  return {
    title: (meta.title ?? "").slice(0, 200),
    description: (meta.description ?? "").slice(0, 400),
    text,
    structured: "",
    noiseRatio: 0,
    method: "render",
  };
}

const USER_AGENT = "Mozilla/5.0 (compatible; OneCiteBot/1.0; +https://1cite.com)";

/** JS ile render edilen sayfalar icin Firecrawl'a duser. Baglanti yoksa null doner. */
export async function renderWithFirecrawl(url: string): Promise<ExtractedPage | null> {
  const key = process.env["FIRECRAWL_API_KEY"];
  if (!key) return null;
  const gatewayKey = process.env["LOVABLE_API_KEY"];
  const usesGateway = key.startsWith("lovc_");
  if (usesGateway && !gatewayKey) return null;
  const endpoint = usesGateway
    ? "https://connector-gateway.lovable.dev/firecrawl/v2/scrape"
    : "https://api.firecrawl.dev/v2/scrape";
  const headers: Record<string, string> = usesGateway
    ? { "Content-Type": "application/json", Authorization: `Bearer ${gatewayKey}`, "X-Connection-Api-Key": key }
    : { "Content-Type": "application/json", Authorization: `Bearer ${key}` };
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
      signal: AbortSignal.timeout(45000),
    });
    const payload = (await res.json().catch(() => null)) as
      | { markdown?: string; metadata?: Record<string, unknown>; data?: { markdown?: string; metadata?: Record<string, unknown> }; error?: string }
      | null;
    if (!res.ok) {
      console.error(`Firecrawl render failed [${res.status}]: ${payload?.error ?? "bilinmeyen hata"}`);
      return null;
    }
    const markdown = payload?.markdown ?? payload?.data?.markdown ?? "";
    if (!markdown.trim()) return null;
    const metadata = payload?.metadata ?? payload?.data?.metadata ?? {};
    return extractFromMarkdown(markdown, {
      title: String(metadata["title"] ?? ""),
      description: String(metadata["description"] ?? ""),
    });
  } catch (error) {
    console.error("Firecrawl render error", error);
    return null;
  }
}

export type FetchOptions = {
  /** Kosullu istek: sunucu 304 donerse icerik yeniden islenmez. */
  etag?: string | null;
  lastModified?: string | null;
  /** JS ile render edilen sayfalar icin Firecrawl fallback'i. */
  allowRender?: boolean;
};

export type FetchOutcome =
  | { status: "ok"; page: ExtractedPage }
  | { status: "not-modified" }
  | { status: "empty"; reason: string }
  | { status: "error"; reason: string };

/** Bir URL'i (kosullu) indirir, temizler, gerekirse render fallback'ine duser. */
export async function fetchExtracted(url: string, options: FetchOptions = {}): Promise<FetchOutcome> {
  const target = url.startsWith("http") ? url : `https://${url}`;
  let html = "";
  let etag: string | null = null;
  let lastModified: string | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const headers: Record<string, string> = { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml" };
      if (options.etag) headers["if-none-match"] = options.etag;
      if (options.lastModified) headers["if-modified-since"] = options.lastModified;
      const res = await fetch(target, { headers, signal: AbortSignal.timeout(20000) });
      if (res.status === 304) return { status: "not-modified" };
      if (!res.ok) {
        if (res.status >= 500 && attempt === 0) continue;
        return { status: "error", reason: `HTTP ${res.status}` };
      }
      const type = res.headers.get("content-type") ?? "";
      if (type && !/html|xml|text/i.test(type)) return { status: "error", reason: "Desteklenmeyen içerik tipi" };
      etag = res.headers.get("etag");
      lastModified = res.headers.get("last-modified");
      html = await res.text();
      break;
    } catch (error) {
      if (attempt === 1) return { status: "error", reason: error instanceof Error ? error.message : "İndirilemedi" };
    }
  }
  if (!html) return { status: "error", reason: "Boş yanıt" };

  const page = extractFromHtml(html);
  const needsRender = page.text.trim().length < 500;

  if (needsRender && options.allowRender !== false) {
    const rendered = await renderWithFirecrawl(target);
    if (rendered && rendered.text.trim().length >= 200) {
      return { status: "ok", page: { ...rendered, structured: page.structured, etag, lastModified } };
    }
  }
  if (needsRender) {
    return { status: "empty", reason: "Sayfa JavaScript ile yükleniyor; statik içerik alınamadı" };
  }
  return { status: "ok", page: { ...page, etag, lastModified } };
}

/** Geriye donuk uyumlu sade sarmalayici. */
export async function fetchAndExtract(url: string): Promise<ExtractedPage | null> {
  const outcome = await fetchExtracted(url);
  return outcome.status === "ok" ? outcome.page : null;
}

/** Birden fazla sayfada tekrarlayan satirlari (site geneli boilerplate) bulur. */
export function findBoilerplateLines(pages: string[], minPages = 2): Set<string> {
  const counts = new Map<string, number>();
  for (const page of pages) {
    const unique = new Set(
      page.split("\n").map((line) => line.trim().toLowerCase()).filter((line) => line && !line.startsWith("##")),
    );
    for (const line of unique) counts.set(line, (counts.get(line) ?? 0) + 1);
  }
  const threshold = Math.max(minPages, Math.ceil(pages.length * 0.6));
  const result = new Set<string>();
  for (const [line, count] of counts) if (count >= threshold) result.add(line);
  return result;
}
