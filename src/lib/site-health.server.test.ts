import { afterEach, describe, expect, it, vi } from "vitest";

// supabaseAdmin çağrıları reconcileFinding testlerinde sahte bir sorgu zinciriyle
// yakalanır (gerçek DB'ye bağlanmaz). `state.from` her testte yeniden atanır.
const state = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: (...args: unknown[]) => state.from(...args) },
}));

import {
  computeScores,
  evaluateLlmsTxt,
  reconcileFinding,
  runPageRules,
} from "./site-health.server";
import type { SiteHealthRuleResult } from "./site-health.server";

// ---------------------------------------------------------------------------
// HTML fixtures
// ---------------------------------------------------------------------------

const GOOD_HTML = `
<html>
<head>
<title>Örnek Marka - Ana Sayfa</title>
<meta name="description" content="Örnek marka hakkında kısa ve öz bir açıklama metni." />
<meta property="og:title" content="Örnek Marka" />
<meta property="og:description" content="Örnek marka açıklaması burada yer alır." />
<meta property="og:image" content="https://example.com/og.png" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[
  {"@type":"WebSite","name":"Örnek Marka","url":"https://example.com"},
  {"@type":"Organization","name":"Örnek Marka","logo":"https://example.com/logo.png"},
  {"@type":"BreadcrumbList","itemListElement":[]}
]}
</script>
</head>
<body>
<h1>Örnek Marka Ana Sayfa</h1>
<h2>Alt Başlık</h2>
<p>İçerik metni burada yer alır.</p>
</body>
</html>`;

const EMPTY_HTML = "<html><head></head><body></body></html>";

const ORG_NO_LOGO_HTML = `
<html>
<head>
<title>Logo Yok</title>
<script type="application/ld+json">
{"@type":"Organization","name":"Örnek Marka"}
</script>
</head>
<body><h1>Başlık</h1></body>
</html>`;

const LOCAL_BUSINESS_WITH_LOGO_HTML = `
<html>
<head>
<title>Yerel İşletme</title>
<script type="application/ld+json">
{"@type":"LocalBusiness","name":"Örnek Şube","logo":{"@type":"ImageObject","url":"https://example.com/logo.png"}}
</script>
</head>
<body><h1>Başlık</h1></body>
</html>`;

const LONG_TITLE =
  "Bu başlık kasıtlı olarak altmış karakter sınırını kesinlikle aşacak kadar uzun tutulmuştur";

const TITLE_TOO_LONG_HTML = `
<html><head><title>${LONG_TITLE}</title></head><body></body></html>`;

const H1_MISSING_HTML = GOOD_HTML.replace("<h1>Örnek Marka Ana Sayfa</h1>", "");

function findRule(results: SiteHealthRuleResult[], ruleId: string): SiteHealthRuleResult {
  const found = results.find((r) => r.ruleId === ruleId);
  if (!found) throw new Error(`rule not found in results: ${ruleId}`);
  return found;
}

// ---------------------------------------------------------------------------
// Her kural için en az bir "fail" ve bir "pass" örneği
// ---------------------------------------------------------------------------

describe("runPageRules — GOOD_HTML tüm sayfa kuralları geçer", () => {
  const results = runPageRules(GOOD_HTML);

  it("12 sayfa kuralının tamamını üretir (title_too_long dahil, title boş değil)", () => {
    expect(results).toHaveLength(12);
  });

  it("website_schema_missing geçer", () => {
    expect(findRule(results, "website_schema_missing").passed).toBe(true);
  });

  it("organization_schema_missing geçer", () => {
    expect(findRule(results, "organization_schema_missing").passed).toBe(true);
  });

  it("h1_missing geçer", () => {
    expect(findRule(results, "h1_missing").passed).toBe(true);
  });

  it("title_missing geçer", () => {
    expect(findRule(results, "title_missing").passed).toBe(true);
  });

  it("title_too_long geçer (title kısa)", () => {
    expect(findRule(results, "title_too_long").passed).toBe(true);
  });

  it("meta_description_missing geçer", () => {
    expect(findRule(results, "meta_description_missing").passed).toBe(true);
  });

  it("h2_missing geçer", () => {
    expect(findRule(results, "h2_missing").passed).toBe(true);
  });

  it("og_title_missing geçer", () => {
    expect(findRule(results, "og_title_missing").passed).toBe(true);
  });

  it("og_description_missing geçer", () => {
    expect(findRule(results, "og_description_missing").passed).toBe(true);
  });

  it("og_image_missing geçer", () => {
    expect(findRule(results, "og_image_missing").passed).toBe(true);
  });

  it("twitter_card_missing geçer", () => {
    expect(findRule(results, "twitter_card_missing").passed).toBe(true);
  });

  it("breadcrumb_schema_missing geçer", () => {
    expect(findRule(results, "breadcrumb_schema_missing").passed).toBe(true);
  });
});

