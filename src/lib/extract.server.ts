// HTML -> temiz metin cikarim katmani.
// Amac: cerez bandi, menu, footer, form gibi gurultuyu atip yalnizca kanit degeri
// tasiyan ana icerigi, baslik hiyerarsisini ve JSON-LD verisini birakmak.

export type ExtractedPage = {
  title: string;
  description: string;
  /** Basliklari "## Baslik" olarak koruyan temiz metin. */
  text: string;
  /** JSON-LD'den turetilmis yapisal ozet (varsa). */
  structured: string;
  /** Ham metnin ne kadarinin gurultu olarak atildigi (0-1). */
  noiseRatio: number;
};

const NOISE_TAGS = [
  "script", "style", "noscript", "template", "svg", "iframe", "form",
  "nav", "header", "footer", "aside", "dialog", "select", "button",
];

// class/id icinde bu kaliplar geciyorsa blok tamamen atilir.
const NOISE_PATTERN =
  /(cookie|consent|gdpr|kvkk|çerez|cerez|banner|popup|modal|newsletter|bulten|bülten|subscribe|abone|breadcrumb|sidebar|side-bar|menu|navbar|navigation|social|share|paylas|comment|yorum|related|benzer|promo|advert|\bads?\b|sticky|offcanvas|drawer|backdrop|skip-link|cta-bar|announcement)/i;

// Bu cumleler sayfadan bagimsiz gurultudur; satir bazinda atilir.
const NOISE_LINE_PATTERN =
  /(çerez|cerez|cookie|kvkk|gizlilik politikas|kullanım koşullar|kullanim kosullar|tüm hakları saklıdır|tum haklari saklidir|all rights reserved|bültenimize|bultenimize|newsletter|abone ol|subscribe|sepete ekle|giriş yap|giris yap|kayıt ol|kayit ol|menüyü aç|menuyu ac)/i;

function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;|&rsquo;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));
}

function stripTag(html: string, tag: string): string {
  const paired = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
  const selfClosing = new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi");
  return html.replace(paired, " ").replace(selfClosing, " ");
}

// class/id'sinde gurultu kalibi olan <div>/<section> bloklarini, ic ice etiketleri
// sayarak dogru kapanista keser.
function stripNoisyBlocks(html: string): string {
  const openTag = /<(div|section|ul|ol|aside)\b([^>]*)>/gi;
  let result = html;
  for (let pass = 0; pass < 3; pass += 1) {
    let changed = false;
    let output = "";
    let cursor = 0;
    openTag.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = openTag.exec(result)) !== null) {
      if (match.index < cursor) continue;
      const attrs = match[2] ?? "";
      const idClass = /(?:class|id|data-testid|role|aria-label)\s*=\s*["']([^"']*)["']/gi;
      let noisy = false;
      let attrMatch: RegExpExecArray | null;
      while ((attrMatch = idClass.exec(attrs)) !== null) {
        if (NOISE_PATTERN.test(attrMatch[1] ?? "")) { noisy = true; break; }
      }
      if (!noisy) continue;

      const tag = (match[1] ?? "div").toLowerCase();
      const scanner = new RegExp(`<${tag}\\b[^>]*>|<\\/${tag}>`, "gi");
      scanner.lastIndex = match.index + match[0].length;
      let depth = 1;
      let end = -1;
      let step: RegExpExecArray | null;
      while ((step = scanner.exec(result)) !== null) {
        if (step[0].startsWith("</")) depth -= 1;
        else depth += 1;
        if (depth === 0) { end = step.index + step[0].length; break; }
      }
      if (end === -1) continue;
      output += result.slice(cursor, match.index) + " ";
      cursor = end;
      openTag.lastIndex = end;
      changed = true;
    }
    output += result.slice(cursor);
    result = output;
    if (!changed) break;
  }
  return result;
}

