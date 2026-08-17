// Ücretsiz AI hazırlık raporu: verilen alan adını gerçek zamanlı tarar.
// Teknik erişim, yapılandırılmış veri, AI bot kuralları ve içerik okunabilirliği ölçülür.
export type Severity = "good" | "attention" | "critical";
export type ReportFinding = {
  key: string;
  category: "technical" | "structured_data" | "ai_bot_compatibility" | "content_readability";
  state: Severity;
  title: string;
  description: string;
  recommendation: string;
};
export type CitationCheck = {
  checked: boolean;
  cited: boolean;
  question: string;
  citedDomains: string[];
};
export type AnalysisResult = {
  domain: string;
  score: number;
  categoryScores: Record<string, number>;
  findings: ReportFinding[];
  citation: CitationCheck;
};

const AI_BOTS = ["GPTBot", "PerplexityBot", "ClaudeBot", "Claude-Web", "Google-Extended", "CCBot", "Bingbot", "Applebot-Extended"];

export function normalizeDomain(raw: string): string {
  const trimmed = String(raw ?? "").trim().toLowerCase();
  const withScheme = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withScheme).hostname.replace(/^www\./, "");
  } catch {
    return trimmed.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
  }
}

export function isValidDomain(domain: string): boolean {
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain) && domain.length <= 253;
}

async function safeFetch(url: string, timeoutMs = 12000): Promise<{ ok: boolean; status: number; body: string; finalUrl: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "OneCiteBot/1.0 (+https://1cite.com)", Accept: "text/html,text/plain,*/*" },
    });
    const body = (await response.text()).slice(0, 400_000);
    return { ok: response.ok, status: response.status, body, finalUrl: response.url || url };
  } catch {
    return { ok: false, status: 0, body: "", finalUrl: url };
  } finally {
    clearTimeout(timer);
  }
}

// robots.txt icinde bir user-agent icin "Disallow: /" var mi?
function blocksAgent(robots: string, agent: string): boolean {
  const lines = robots.split(/\r?\n/).map((line) => line.trim());
  let active = false;
  let blocked = false;
  for (const line of lines) {
    if (/^user-agent\s*:/i.test(line)) {
      const value = line.split(":").slice(1).join(":").trim().toLowerCase();
      active = value === agent.toLowerCase();
      continue;
    }
    if (!active) continue;
    if (/^disallow\s*:/i.test(line)) {
      const value = line.split(":").slice(1).join(":").trim();
      if (value === "/") blocked = true;
    }
    if (/^allow\s*:/i.test(line)) {
      const value = line.split(":").slice(1).join(":").trim();
      if (value === "/") blocked = false;
    }
  }
  return blocked;
}

function textFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function jsonLdTypes(html: string): string[] {
  const types: string[] = [];
  const blocks = html.match(/<script[^>]+application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi) ?? [];
  for (const block of blocks) {
    const inner = block.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "");
    try {
      const parsed = JSON.parse(inner) as unknown;
      const collect = (node: unknown) => {
        if (Array.isArray(node)) return node.forEach(collect);
        if (node && typeof node === "object") {
          const record = node as Record<string, unknown>;
          const type = record["@type"];
          if (typeof type === "string") types.push(type);
          if (Array.isArray(type)) type.forEach((t) => typeof t === "string" && types.push(t));
          if (Array.isArray(record["@graph"])) collect(record["@graph"]);
        }
      };
      collect(parsed);
    } catch {
      const matches = inner.match(/"@type"\s*:\s*"([^"]+)"/g) ?? [];
      for (const match of matches) types.push(match.split('"')[3] ?? "");
    }
  }
  return types.filter(Boolean);
}

// Perplexity uzerinden markanin gercekten atif alip almadigini kontrol eder.
async function checkCitation(domain: string): Promise<CitationCheck> {
  const question = `${domain} sitesi hangi hizmetleri sunuyor? Kaynak göstererek yanıtla.`;
  try {
    const { perplexitySearch, extractDomainsFromCitations } = await import("./perplexity.server");
    const { citations } = await perplexitySearch([
      { role: "system", content: "Kısa ve tarafsız yanıtla. En fazla 80 kelime." },
      { role: "user", content: question },
    ]);
    const domains = extractDomainsFromCitations(citations);
    return { checked: true, cited: domains.some((d) => d === domain || d.endsWith(`.${domain}`)), question, citedDomains: domains.slice(0, 8) };
  } catch (error) {
    console.error("Citation check failed", error);
    return { checked: false, cited: false, question, citedDomains: [] };
  }
}

