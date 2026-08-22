// AEO Site Health: 13 deterministik HTML kontrolü, technical/aeo skorlama ve tarama
// orkestrasyonu. Sonuçlar onecite.site_health_pages'e upsert edilir, kural bazlı
// bulgular onecite.findings'e idempotent biçimde açılır/kapatılır.
//
// Bu dosya supabaseAdmin (service-role) kullanır; brand üyeliği doğrulaması KENDİSİ
// yapılmaz — çağıran (site-health.functions.ts) context.supabase ile RLS üzerinden
// brandId sahipliğini doğrulayıp domain'i aldıktan sonra runAudit()'i çağırmalı.
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { firecrawlV2 } from "./firecrawl-v2.server";
import { runPool } from "./kb.server";

export type SiteHealthCategory = "technical" | "aeo";
export type SiteHealthSeverity = "high" | "medium" | "low";

export type SiteHealthRuleId =
  | "website_schema_missing"
  | "organization_schema_missing"
  | "h1_missing"
  | "title_missing"
  | "title_too_long"
  | "meta_description_missing"
  | "h2_missing"
  | "og_title_missing"
  | "og_description_missing"
  | "og_image_missing"
  | "twitter_card_missing"
  | "breadcrumb_schema_missing"
  | "llms_txt_missing";

export type SiteHealthRuleResult = {
  ruleId: SiteHealthRuleId;
  /** findings.category değeri — dual (technical+aeo) kurallar da burada "technical" taşır. */
  category: SiteHealthCategory;
  severity: SiteHealthSeverity;
  /** Skor hesaplamasında bu kural fail olduğunda hangi kategori(ler)den düşüleceği. */
  scoreCategories: SiteHealthCategory[];
  passed: boolean;
  title: string;
  detection: string;
  recommendation: string;
};

export type RunAuditResult = {
  pagesAudited: number;
  findingsOpened: number;
  findingsResolved: number;
  technicalScore: number;
  aeoScore: number;
};

const SEVERITY_WEIGHT: Record<SiteHealthSeverity, number> = { high: 15, medium: 8, low: 3 };

// ---------------------------------------------------------------------------
// JSON-LD yardımcıları (cheerio tabanlı — public-report.server.ts'teki regex
// tabanlı jsonLdTypes()'ın gerçek HTML'e sahip olduğumuz bu bağlamdaki eşdeğeri).
// ---------------------------------------------------------------------------

type JsonLdNode = Record<string, unknown>;

function collectJsonLdNodes($: CheerioAPI): JsonLdNode[] {
  const nodes: JsonLdNode[] = [];
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (!node || typeof node !== "object") return;
    const record = node as JsonLdNode;
    if (record["@type"] !== undefined) nodes.push(record);
    if (Array.isArray(record["@graph"])) visit(record["@graph"]);
  };
  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = $(element).text().trim();
    if (!raw) return;
    try {
      visit(JSON.parse(raw));
    } catch {
      /* bozuk JSON-LD yok sayılır */
    }
  });
  return nodes;
}

function jsonLdTypesOf(node: JsonLdNode): string[] {
  const type = node["@type"];
  if (typeof type === "string") return [type];
  if (Array.isArray(type)) return type.filter((value): value is string => typeof value === "string");
  return [];
}

function hasType(nodes: JsonLdNode[], pattern: RegExp): boolean {
  return nodes.some((node) => jsonLdTypesOf(node).some((type) => pattern.test(type)));
}

function organizationNodes(nodes: JsonLdNode[]): JsonLdNode[] {
  return nodes.filter(
    (node) => jsonLdTypesOf(node).some((type) => /organization/i.test(type) || /localbusiness/i.test(type)),
  );
}