function pickMainContent(html: string): string {
  const candidates = [
    /<main\b[^>]*>([\s\S]*?)<\/main>/i,
    /<article\b[^>]*>([\s\S]*?)<\/article>/i,
    /<[^>]+role=["']main["'][^>]*>([\s\S]*?)<\/[a-z]+>/i,
    /<div\b[^>]*(?:id|class)=["'][^"']*(?:content|icerik|main)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  ];
  for (const pattern of candidates) {
    const found = html.match(pattern);
    const body = found?.[1] ?? "";
    // Cok kisa bloklar ana icerik degildir.
    if (body && body.replace(/<[^>]+>/g, "").trim().length > 400) return body;
  }
  return html;
}

function readJsonLd(html: string): string {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const lines: string[] = [];
  const wanted = new Set([
    "organization", "localbusiness", "product", "service", "faqpage",
    "offer", "aggregaterating", "breadcrumblist" /* atilir */,
  ]);
  const visit = (node: unknown, depth = 0) => {
    if (depth > 4 || !node) return;
    if (Array.isArray(node)) { node.forEach((item) => visit(item, depth + 1)); return; }
    if (typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    const type = String(record["@type"] ?? "").toLowerCase();
    if (type && wanted.has(type) && type !== "breadcrumblist") {
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
            const q = (item as Record<string, unknown>)["name"];
            const answer = (item as Record<string, unknown>)["acceptedAnswer"] as Record<string, unknown> | undefined;
            const a = answer?.["text"];
            if (q && a) lines.push(`SSS — ${String(q)}: ${String(a).replace(/<[^>]+>/g, " ").slice(0, 400)}`);
          }
        }
      }
    }
    for (const value of Object.values(record)) visit(value, depth + 1);
  };
  for (const block of blocks) {
    try { visit(JSON.parse((block[1] ?? "").trim())); } catch { /* bozuk json-ld yok sayilir */ }
  }
  return lines.slice(0, 30).join("\n");
}

/** Ham HTML'i temiz, baslik hiyerarsisi korunmus metne cevirir. */
export function extractFromHtml(html: string, maxChars = 120000): ExtractedPage {
  const rawLength = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;

  const title = decodeEntities((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim()).slice(0, 200);
  const description = decodeEntities(
    (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ?? "").trim(),
  ).slice(0, 400);
  const structured = readJsonLd(html);

  let working = html;
  for (const tag of NOISE_TAGS) working = stripTag(working, tag);
  working = stripNoisyBlocks(working);
  working = pickMainContent(working);

  // Basliklari isaretle, blok elemanlarini satir sonuna cevir.
  working = working
    .replace(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, _level, inner: string) => `\n## ${inner.replace(/<[^>]+>/g, " ")}\n`)
    .replace(/<h([4-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, _level, inner: string) => `\n### ${inner.replace(/<[^>]+>/g, " ")}\n`)
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(/<(p|br|tr|div|section)\b[^>]*>/gi, "\n")
    .replace(/<td\b[^>]*>/gi, " | ")
    .replace(/<[^>]+>/g, " ");

  const lines = decodeEntities(working)
    .split("\n")
    .map((line) => line.replace(/[ \t\u00a0]+/g, " ").trim())
    .filter((line) => {
      if (!line) return false;
      if (line.startsWith("##")) return line.replace(/#/g, "").trim().length > 1;
      if (line.length < 3) return false;
      if (NOISE_LINE_PATTERN.test(line) && line.length < 220) return false;
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

  return { title, description, text, structured, noiseRatio };
}

/** Bir URL'i indirir ve temiz metne cevirir. */
export async function fetchAndExtract(url: string): Promise<ExtractedPage | null> {
  try {
    const target = url.startsWith("http") ? url : `https://${url}`;
    const res = await fetch(target, {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; OneCiteBot/1.0; +https://1cite.com)",
        accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (type && !/html|xml|text/i.test(type)) return null;
    return extractFromHtml(await res.text());
  } catch {
    return null;
  }
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