export async function analyzeDomain(rawDomain: string): Promise<AnalysisResult> {
  const domain = normalizeDomain(rawDomain);
  const base = `https://${domain}`;
  const [home, robots, sitemap, llms, citation] = await Promise.all([
    safeFetch(base),
    safeFetch(`${base}/robots.txt`),
    safeFetch(`${base}/sitemap.xml`),
    safeFetch(`${base}/llms.txt`),
    checkCitation(domain),
  ]);

  const html = home.body;
  const findings: ReportFinding[] = [];
  const scores = { technical: 0, structured_data: 0, ai_bot_compatibility: 0, content_readability: 0 };

  // --- Teknik erisim ---
  if (home.ok && html.length > 0) {
    scores.technical += 12;
    findings.push({
      key: "reachable", category: "technical", state: "good",
      title: "Site sunucu tarafından erişilebilir",
      description: `${base} adresi ${home.status} durum koduyla yanıt verdi ve HTML içeriği okunabildi.`,
      recommendation: "Erişilebilirliği korumak için sunucu yanıt sürelerini izlemeye devam edin.",
    });
  } else {
    findings.push({
      key: "reachable", category: "technical", state: "critical",
      title: "Ana sayfa taranamadı",
      description: home.status ? `${base} adresi ${home.status} durum koduyla yanıt verdi.` : `${base} adresine bağlantı kurulamadı.`,
      recommendation: "Bot erişimini engelleyen güvenlik duvarı, WAF veya yönlendirme kurallarını gözden geçirin.",
    });
  }

  const sitemapOk = sitemap.ok && /<(urlset|sitemapindex)/i.test(sitemap.body);
  const robotsSitemap = /^sitemap\s*:/im.test(robots.body);
  if (sitemapOk || robotsSitemap) {
    scores.technical += 7;
    findings.push({
      key: "sitemap", category: "technical", state: "good",
      title: "Site haritası yayında",
      description: sitemapOk ? "sitemap.xml geçerli biçimde sunuluyor." : "robots.txt içinde site haritası bildirilmiş.",
      recommendation: "Yeni sayfalar eklendikçe site haritasını güncel tutun.",
    });
  } else {
    findings.push({
      key: "sitemap", category: "technical", state: "attention",
      title: "Site haritası bulunamadı",
      description: "sitemap.xml erişilebilir değil ve robots.txt içinde bildirilmemiş.",
      recommendation: "Tüm herkese açık sayfaları içeren bir sitemap.xml yayınlayın ve robots.txt içinde bildirin.",
    });
  }

  const canonical = /<link[^>]+rel=["']canonical["'][^>]*>/i.test(html);
  if (canonical) {
    scores.technical += 6;
  } else if (home.ok) {
    findings.push({
      key: "canonical", category: "technical", state: "attention",
      title: "Canonical etiketi yok",
      description: "Ana sayfada rel=canonical bağlantısı bulunamadı.",
      recommendation: "Her sayfaya tekil bir canonical URL ekleyerek yinelenen içerik riskini azaltın.",
    });
  }

  // --- Yapilandirilmis veri ---
  const types = jsonLdTypes(html);
  if (types.length) {
    scores.structured_data += 10;
    const hasOrg = types.some((t) => /organization|localbusiness|website/i.test(t));
    if (hasOrg) scores.structured_data += 5;
    findings.push({
      key: "jsonld", category: "structured_data", state: hasOrg ? "good" : "attention",
      title: hasOrg ? "JSON-LD şeması mevcut" : "JSON-LD var ama kurum şeması eksik",
      description: `Bulunan şema tipleri: ${Array.from(new Set(types)).slice(0, 8).join(", ")}.`,
      recommendation: hasOrg ? "Ürün, hizmet ve SSS şemalarıyla kapsamı genişletin." : "Organization ve WebSite şemalarını ekleyerek markanızı tanımlayın.",
    });
  } else if (home.ok) {
    findings.push({
      key: "jsonld", category: "structured_data", state: "critical",
      title: "JSON-LD şeması bulunamadı",
      description: "Ana sayfada schema.org yapılandırılmış verisi yok; AI sistemleri markanızı tanımlamakta zorlanır.",
      recommendation: "Organization, WebSite ve Product/Service şemalarını JSON-LD olarak ekleyin.",
    });
  }

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
  const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]?.trim() ?? "";
  if (title && description) {
    scores.structured_data += 6;
  } else if (home.ok) {
    findings.push({
      key: "meta", category: "structured_data", state: "attention",
      title: "Başlık veya açıklama etiketi eksik",
      description: `Title: ${title ? "var" : "yok"}, meta description: ${description ? "var" : "yok"}.`,
      recommendation: "Her sayfaya benzersiz bir title ve 160 karaktere kadar bir meta description yazın.",
    });
  }

  const hasOg = /<meta[^>]+property=["']og:(title|description)["']/i.test(html);
  if (hasOg) scores.structured_data += 4;

  // --- AI bot uyumlulugu ---
  const blocked = robots.ok ? AI_BOTS.filter((agent) => blocksAgent(robots.body, agent)) : [];
  if (!robots.ok) {
    scores.ai_bot_compatibility += 8;
    findings.push({
      key: "robots", category: "ai_bot_compatibility", state: "attention",
      title: "robots.txt bulunamadı",
      description: "Dosya yok; botlar varsayılan olarak tarayabilir ancak kuralları siz belirleyemezsiniz.",
      recommendation: "AI botlarına açık, gerekli dizinleri kapatan bir robots.txt yayınlayın.",
    });
  } else if (blocked.length) {
    findings.push({
      key: "robots", category: "ai_bot_compatibility", state: "critical",
      title: "robots.txt bazı AI botlarını engelliyor",
      description: `Engellenen botlar: ${blocked.join(", ")}.`,
      recommendation: "Görünmek istediğiniz asistanların botlarına robots.txt içinde izin verin.",
    });
  } else {
    scores.ai_bot_compatibility += 14;
    findings.push({
      key: "robots", category: "ai_bot_compatibility", state: "good",
      title: "robots.txt AI botlarını engellemiyor",
      description: "GPTBot, PerplexityBot, ClaudeBot ve Google-Extended erişimi açık görünüyor.",
      recommendation: "Mevcut yapılandırmayı koruyun ve değişiklikleri düzenli kontrol edin.",
    });
  }

  const noindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
  if (!noindex && home.ok) scores.ai_bot_compatibility += 5;
  if (noindex) {
    findings.push({
      key: "noindex", category: "ai_bot_compatibility", state: "critical",
      title: "Ana sayfa noindex olarak işaretlenmiş",
      description: "Meta robots etiketi sayfanın dizine eklenmesini engelliyor.",
      recommendation: "Ana sayfadaki noindex etiketini kaldırın.",
    });
  }

  const hasLlms = llms.ok && llms.body.trim().length > 40;
  if (hasLlms) {
    scores.ai_bot_compatibility += 6;
  } else {
    findings.push({
      key: "llms", category: "ai_bot_compatibility", state: "attention",
      title: "llms.txt dosyası yok",
      description: "AI asistanlarına markanızı ve önemli sayfalarınızı özetleyen bir llms.txt bulunamadı.",
      recommendation: "Kök dizine, marka tanımınızı ve öncelikli sayfalarınızı içeren bir llms.txt ekleyin.",
    });
  }

  // --- Icerik okunabilirligi ---
  const text = textFromHtml(html);
  const words = text ? text.split(" ").length : 0;
  if (words >= 400) {
    scores.content_readability += 12;
  } else if (home.ok) {
    findings.push({
      key: "readability", category: "content_readability", state: words < 120 ? "critical" : "attention",
      title: words < 120 ? "Sunucu HTML'inde neredeyse hiç metin yok" : "Sunucu HTML'indeki metin sınırlı",
      description: `Ana sayfanın ham HTML çıktısında yaklaşık ${words} kelime bulundu; içerik büyük olasılıkla tarayıcıda JavaScript ile üretiliyor.`,
      recommendation: "Kritik içeriği sunucu tarafında render edin veya statik HTML olarak sunun.",
    });
  }

  const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;
  if (h1Count === 1) {
    scores.content_readability += 7;
  } else if (home.ok) {
    findings.push({
      key: "h1", category: "content_readability", state: "attention",
      title: h1Count === 0 ? "H1 başlığı yok" : `Sayfada ${h1Count} adet H1 var`,
      description: "AI sistemleri sayfanın ana konusunu tek bir H1 üzerinden belirler.",
      recommendation: "Her sayfada konuyu net anlatan tek bir H1 kullanın.",
    });
  }

  const h2Count = (html.match(/<h2[\s>]/gi) ?? []).length;
  if (h2Count >= 2) scores.content_readability += 6;

  const score = Math.min(100, scores.technical + scores.structured_data + scores.ai_bot_compatibility + scores.content_readability);

  return { domain, score, categoryScores: scores, findings, citation };
}