describe("runPageRules — EMPTY_HTML üzerinde kurallar fail olur", () => {
  const results = runPageRules(EMPTY_HTML);

  it("website_schema_missing fail olur", () => {
    expect(findRule(results, "website_schema_missing").passed).toBe(false);
  });

  it("organization_schema_missing fail olur (reason: missing)", () => {
    const rule = findRule(results, "organization_schema_missing");
    expect(rule.passed).toBe(false);
    expect(rule.detection).toContain("Organization veya LocalBusiness");
  });

  it("h1_missing fail olur", () => {
    expect(findRule(results, "h1_missing").passed).toBe(false);
  });

  it("title_missing fail olur", () => {
    expect(findRule(results, "title_missing").passed).toBe(false);
  });

  it("title boşken title_too_long hiç değerlendirilmez (skip)", () => {
    expect(results.some((r) => r.ruleId === "title_too_long")).toBe(false);
    // title_missing fail olduğu için sadece 11 kural üretilir (title_too_long atlanır).
    expect(results).toHaveLength(11);
  });

  it("meta_description_missing fail olur", () => {
    expect(findRule(results, "meta_description_missing").passed).toBe(false);
  });

  it("h2_missing fail olur", () => {
    expect(findRule(results, "h2_missing").passed).toBe(false);
  });

  it("og_title_missing fail olur", () => {
    expect(findRule(results, "og_title_missing").passed).toBe(false);
  });

  it("og_description_missing fail olur", () => {
    expect(findRule(results, "og_description_missing").passed).toBe(false);
  });

  it("og_image_missing fail olur", () => {
    expect(findRule(results, "og_image_missing").passed).toBe(false);
  });

  it("twitter_card_missing fail olur", () => {
    expect(findRule(results, "twitter_card_missing").passed).toBe(false);
  });

  it("breadcrumb_schema_missing fail olur", () => {
    expect(findRule(results, "breadcrumb_schema_missing").passed).toBe(false);
  });
});

describe("title_too_long", () => {
  it("title 60 karakterden uzunsa fail olur", () => {
    expect(LONG_TITLE.length).toBeGreaterThan(60);
    const results = runPageRules(TITLE_TOO_LONG_HTML);
    expect(findRule(results, "title_missing").passed).toBe(true); // title var
    expect(findRule(results, "title_too_long").passed).toBe(false);
  });
});