function hasNonEmptyLogo(node: JsonLdNode): boolean {
  const logo = node["logo"];
  if (typeof logo === "string") return logo.trim().length > 0;
  if (logo && typeof logo === "object") {
    const url = (logo as JsonLdNode)["url"];
    return typeof url === "string" && url.trim().length > 0;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Saf kural fonksiyonları — her biri cheerio $ (veya JSON-LD node listesi) alır,
// tek bir sinyal döndürür. Ad-hoc test scripti bunları runPageRules() üzerinden
// (html: string) => SiteHealthRuleResult[] biçiminde egzersiz eder.
// ---------------------------------------------------------------------------

function checkWebsiteSchema(nodes: JsonLdNode[]): boolean {
  return hasType(nodes, /^website$/i);
}

function checkOrganizationSchema(nodes: JsonLdNode[]): { passed: boolean; reason: "missing" | "no-logo" | null } {
  const orgs = organizationNodes(nodes);
  if (!orgs.length) return { passed: false, reason: "missing" };
  if (!orgs.some(hasNonEmptyLogo)) return { passed: false, reason: "no-logo" };
  return { passed: true, reason: null };
}

function checkH1($: CheerioAPI): boolean {
  return $("h1").length > 0;
}

function checkTitleText($: CheerioAPI): string {
  return $("title").first().text().trim();
}

function checkMetaContent($: CheerioAPI, selector: string): boolean {
  return Boolean($(selector).first().attr("content")?.trim());
}

function checkH2($: CheerioAPI): boolean {
  return $("h2").length > 0;
}

function checkBreadcrumbSchema(nodes: JsonLdNode[]): boolean {
  return hasType(nodes, /^breadcrumblist$/i);
}

/** llms.txt yanıtının pass/fail mantığı — network'ten ayrık, saf ve test edilebilir. */
export function evaluateLlmsTxt(ok: boolean, body: string): boolean {
  return ok && body.trim().length > 0;
}

// ---------------------------------------------------------------------------
// Kural sonucu kompozisyonu — Türkçe title/detection/recommendation metinleri.
// ---------------------------------------------------------------------------

function ruleResult(
  ruleId: SiteHealthRuleId,
  category: SiteHealthCategory,
  severity: SiteHealthSeverity,
  scoreCategories: SiteHealthCategory[],
  passed: boolean,
  title: string,
  detection: string,
  recommendation: string,
): SiteHealthRuleResult {
  return { ruleId, category, severity, scoreCategories, passed, title, detection, recommendation };
}

/** Sayfa başına çalışan 12 kural (llms.txt hariç — o site bazlı ve ayrı). */
export function runPageRules(html: string): SiteHealthRuleResult[] {
  const $ = cheerio.load(html);
  const nodes = collectJsonLdNodes($);
  const results: SiteHealthRuleResult[] = [];

  results.push(
    ruleResult(
      "website_schema_missing",
      "aeo",
      "high",
      ["aeo"],
      checkWebsiteSchema(nodes),
      "WebSite şeması eksik",
      "Sayfada schema.org WebSite türünde bir JSON-LD bloğu bulunamadı.",
      "Sayfaya site adını (ve varsa arama eylemini) içeren bir WebSite JSON-LD şeması ekleyin.",
    ),
  );

  const org = checkOrganizationSchema(nodes);
  results.push(
    ruleResult(
      "organization_schema_missing",
      "aeo",
      "high",
      ["aeo"],
      org.passed,
      org.reason === "no-logo" ? "Organization şemasında logo eksik" : "Organization şeması eksik",
      org.reason === "no-logo"
        ? "Organization şeması var ama logo alanı eksik."
        : "Sayfada Organization veya LocalBusiness türünde bir JSON-LD bloğu bulunamadı.",
      org.reason === "no-logo"
        ? "Organization şemasına geçerli, boş olmayan bir logo URL'si ekleyin."
        : "Marka adı, logo ve iletişim bilgilerini içeren bir Organization (veya LocalBusiness) şeması ekleyin.",
    ),
  );

  results.push(
    ruleResult(
      "h1_missing",
      "technical",
      "high",
      ["technical", "aeo"],
      checkH1($),
      "H1 başlığı eksik",
      "Sayfada hiç <h1> etiketi bulunamadı.",
      "Sayfanın ana konusunu net biçimde anlatan tek bir H1 başlığı ekleyin.",
    ),
  );

  const title = checkTitleText($);
  const titleMissing = title.length === 0;
  results.push(
    ruleResult(
      "title_missing",
      "technical",
      "high",
      ["technical"],
      !titleMissing,
      "Title etiketi eksik",
      "Sayfada <title> etiketi boş veya yok.",
      "Sayfaya benzersiz ve açıklayıcı bir <title> etiketi ekleyin.",
    ),
  );

  if (!titleMissing) {
    const tooLong = title.length > 60;
    results.push(
      ruleResult(
        "title_too_long",
        "technical",
        "medium",
        ["technical"],
        !tooLong,
        "Title çok uzun",
        `Title ${title.length} karakter (60 karakter sınırını aşıyor): "${title}"`,
        "Title etiketini 60 karakterin altına indirin; en önemli anahtar kelimeleri başa alın.",
      ),
    );
  }

  results.push(
    ruleResult(
      "meta_description_missing",
      "technical",
      "medium",
      ["technical"],
      checkMetaContent($, 'meta[name="description"]'),
      "Meta description eksik",
      "Sayfada meta description etiketi boş veya yok.",
      "Sayfayı özetleyen, 150-160 karakter civarında bir meta description ekleyin.",
    ),
  );

  results.push(
    ruleResult(
      "h2_missing",
      "technical",
      "medium",
      ["technical"],
      checkH2($),
      "H2 başlığı eksik",
      "Sayfada hiç <h2> etiketi bulunamadı.",
      "İçeriği alt başlıklara (H2) bölerek okunabilirliği ve tarama kolaylığını artırın.",
    ),
  );

  results.push(
    ruleResult(
      "og_title_missing",
      "technical",
      "high",
      ["technical"],
      checkMetaContent($, 'meta[property="og:title"]'),
      "og:title etiketi eksik",
      "Sayfada Open Graph og:title etiketi boş veya yok.",
      "Sosyal paylaşımlarda doğru başlığın görünmesi için og:title ekleyin.",
    ),
  );

  results.push(
    ruleResult(
      "og_description_missing",
      "technical",
      "high",
      ["technical"],
      checkMetaContent($, 'meta[property="og:description"]'),
      "og:description etiketi eksik",
      "Sayfada Open Graph og:description etiketi boş veya yok.",
      "Sosyal paylaşımlar için kısa bir og:description ekleyin.",
    ),
  );

  results.push(
    ruleResult(
      "og_image_missing",
      "technical",
      "medium",
      ["technical"],
      checkMetaContent($, 'meta[property="og:image"]'),
      "og:image etiketi eksik",
      "Sayfada Open Graph og:image etiketi boş veya yok.",
      "Sosyal paylaşım kartı için en az 1200x630 boyutunda bir og:image ekleyin.",
    ),
  );

  results.push(
    ruleResult(
      "twitter_card_missing",
      "technical",
      "low",
      ["technical"],
      checkMetaContent($, 'meta[name="twitter:card"]'),
      "twitter:card etiketi eksik",
      "Sayfada twitter:card etiketi boş veya yok.",
      "Twitter/X paylaşımları için twitter:card (örn. summary_large_image) ekleyin.",
    ),
  );

  results.push(
    ruleResult(
      "breadcrumb_schema_missing",
      "aeo",
      "medium",
      ["aeo"],
      checkBreadcrumbSchema(nodes),
      "BreadcrumbList şeması eksik",
      "Sayfada schema.org BreadcrumbList türünde bir JSON-LD bloğu bulunamadı.",
      "Sayfa hiyerarşisini gösteren bir BreadcrumbList JSON-LD şeması ekleyin.",
    ),
  );

  return results;
}

/** Site bazlı llms.txt kuralı — tek bir sonuç, taranan her sayfanın satırına aynı şekilde yansır. */
function buildLlmsTxtRuleResult(domain: string, passed: boolean): SiteHealthRuleResult {
  return ruleResult(
    "llms_txt_missing",
    "technical",
    "medium",
    ["technical", "aeo"],
    passed,
    "llms.txt dosyası yok",
    `https://${domain}/llms.txt adresinde erişilebilir, boş olmayan bir içerik bulunamadı.`,
    "Kök dizine, marka tanımınızı ve öncelikli sayfalarınızı özetleyen bir llms.txt dosyası ekleyin.",
  );
}

async function fetchLlmsTxt(domain: string): Promise<boolean> {
  try {
    const response = await fetch(`https://${domain}/llms.txt`, {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "OneCiteBot/1.0 (+https://1cite.com)" },
    });
    const body = response.ok ? await response.text() : "";
    return evaluateLlmsTxt(response.ok, body);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Skorlama: her kategori 100'den başlar, fail eden her kural ağırlığı kadar düşer.
// ---------------------------------------------------------------------------

export function computeScores(results: SiteHealthRuleResult[]): { technicalScore: number; aeoScore: number } {
  let technical = 100;
  let aeo = 100;
  for (const result of results) {
    if (result.passed) continue;
    const weight = SEVERITY_WEIGHT[result.severity];
    if (result.scoreCategories.includes("technical")) technical -= weight;
    if (result.scoreCategories.includes("aeo")) aeo -= weight;
  }
  return { technicalScore: Math.max(0, technical), aeoScore: Math.max(0, aeo) };
}

// ---------------------------------------------------------------------------
// findings idempotency: (brand_id, rule_id, url, finding_type='site_health',
// status='open') anahtarıyla açık kayıt var mı diye bakılır. url, findings
// tablosunda ayrı bir kolon değil; affected_entities jsonb'sinde [{url}]
// olarak tutulduğundan jsonb containment (@>, .contains()) ile aranır.
// ---------------------------------------------------------------------------

async function findOpenFinding(
  brandId: string,
  ruleId: SiteHealthRuleId,
  url: string,
): Promise<{ id: string } | null> {
  const { data, error } = await supabaseAdmin
    .from("findings" as never)
    .select("id" as never)
    .eq("brand_id" as never, brandId)
    .eq("rule_id" as never, ruleId)
    .eq("finding_type" as never, "site_health")
    .eq("status" as never, "open")
    .contains("affected_entities" as never, [{ url }] as never)
    .maybeSingle();
  if (error) {
    console.error(`site-health: açık bulgu sorgusu başarısız (${ruleId}, ${url})`, error);
    return null;
  }
  return data as unknown as { id: string } | null;
}

async function reconcileFinding(
  brandId: string,
  url: string,
  result: SiteHealthRuleResult,
): Promise<"opened" | "resolved" | "unchanged"> {
  const existing = await findOpenFinding(brandId, result.ruleId, url);
  if (!result.passed) {
    if (existing) return "unchanged";
    const { error } = await supabaseAdmin.from("findings" as never).insert({
      brand_id: brandId,
      finding_type: "site_health",
      category: result.category,
      severity: result.severity,
      rule_id: result.ruleId,
      title: result.title,
      detection: result.detection,
      recommendation: result.recommendation,
      affected_entities: [{ url }],
      status: "open",
    } as never);
    if (error) {
      console.error(`site-health: bulgu eklenemedi (${result.ruleId}, ${url})`, error);
      return "unchanged";
    }
    return "opened";
  }
  if (existing) {
    const { error } = await supabaseAdmin
      .from("findings" as never)
      .update({ status: "resolved" } as never)
      .eq("id" as never, existing.id);
    if (error) {
      console.error(`site-health: bulgu kapatılamadı (${result.ruleId}, ${url})`, error);
      return "unchanged";
    }
    return "resolved";
  }
  return "unchanged";
}

// ---------------------------------------------------------------------------
// Orkestrasyon
// ---------------------------------------------------------------------------

/**
 * Bir markanın sitesini tarar: URL keşfi (ilk 20 sayfa, 4'lü eşzamanlılık),
 * sayfa başına 12 kural + site başına 1 llms.txt kuralı, technical/aeo skorlama,
 * site_health_pages upsert'i ve findings idempotent açma/kapama.
 *
 * Brand üyeliği doğrulaması burada YAPILMAZ — çağıran fonksiyon RLS üzerinden
 * doğrulayıp domain'i aldıktan sonra bunu çağırmalı.
 */
export async function runAudit(brandId: string, domain: string): Promise<RunAuditResult> {
  const rootUrl = `https://${domain}`;

  const llmsPassed = await fetchLlmsTxt(domain);
  const llmsResult = buildLlmsTxtRuleResult(domain, llmsPassed);

  const discovered = await firecrawlV2.map(rootUrl).catch((error: unknown) => {
    console.error(`site-health: URL keşfi başarısız (${domain})`, error);
    return [];
  });
  const urls = discovered.slice(0, 20).map((page) => page.url);

  let findingsOpened = 0;
  let findingsResolved = 0;
  const pageScores: Array<{ technicalScore: number; aeoScore: number }> = [];

  await runPool(urls, 4, async (url) => {
    let html: string;
    try {
      const doc = await firecrawlV2.scrapeDocument(url);
      html = doc.html;
    } catch (error) {
      console.error(`site-health: sayfa taranamadı (${url})`, error);
      return;
    }
    if (!html.trim()) {
      console.error(`site-health: boş HTML döndü (${url})`);
      return;
    }

    const pageResults = runPageRules(html);
    // llms.txt sonucu site geneli — taranan her sayfanın skoruna ve issue_count'una
    // aynı şekilde yansır (bkz. görev raporu, "llms.txt" başlığı).
    const allResults = [...pageResults, llmsResult];
    const { technicalScore, aeoScore } = computeScores(allResults);
    const issueCount = allResults.filter((result) => !result.passed).length;

    const { error: upsertError } = await supabaseAdmin.from("site_health_pages" as never).upsert(
      {
        brand_id: brandId,
        url,
        technical_score: technicalScore,
        aeo_score: aeoScore,
        issue_count: issueCount,
        last_audited_at: new Date().toISOString(),
      } as never,
      { onConflict: "brand_id,url" },
    );
    if (upsertError) {
      console.error(`site-health: site_health_pages upsert başarısız (${url})`, upsertError);
      return;
    }

    // llms.txt bulgusu sayfa sayısı kadar mükerrer açılmaz — döngü dışında, tek
    // sefer, url = domain kök URL'si ile işlenir.
    for (const result of pageResults) {
      const outcome = await reconcileFinding(brandId, url, result);
      if (outcome === "opened") findingsOpened += 1;
      else if (outcome === "resolved") findingsResolved += 1;
    }

    pageScores.push({ technicalScore, aeoScore });
  });

  const llmsOutcome = await reconcileFinding(brandId, rootUrl, llmsResult);
  if (llmsOutcome === "opened") findingsOpened += 1;
  else if (llmsOutcome === "resolved") findingsResolved += 1;

  const pagesAudited = pageScores.length;
  const technicalScore = pagesAudited
    ? Math.round(pageScores.reduce((sum, page) => sum + page.technicalScore, 0) / pagesAudited)
    : 0;
  const aeoScore = pagesAudited
    ? Math.round(pageScores.reduce((sum, page) => sum + page.aeoScore, 0) / pagesAudited)
    : 0;

  return { pagesAudited, findingsOpened, findingsResolved, technicalScore, aeoScore };
}