describe("organization_schema_missing — iki ayrı fail modu", () => {
  it("Organization/LocalBusiness hiç yoksa 'missing' metni üretir", () => {
    const rule = findRule(runPageRules(EMPTY_HTML), "organization_schema_missing");
    expect(rule.passed).toBe(false);
    expect(rule.title).toBe("Organization şeması eksik");
    expect(rule.detection).toContain("Organization veya LocalBusiness");
  });

  it("Organization var ama logo boşsa 'no-logo' metni üretir (farklı metin)", () => {
    const rule = findRule(runPageRules(ORG_NO_LOGO_HTML), "organization_schema_missing");
    expect(rule.passed).toBe(false);
    expect(rule.title).toBe("Organization şemasında logo eksik");
    expect(rule.detection).toContain("logo alanı eksik");
  });

  it("iki fail modunun detection metni birbirinden farklıdır", () => {
    const missing = findRule(runPageRules(EMPTY_HTML), "organization_schema_missing");
    const noLogo = findRule(runPageRules(ORG_NO_LOGO_HTML), "organization_schema_missing");
    expect(missing.detection).not.toBe(noLogo.detection);
  });

  it("LocalBusiness + nesne biçimli (ImageObject) logo geçerli sayılır", () => {
    const rule = findRule(
      runPageRules(LOCAL_BUSINESS_WITH_LOGO_HTML),
      "organization_schema_missing",
    );
    expect(rule.passed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// llms.txt — evaluateLlmsTxt (saf fonksiyon, ağdan ayrık)
// ---------------------------------------------------------------------------

describe("evaluateLlmsTxt", () => {
  it("200 + boş olmayan içerik → geçer", () => {
    expect(evaluateLlmsTxt(true, "# Örnek Marka\nBu marka hakkında bilgiler...")).toBe(true);
  });

  it("200 ama boş içerik → fail olur", () => {
    expect(evaluateLlmsTxt(true, "   ")).toBe(false);
  });

  it("200 değilse (ok=false) → fail olur", () => {
    expect(evaluateLlmsTxt(false, "içerik olsa bile")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computeScores — ağırlık tablosu, taban (floor) ve dual-category davranışı
// ---------------------------------------------------------------------------

describe("computeScores", () => {
  it("high=15/medium=8/low=3 ağırlık tablosunu uygular", () => {
    const results: SiteHealthRuleResult[] = [
      {
        ruleId: "title_missing",
        category: "technical",
        severity: "high",
        scoreCategories: ["technical"],
        passed: false,
        title: "",
        detection: "",
        recommendation: "",
      },
      {
        ruleId: "meta_description_missing",
        category: "technical",
        severity: "medium",
        scoreCategories: ["technical"],
        passed: false,
        title: "",
        detection: "",
        recommendation: "",
      },
      {
        ruleId: "twitter_card_missing",
        category: "technical",
        severity: "low",
        scoreCategories: ["technical"],
        passed: false,
        title: "",
        detection: "",
        recommendation: "",
      },
    ];
    expect(computeScores(results)).toEqual({ technicalScore: 100 - 15 - 8 - 3, aeoScore: 100 });
  });

  it("h1_missing fail olduğunda HEM technical HEM aeo skorundan düşer", () => {
    const results = runPageRules(H1_MISSING_HTML);
    const { technicalScore, aeoScore } = computeScores(results);
    expect(technicalScore).toBe(100 - 15);
    expect(aeoScore).toBe(100 - 15);
  });

  it("llms_txt_missing fail olduğunda HEM technical HEM aeo skorundan düşer", () => {
    // buildLlmsTxtRuleResult dışa açık değil (site-health.server.ts içinde private) —
    // runAudit'in ürettiği gerçek şekli (category: technical, scoreCategories:
    // [technical, aeo], severity: medium) burada birebir yeniden üretiliyor.
    const llmsResult: SiteHealthRuleResult = {
      ruleId: "llms_txt_missing",
      category: "technical",
      severity: "medium",
      scoreCategories: ["technical", "aeo"],
      passed: false,
      title: "llms.txt dosyası yok",
      detection: "",
      recommendation: "",
    };
    const { technicalScore, aeoScore } = computeScores([llmsResult]);
    expect(technicalScore).toBe(100 - 8);
    expect(aeoScore).toBe(100 - 8);
  });

  it("geçen kurallar hiçbir skoru düşürmez", () => {
    expect(computeScores(runPageRules(GOOD_HTML))).toEqual({ technicalScore: 100, aeoScore: 100 });
  });

  it("0'da taban: yeterince fail olan kural varsa skor negatif olmaz", () => {
    // Gerçek 12 sayfa kuralı + 1 llms.txt kuralı tek başına 100 puanı asla
    // aşamaz (technical maks. 95, aeo maks. 61 — bkz. rapor). Taban mantığını
    // gerçekten sınamak için burada kasıtlı olarak sentetik/yinelenmiş,
    // ağırlığı yüksek fail'ler kullanılıyor.
    const heavyFail: SiteHealthRuleResult = {
      ruleId: "website_schema_missing",
      category: "aeo",
      severity: "high",
      scoreCategories: ["technical", "aeo"],
      passed: false,
      title: "",
      detection: "",
      recommendation: "",
    };
    const manyFails = Array.from({ length: 10 }, () => heavyFail); // 10 * 15 = 150
    expect(computeScores(manyFails)).toEqual({ technicalScore: 0, aeoScore: 0 });
  });
});

// ---------------------------------------------------------------------------
// reconcileFinding — Fix 4 (resolved bulgu sessizce yeniden açılmamalı) +
// Fix 5 (sorgu hatası açık kayıt yokmuş gibi yutulmamalı, sadece bu kural
// atlanmalı).
// ---------------------------------------------------------------------------

/** reconcileFinding'in beklediği findings tablosu sorgu zincirini taklit eder. */
function mockFindingsChain(opts: {
  selectResult?: { data: unknown; error: unknown };
  insertResult?: { error: unknown };
  updateResult?: { error: unknown };
}) {
  const insertCalls: unknown[] = [];
  const updateCalls: unknown[] = [];
  let mode: "select" | "write" = "select";

  const builder: Record<string, unknown> = {
    select: vi.fn(() => {
      mode = "select";
      return builder;
    }),
    eq: vi.fn(() => {
      if (mode === "write") return Promise.resolve(opts.updateResult ?? { error: null });
      return builder;
    }),
    contains: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(opts.selectResult ?? { data: null, error: null })),
    insert: vi.fn((payload: unknown) => {
      mode = "write";
      insertCalls.push(payload);
      return Promise.resolve(opts.insertResult ?? { error: null });
    }),
    update: vi.fn((payload: unknown) => {
      mode = "write";
      updateCalls.push(payload);
      return builder;
    }),
  };

  return { builder, insertCalls, updateCalls };
}

const FAILING_RESULT: SiteHealthRuleResult = {
  ruleId: "h1_missing",
  category: "technical",
  severity: "high",
  scoreCategories: ["technical", "aeo"],
  passed: false,
  title: "H1 başlığı eksik",
  detection: "...",
  recommendation: "...",
};

const PASSING_RESULT: SiteHealthRuleResult = { ...FAILING_RESULT, passed: true };

describe("reconcileFinding", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("kayıt hiç yoksa VE kural fail ise → yeni open bulgu eklenir", async () => {
    const { builder, insertCalls } = mockFindingsChain({
      selectResult: { data: null, error: null },
    });
    state.from.mockReturnValue(builder);

    const outcome = await reconcileFinding("brand-1", "https://x.com", FAILING_RESULT);

    expect(outcome).toBe("opened");
    expect(insertCalls).toHaveLength(1);
    expect((insertCalls[0] as { status: string }).status).toBe("open");
  });

  it("OPEN bulgu varken kural hâlâ fail ise → dokunulmaz (unchanged, mükerrer yok)", async () => {
    const { builder, insertCalls, updateCalls } = mockFindingsChain({
      selectResult: { data: { id: "f-1", status: "open" }, error: null },
    });
    state.from.mockReturnValue(builder);

    const outcome = await reconcileFinding("brand-1", "https://x.com", FAILING_RESULT);

    expect(outcome).toBe("unchanged");
    expect(insertCalls).toHaveLength(0);
    expect(updateCalls).toHaveLength(0);
  });

  it("RESOLVED bulgu varken kural hâlâ fail ise → YENİ kayıt açılmaz, resolved satıra dokunulmaz (Fix 4)", async () => {
    const { builder, insertCalls, updateCalls } = mockFindingsChain({
      selectResult: { data: { id: "f-1", status: "resolved" }, error: null },
    });
    state.from.mockReturnValue(builder);

    const outcome = await reconcileFinding("brand-1", "https://x.com", FAILING_RESULT);

    expect(outcome).toBe("unchanged");
    expect(insertCalls).toHaveLength(0); // "Mark Fixed" sessizce yeniden açılmadı
    expect(updateCalls).toHaveLength(0); // resolved satır değiştirilmedi
  });

  it("OPEN bulgu varken kural artık geçiyorsa → resolved'a çekilir", async () => {
    const { builder, updateCalls } = mockFindingsChain({
      selectResult: { data: { id: "f-1", status: "open" }, error: null },
    });
    state.from.mockReturnValue(builder);

    const outcome = await reconcileFinding("brand-1", "https://x.com", PASSING_RESULT);

    expect(outcome).toBe("resolved");
    expect(updateCalls).toHaveLength(1);
    expect((updateCalls[0] as { status: string }).status).toBe("resolved");
  });

  it("RESOLVED bulgu varken kural geçiyorsa → hiçbir şey yapılmaz", async () => {
    const { builder, insertCalls, updateCalls } = mockFindingsChain({
      selectResult: { data: { id: "f-1", status: "resolved" }, error: null },
    });
    state.from.mockReturnValue(builder);

    const outcome = await reconcileFinding("brand-1", "https://x.com", PASSING_RESULT);

    expect(outcome).toBe("unchanged");
    expect(insertCalls).toHaveLength(0);
    expect(updateCalls).toHaveLength(0);
  });

  it("kayıt yokken kural geçiyorsa → hiçbir şey yapılmaz", async () => {
    const { builder, insertCalls, updateCalls } = mockFindingsChain({
      selectResult: { data: null, error: null },
    });
    state.from.mockReturnValue(builder);

    const outcome = await reconcileFinding("brand-1", "https://x.com", PASSING_RESULT);

    expect(outcome).toBe("unchanged");
    expect(insertCalls).toHaveLength(0);
    expect(updateCalls).toHaveLength(0);
  });

  it("sorgu hatası 'kayıt yok' ile karıştırılmaz: sadece bu kural atlanır, mükerrer insert olmaz (Fix 5)", async () => {
    const { builder, insertCalls, updateCalls } = mockFindingsChain({
      selectResult: { data: null, error: { message: "network error" } },
    });
    state.from.mockReturnValue(builder);

    const outcome = await reconcileFinding("brand-1", "https://x.com", FAILING_RESULT);

    expect(outcome).toBe("unchanged");
    expect(insertCalls).toHaveLength(0);
    expect(updateCalls).toHaveLength(0);
  });
});
