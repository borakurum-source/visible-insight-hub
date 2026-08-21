import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getPanelSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: roles }, { data: brands }] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, avatar_url").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("brands").select("id, name, domain, onboarding_step, onboarding_completed").order("created_at"),
    ]);
    return {
      profile: profile ?? { id: userId, email: null, full_name: null, avatar_url: null },
      isAdmin: (roles ?? []).some((r) => r.role === "admin"),
      brands: brands ?? [],
    };
  });

export const createBrand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string; domain: string }) => input)
  .handler(async ({ data, context }) => {
    const { normalizeDomain } = await import("./ai.server");
    const { assertBrandQuota } = await import("./plan.server");
    await assertBrandQuota(context.supabase, context.userId);
    const domain = normalizeDomain(data.domain);
    const name = data.name.trim() || domain;
    if (!domain) throw new Error("Geçerli bir alan adı girin");
    const { data: brand, error } = await context.supabase
      .from("brands")
      .insert({ name, domain, created_by: context.userId, onboarding_step: 2 })
      .select("id, name, domain, onboarding_step, onboarding_completed")
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.from("brand_domains").insert({ brand_id: brand.id, domain, is_primary: true });
    return brand;
  });

export const getBrandIntelligence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("brand_intelligence")
      .select("*")
      .eq("brand_id", data.brandId)
      .maybeSingle();
    return row;
  });

export const generateBrandIntelligence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { aiJson, fetchSiteText } = await import("./ai.server");
    const { resolveSystemPrompt } = await import("./system-prompts.server");
    const { data: brand } = await context.supabase
      .from("brands").select("id, name, domain").eq("id", data.brandId).single();
    if (!brand) throw new Error("Marka bulunamadı");

    const siteText = await fetchSiteText(brand.domain);
    const systemPrompt = await resolveSystemPrompt(context.supabase, "brand_intelligence");
    const result = await aiJson<{
      summary: string; detailedDescription?: string; industry?: string; language?: string; location?: string;
      positioning: string; tone: string;
      products: string[]; audiences: string[]; keyFeatures?: string[];
      competitors: unknown; keywords: string[];
    }>(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Marka: ${brand.name}\nAlan adı: ${brand.domain}\nSite metni:\n${siteText || "(site metni alınamadı, alan adından çıkarım yap)"}` },
      ],
      { summary: "", positioning: "", tone: "", products: [], audiences: [], competitors: [], keywords: [] },
    );

    const { normalizeCompetitors } = await import("./competitors");
    const payload = {
      brand_id: brand.id,
      summary: result.summary,
      detailed_description: result.detailedDescription ?? null,
      industry: result.industry ?? null,
      language: result.language ?? "Türkçe",
      location: result.location ?? null,
      key_features: result.keyFeatures ?? [],
      positioning: result.positioning,
      tone: result.tone,
      products: result.products,
      audiences: result.audiences,
      competitors: normalizeCompetitors(result.competitors),
      keywords: result.keywords,
      approved: false,
    };
    const { data: saved, error } = await context.supabase
      .from("brand_intelligence").upsert(payload, { onConflict: "brand_id" }).select("*").single();
    if (error) throw new Error(error.message);
    return saved;
  });

export const saveBrandIntelligence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    brandId: string; summary: string; positioning: string; tone: string;
    products: string[]; audiences: string[]; competitors?: Array<{ name: string; domain?: string; type?: string }>; keywords: string[];
    industry?: string; language?: string; location?: string; detailedDescription?: string; keyFeatures?: string[];
    brandName?: string;
  }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("brand_intelligence").upsert({
      brand_id: data.brandId,
      summary: data.summary,
      positioning: data.positioning,
      tone: data.tone,
      products: data.products,
      audiences: data.audiences,
      ...(data.competitors ? { competitors: JSON.parse(JSON.stringify(data.competitors)) } : {}),
      keywords: data.keywords,
      industry: data.industry ?? null,
      language: data.language ?? null,
      location: data.location ?? null,
      detailed_description: data.detailedDescription ?? null,
      key_features: data.keyFeatures ?? [],
      approved: true,
    }, { onConflict: "brand_id" });
    if (error) throw new Error(error.message);
    if (data.brandName && data.brandName.trim()) {
      await context.supabase.from("brands").update({ name: data.brandName.trim() }).eq("id", data.brandId);
    }
    await context.supabase.from("brands").update({ onboarding_step: 3 }).eq("id", data.brandId);
    return { ok: true };
  });

export const suggestKnowledgeSources = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { fetchSitemapUrls, aiJson } = await import("./ai.server");
    const { resolveSystemPrompt } = await import("./system-prompts.server");
    const { data: brand } = await context.supabase.from("brands").select("domain, name").eq("id", data.brandId).single();
    if (!brand) throw new Error("Marka bulunamadı");
    const urls = await fetchSitemapUrls(brand.domain);
    if (urls.length) {
      const picked = await aiJson<{ items: Array<{ title: string; url: string }> }>(
        [
          { role: "system", content: await resolveSystemPrompt(context.supabase, "knowledge_source_pick") },
          { role: "user", content: `Marka: ${brand.name}\nURL'ler:\n${urls.join("\n")}` },
        ],
        { items: urls.slice(0, 8).map((u) => ({ title: u, url: u })) },
      );
      return picked.items;
    }
    const base = `https://${brand.domain}`;
    return [
      { title: "Ana sayfa", url: base },
      { title: "Hakkımızda", url: `${base}/hakkimizda` },
      { title: "Hizmetler", url: `${base}/hizmetler` },
      { title: "İletişim", url: `${base}/iletisim` },
    ];
  });

export const addKnowledgeSources = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; items: Array<{ title: string; url?: string; content?: string }> }) => input)
  .handler(async ({ data, context }) => {
    if (!data.items.length) return { inserted: 0 };
    const rows = data.items.map((item) => ({
      brand_id: data.brandId,
      title: item.title,
      url: item.url ?? null,
      content: item.content ?? null,
      source_type: item.url ? "url" : "text",
    }));
    const { error } = await context.supabase.from("knowledge_sources").insert(rows);
    if (error) throw new Error(error.message);
    await context.supabase.from("brands").update({ onboarding_step: 4 }).eq("id", data.brandId);
    return { inserted: rows.length };
  });

export const listKnowledgeSources = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("knowledge_sources").select("*").eq("brand_id", data.brandId).order("created_at", { ascending: false });
    return rows ?? [];
  });

export const deleteKnowledgeSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("knowledge_sources").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const generatePromptCandidates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { aiJson } = await import("./ai.server");
    const [{ data: brand }, { data: intel }, { data: sources }] = await Promise.all([
      context.supabase.from("brands").select("name, domain").eq("id", data.brandId).single(),
      context.supabase.from("brand_intelligence").select("*").eq("brand_id", data.brandId).maybeSingle(),
      context.supabase.from("knowledge_sources").select("title").eq("brand_id", data.brandId).limit(20),
    ]);
    if (!brand) throw new Error("Marka bulunamadı");

    const { resolveSystemPrompt } = await import("./system-prompts.server");
    const result = await aiJson<{ items: Array<{ text: string; category: string; intent: string; funnel?: string }> }>(
      [
        { role: "system", content: await resolveSystemPrompt(context.supabase, "prompt_generation") },
        { role: "user", content: `Marka: ${brand.name} (${brand.domain})\nÖzet: ${intel?.summary ?? ""}\nÜrünler: ${JSON.stringify(intel?.products ?? [])}\nKitle: ${JSON.stringify(intel?.audiences ?? [])}\nRakipler: ${JSON.stringify(intel?.competitors ?? [])}\nBilgi bankası: ${(sources ?? []).map((s) => s.title).join(", ")}` },
      ],
      { items: [] },
    );

    const rows = result.items.slice(0, 30).map((item) => ({
      brand_id: data.brandId,
      text: item.text,
      category: item.category || "genel",
      intent: item.intent || null,
      funnel_stage: ["top", "middle", "bottom"].includes(String(item.funnel)) ? String(item.funnel) : "middle",
      status: "candidate",
      origin: "ai",
    }));
    if (rows.length) {
      await context.supabase.from("prompts").delete().eq("brand_id", data.brandId).eq("status", "candidate");
      const { error } = await context.supabase.from("prompts").insert(rows);
      if (error) throw new Error(error.message);
    }
    const { data: prompts } = await context.supabase
      .from("prompts").select("*").eq("brand_id", data.brandId).order("created_at");
    return prompts ?? [];
  });

export const listPrompts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("prompts").select("*").eq("brand_id", data.brandId).order("created_at");
    const prompts = rows ?? [];
    if (!prompts.length) return prompts.map((row) => ({ ...row, lastRun: null }));

    const { data: runs } = await context.supabase
      .from("prompt_runs")
      .select("prompt_id, engine, created_at, brand_mentioned, position, visibility, run_index")
      .eq("brand_id", data.brandId)
      .order("created_at", { ascending: false })
      .limit(2000);

    const latest = new Map<string, { engine: string; createdAt: string; brandMentioned: boolean; position: number | null; visibility: number; runIndex: number | null }>();
    for (const run of runs ?? []) {
      if (!run.prompt_id || latest.has(run.prompt_id)) continue;
      const visibility =
        run.visibility === null || run.visibility === undefined
          ? run.brand_mentioned
            ? run.position
              ? Math.max(40, 100 - (run.position - 1) * 10)
              : 60
            : 0
          : Number(run.visibility);
      latest.set(run.prompt_id, {
        engine: run.engine,
        createdAt: run.created_at,
        brandMentioned: Boolean(run.brand_mentioned),
        position: run.position,
        visibility,
        runIndex: run.run_index ?? null,
      });
    }

    return prompts.map((row) => ({ ...row, lastRun: latest.get(row.id) ?? null }));
  });

export type DiscoveredPrompt = {
  text: string;
  cluster: string;
  intent: string;
  rationale: string;
  opportunityScore: number;
};

export const discoverPromptCandidates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }): Promise<DiscoveredPrompt[]> => {
    const { aiJson } = await import("./ai.server");
    const [{ data: brand }, { data: intel }, { data: existing }] = await Promise.all([
      context.supabase.from("brands").select("name, domain").eq("id", data.brandId).single(),
      context.supabase.from("brand_intelligence").select("*").eq("brand_id", data.brandId).maybeSingle(),
      context.supabase.from("prompts").select("text").eq("brand_id", data.brandId).limit(60),
    ]);
    if (!brand) throw new Error("Marka bulunamadı");

    const { resolveSystemPrompt } = await import("./system-prompts.server");
    const result = await aiJson<{ items: DiscoveredPrompt[] }>(
      [
        {
          role: "system",
          content: await resolveSystemPrompt(context.supabase, "prompt_discovery"),
        },
        {
          role: "user",
          content: `Marka: ${brand.name} (${brand.domain})\nÖzet: ${intel?.summary ?? ""}\nÜrünler: ${JSON.stringify(intel?.products ?? [])}\nKitle: ${JSON.stringify(intel?.audiences ?? [])}\nRakipler: ${JSON.stringify(intel?.competitors ?? [])}\nMevcut sorular (tekrar etme): ${(existing ?? []).map((p) => p.text).join(" | ")}`,
        },
      ],
      { items: [] },
    );

    return (result.items ?? [])
      .slice(0, 12)
      .map((item) => ({
        text: String(item.text ?? ""),
        cluster: String(item.cluster ?? "genel"),
        intent: String(item.intent ?? "bilgi"),
        rationale: String(item.rationale ?? ""),
        opportunityScore: Math.max(0, Math.min(100, Number(item.opportunityScore) || 0)),
      }))
      .filter((item) => item.text.length > 4)
      .sort((a, b) => b.opportunityScore - a.opportunityScore);
  });

export const addDiscoveredPrompts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; items: Array<{ text: string; cluster: string; intent: string }> }) => input)
  .handler(async ({ data, context }) => {
    if (!data.items.length) return { inserted: 0 };
    const { assertPromptQuota } = await import("./plan.server");
    const { normalizePromptText } = await import("./prompt-normalize");

    // Get existing approved prompts to check for duplicates
    const { data: existing } = await context.supabase
      .from("prompts")
      .select("id, text")
      .eq("brand_id", data.brandId)
      .eq("status", "approved");

    const existingNormalized = new Set(
      (existing ?? []).map((p) => normalizePromptText(p.text))
    );

    // Filter out duplicates and collect those to insert
    const toInsert = data.items.filter(
      (item) => !existingNormalized.has(normalizePromptText(item.text))
    );

    if (!toInsert.length) {
      return { inserted: 0 };
    }

    await assertPromptQuota(context.supabase, context.userId, data.brandId, toInsert.length);

    const { error } = await context.supabase.from("prompts").insert(
      toInsert.map((item) => ({
        brand_id: data.brandId,
        text: item.text,
        category: item.cluster || "kategori",
        intent: item.intent || null,
        status: "approved",
        origin: "discovery",
      })),
    );
    if (error) throw new Error(error.message);
    return { inserted: toInsert.length };
  });

export const listCitationSources = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("citations")
      .select("domain, url, title, citation_type, is_own_domain, created_at")
      .eq("brand_id", data.brandId)
      .order("created_at", { ascending: false })
      .limit(500);
    type Link = { url: string; title: string; lastSeen: string };
    const map = new Map<
      string,
      { domain: string; count: number; isOwn: boolean; type: string; lastSeen: string; firstSeen: string; sampleUrl: string; links: Link[] }
    >();
    for (const row of rows ?? []) {
      const current = map.get(row.domain);
      const link: Link = { url: row.url, title: row.title ?? row.domain, lastSeen: row.created_at };
      if (current) {
        current.count += 1;
        current.firstSeen = row.created_at;
        if (current.links.length < 8 && !current.links.some((l) => l.url === row.url)) current.links.push(link);
      } else {
        map.set(row.domain, {
          domain: row.domain,
          count: 1,
          isOwn: row.is_own_domain,
          type: row.citation_type ?? (row.is_own_domain ? "own" : "neutral"),
          lastSeen: row.created_at,
          firstSeen: row.created_at,
          sampleUrl: row.url,
          links: [link],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  });

// Ölçüm ekranı: ölçüm turlarını (batch'leri) listele — her tur için tur tarihi, skoru, ölçülen prompt sayısı.
export const listMeasurementRounds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: batches } = await context.supabase
      .from("measurement_batches")
      .select("id, created_at, finished_at, score, status, total_prompts")
      .eq("brand_id", data.brandId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Her batch için o batch'te ölçülen run sayısını bul (Task 1.1: batch_id ile doğrudan, zaman damgası tahmini yerine).
    const rounds = [];
    for (const batch of batches ?? []) {
      const { count: runCount } = await context.supabase
        .from("prompt_runs")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", data.brandId)
        .eq("batch_id", batch.id);

      rounds.push({
        batchId: batch.id,
        roundDate: batch.created_at,
        finishedAt: batch.finished_at,
        score: batch.score ? Number(batch.score) : null,
        status: batch.status,
        runCount: runCount ?? 0,
      });
    }

    return { rounds };
  });

// Ölçüm ekranı: her sorunun yanıtı ve o yanıtta yapay zekanın kullandığı kaynaklar.
export const listRunCitations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; batchId?: string; limit?: number }) => input)
  .handler(async ({ data, context }) => {
    // Eğer batchId verilmişse, o batch'te ölçülen runları al (Task 1.1: batch_id ile doğrudan, zaman damgası tahmini yerine).
    let query = context.supabase
      .from("prompt_runs")
      .select("id, prompt_id, brand_mentioned, position, answer_summary, raw_answer, created_at, prompts(text)")
      .eq("brand_id", data.brandId);

    if (data.batchId) {
      query = query.eq("batch_id", data.batchId);
    }

    const limit = Math.min(Math.max(data.limit ?? 25, 1), 60);
    const { data: runs } = await query
      .order("created_at", { ascending: false })
      .limit(limit);

    const runIds = (runs ?? []).map((r) => r.id);
    const { data: citations } = runIds.length
      ? await context.supabase
          .from("citations")
          .select("run_id, url, domain, title, citation_type, is_own_domain")
          .in("run_id", runIds)
      : { data: [] as Array<{ run_id: string | null; url: string; domain: string; title: string | null; citation_type: string; is_own_domain: boolean }> };

    const byRun = new Map<string, Array<{ url: string; domain: string; title: string; type: string }>>();
    for (const c of citations ?? []) {
      if (!c.run_id) continue;
      const list = byRun.get(c.run_id) ?? [];
      list.push({
        url: c.url,
        domain: c.domain,
        title: c.title ?? c.domain,
        type: c.citation_type ?? (c.is_own_domain ? "own" : "neutral"),
      });
      byRun.set(c.run_id, list);
    }

    return (runs ?? []).map((run) => ({
      id: run.id,
      promptId: run.prompt_id,
      promptText: (run as unknown as { prompts?: { text?: string } }).prompts?.text ?? "",
      brandMentioned: run.brand_mentioned,
      position: run.position,
      answerSummary: run.answer_summary ?? "",
      answer: run.raw_answer ?? run.answer_summary ?? "",
      createdAt: run.created_at,
      sources: byRun.get(run.id) ?? [],
    }));
  });

// Komuta merkezi grafikleri: skor trendi, rakip payı, kaynak dağılımı, kategori kırılımı.
export const getVisibilityAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { normalizeCompetitors, competitorMatches } = await import("./competitors");
    const [{ data: batches }, { data: runs }, { data: citations }, { data: intel }, { data: brand }] = await Promise.all([
      context.supabase
        .from("measurement_batches")
        .select("id, score, finished_at, created_at, status")
        .eq("brand_id", data.brandId)
        .eq("status", "completed")
        .order("created_at", { ascending: true })
        .limit(24),
      context.supabase
        .from("prompt_runs")
        .select("brand_mentioned, position, raw_answer, prompt_id, prompts(category)")
        .eq("brand_id", data.brandId)
        .order("created_at", { ascending: false })
        .limit(400),
      context.supabase.from("citations").select("citation_type, is_own_domain, domain").eq("brand_id", data.brandId).limit(1000),
      context.supabase.from("brand_intelligence").select("competitors").eq("brand_id", data.brandId).maybeSingle(),
      context.supabase.from("brands").select("name").eq("id", data.brandId).single(),
    ]);

    const trend = (batches ?? []).map((b) => ({
      date: (b.finished_at ?? b.created_at).slice(0, 10),
      score: Number(b.score ?? 0),
    }));

    const runRows = runs ?? [];
    const competitors = normalizeCompetitors(intel?.competitors).slice(0, 6);
    const share = [
      {
        name: brand?.name ?? "Markanız",
        mentions: runRows.filter((r) => r.brand_mentioned).length,
        isOwn: true,
      },
      ...competitors.map((competitor) => ({
        name: competitor.name,
        mentions: runRows.filter((r) => competitorMatches(competitor, { answer: r.raw_answer })).length,
        isOwn: false,
      })),
    ].sort((a, b) => b.mentions - a.mentions);

    const citationRows = citations ?? [];
    const mix = [
      { name: "Kendi siteniz", value: citationRows.filter((c) => c.is_own_domain).length },
      { name: "Rakip", value: citationRows.filter((c) => !c.is_own_domain && c.citation_type === "competitor").length },
      { name: "Tarafsız kaynak", value: citationRows.filter((c) => !c.is_own_domain && c.citation_type !== "competitor").length },
    ];

    const categoryMap = new Map<string, { category: string; total: number; mentioned: number }>();
    for (const run of runRows) {
      const category = (run as unknown as { prompts?: { category?: string } }).prompts?.category ?? "genel";
      const entry = categoryMap.get(category) ?? { category, total: 0, mentioned: 0 };
      entry.total += 1;
      if (run.brand_mentioned) entry.mentioned += 1;
      categoryMap.set(category, entry);
    }
    const categories = Array.from(categoryMap.values())
      .map((c) => ({ ...c, rate: c.total ? Math.round((c.mentioned / c.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);

    const positions = runRows.map((r) => r.position).filter((p): p is number => typeof p === "number");
    return {
      trend,
      share,
      mix,
      categories,
      totalRuns: runRows.length,
      mentionRate: runRows.length ? Math.round((runRows.filter((r) => r.brand_mentioned).length / runRows.length) * 100) : 0,
      avgPosition: positions.length ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10 : null,
    };
  });

export const setPromptStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ids: string[]; status: string }) => input)
  .handler(async ({ data, context }) => {
    if (!data.ids.length) return { ok: true };
    if (data.status === "approved") {
      const { assertPromptQuota } = await import("./plan.server");
      const { normalizePromptText } = await import("./prompt-normalize");

      const { data: rows } = await context.supabase
        .from("prompts").select("id, brand_id, status, text").in("id", data.ids);
      const pending = (rows ?? []).filter((r) => r.status !== "approved");

      // For each pending prompt, check if approved version already exists
      const toApprove: string[] = [];
      const toSkip: string[] = [];

      for (const candidate of pending) {
        const { data: approved } = await context.supabase
          .from("prompts")
          .select("id, text")
          .eq("brand_id", candidate.brand_id)
          .eq("status", "approved")
          .limit(1000);

        const duplicate = approved?.find(
          (p) => normalizePromptText(p.text) === normalizePromptText(candidate.text)
        );

        if (duplicate) {
          toSkip.push(candidate.id);
        } else {
          toApprove.push(candidate.id);
        }
      }

      // Check quota only for prompts that will actually be approved
      if (toApprove.length > 0) {
        const byBrand = new Map<string, number>();
        for (const id of toApprove) {
          const r = rows?.find((row) => row.id === id);
          if (r) byBrand.set(r.brand_id, (byBrand.get(r.brand_id) ?? 0) + 1);
        }
        for (const [brandId, adding] of byBrand) {
          await assertPromptQuota(context.supabase, context.userId, brandId, adding);
        }

        // Approve non-duplicate prompts
        const { error } = await context.supabase.from("prompts").update({ status: "approved" }).in("id", toApprove);
        if (error) throw new Error(error.message);
      }

      // Skip duplicates by not updating them (they remain as candidate/other status)
      // This allows the user to see they were not approved due to duplicates
      return { ok: true };
    }

    const { error } = await context.supabase.from("prompts").update({ status: data.status }).in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; text: string }) => input)
  .handler(async ({ data, context }) => {
    const { assertPromptQuota } = await import("./plan.server");
    const { normalizePromptText } = await import("./prompt-normalize");

    await assertPromptQuota(context.supabase, context.userId, data.brandId, 1);

    // Check if brand already has this prompt (approved) with normalized text
    const normalizedText = normalizePromptText(data.text);
    const { data: existing } = await context.supabase
      .from("prompts")
      .select("id, text")
      .eq("brand_id", data.brandId)
      .eq("status", "approved")
      .limit(1000);

    const duplicate = existing?.find(
      (p) => normalizePromptText(p.text) === normalizedText
    );

    if (duplicate) {
      throw new Error(`Marka zaten bu soruyu izliyor: "${duplicate.text}"`);
    }

    const { error } = await context.supabase.from("prompts").insert({
      brand_id: data.brandId, text: data.text, status: "approved", origin: "manual", category: "genel",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("prompts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("brands").update({ onboarding_completed: true, onboarding_step: 4 }).eq("id", data.brandId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Kurulum sihirbazında prompt metni ve huni aşamasını günceller.
export const updatePrompts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { items: Array<{ id: string; text: string; funnelStage: string }> }) => input)
  .handler(async ({ data, context }) => {
    for (const item of data.items) {
      const stage = ["top", "middle", "bottom"].includes(item.funnelStage) ? item.funnelStage : "middle";
      await context.supabase
        .from("prompts")
        .update({ text: item.text, funnel_stage: stage })
        .eq("id", item.id);
    }
    return { ok: true };
  });

// Kurulumda seçilen yapay zeka motorlarını saklar.
export const setBrandEngines = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; engines: string[] }) => input)
  .handler(async ({ data, context }) => {
    const allowed = ["perplexity", "deepseek"];
    const engines = data.engines.filter((e) => allowed.includes(e));
    const { error } = await context.supabase
      .from("brands")
      .update({ engines: engines.length ? engines : ["perplexity"] })
      .eq("id", data.brandId);
    if (error) throw new Error(error.message);
    return { ok: true, engines };
  });

export const getBrandEngines = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("brands").select("engines").eq("id", data.brandId).maybeSingle();
    return { engines: (row?.engines as string[] | null) ?? ["perplexity", "deepseek"] };
  });

export const getBrandOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const [prompts, sources, claims, runs, citations] = await Promise.all([
      context.supabase.from("prompts").select("id, status", { count: "exact", head: true }).eq("brand_id", data.brandId).eq("status", "approved"),
      context.supabase.from("knowledge_sources").select("id", { count: "exact", head: true }).eq("brand_id", data.brandId),
      context.supabase.from("claims").select("id", { count: "exact", head: true }).eq("brand_id", data.brandId),
      context.supabase.from("prompt_runs").select("brand_mentioned").eq("brand_id", data.brandId),
      context.supabase.from("citations").select("id", { count: "exact", head: true }).eq("brand_id", data.brandId),
    ]);
    const runRows = runs.data ?? [];
    const mentioned = runRows.filter((r) => r.brand_mentioned).length;
    return {
      approvedPrompts: prompts.count ?? 0,
      knowledgeSources: sources.count ?? 0,
      claims: claims.count ?? 0,
      runs: runRows.length,
      citations: citations.count ?? 0,
      mentionRate: runRows.length ? Math.round((mentioned / runRows.length) * 100) : 0,
    };
  });

export const listClaims = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("claims").select("*").eq("brand_id", data.brandId).order("created_at", { ascending: false });
    return rows ?? [];
  });

export const createClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; statement: string; evidenceUrl?: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("claims").insert({
      brand_id: data.brandId, statement: data.statement, evidence_url: data.evidenceUrl ?? null, status: "draft",
    });
    if (error) throw new Error(error.message);
    const { syncClaimsKnowledgeSource } = await import("./claims.server");
    await syncClaimsKnowledgeSource(context.supabase, data.brandId);
    return { ok: true };
  });

export const deleteClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; brandId?: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("claims").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    if (data.brandId) {
      const { syncClaimsKnowledgeSource } = await import("./claims.server");
      await syncClaimsKnowledgeSource(context.supabase, data.brandId);
    }
    return { ok: true };
  });

// Her iddia icin: bilgi bankasinda indekslendi mi, kanit linki AI yanitlarinda atif aldi mi,
// iddia olcum yanitlarinda tekrar edildi mi.
export const getClaimsInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { claimEchoScore } = await import("./claims.server");
    const [claimsRes, runsRes, citationsRes, sourceRes] = await Promise.all([
      context.supabase.from("claims").select("*").eq("brand_id", data.brandId).order("created_at", { ascending: false }),
      context.supabase.from("prompt_runs").select("raw_answer, answer_summary").eq("brand_id", data.brandId).order("created_at", { ascending: false }).limit(80),
      context.supabase.from("citations").select("url").eq("brand_id", data.brandId),
      context.supabase.from("knowledge_sources").select("index_status, chunk_count, indexed_at").eq("brand_id", data.brandId).eq("title", "Marka İddiaları").maybeSingle(),
    ]);

    const answers = (runsRes.data ?? []).map((r) => `${r.raw_answer ?? ""} ${r.answer_summary ?? ""}`).filter((a) => a.trim());
    const citedUrls = new Set((citationsRes.data ?? []).map((c) => (c.url ?? "").split("?")[0]!.replace(/\/$/, "")));

    const claims = (claimsRes.data ?? []).map((claim) => {
      const echoes = answers.filter((answer) => claimEchoScore(claim.statement, answer) >= 0.6).length;
      const evidence = claim.evidence_url ? claim.evidence_url.split("?")[0]!.replace(/\/$/, "") : null;
      return {
        ...claim,
        echoes,
        evidenceCited: evidence ? citedUrls.has(evidence) : false,
      };
    });

    return {
      claims,
      measuredAnswers: answers.length,
      indexStatus: sourceRes.data?.index_status ?? null,
      indexedChunks: sourceRes.data?.chunk_count ?? 0,
      indexedAt: sourceRes.data?.indexed_at ?? null,
    };
  });

export const listGeoTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("geo_tasks").select("*").eq("brand_id", data.brandId).order("created_at", { ascending: false });
    return rows ?? [];
  });

export const createGeoTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; title: string; description?: string; priority?: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("geo_tasks").insert({
      brand_id: data.brandId,
      title: data.title,
      description: data.description ?? null,
      priority: data.priority ?? "medium",
      status: "todo",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setGeoTaskStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("geo_tasks").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteGeoTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("geo_tasks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { fullName: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles").update({ full_name: data.fullName }).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateBrand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; name: string; domain: string }) => input)
  .handler(async ({ data, context }) => {
    const { normalizeDomain } = await import("./ai.server");
    const domain = normalizeDomain(data.domain);
    if (!domain) throw new Error("Geçerli bir alan adı girin");
    const { error } = await context.supabase
      .from("brands").update({ name: data.name.trim() || domain, domain }).eq("id", data.brandId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBrand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("brands").delete().eq("id", data.brandId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListBrands = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Bu sayfaya erişim yetkiniz yok");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: brands }, { data: members }] = await Promise.all([
      supabaseAdmin.from("brands").select("id, name, domain, onboarding_completed, created_at").order("created_at", { ascending: false }),
      supabaseAdmin.from("brand_members").select("brand_id"),
    ]);
    const counts = new Map<string, number>();
    for (const m of members ?? []) counts.set(m.brand_id, (counts.get(m.brand_id) ?? 0) + 1);
    return (brands ?? []).map((b) => ({ ...b, memberCount: counts.get(b.id) ?? 0 }));
  });

// ---------- Ölçüm motoru ----------

export const startMeasurement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { assertBrandActive } = await import("./plan.server");
    await assertBrandActive(context.supabase, context.userId, data.brandId);

    const { data: prompts } = await context.supabase
      .from("prompts").select("id").eq("brand_id", data.brandId).eq("status", "approved");
    const ids = (prompts ?? []).map((p) => p.id);
    if (!ids.length) throw new Error("Önce en az bir prompt onaylayın.");

    // Yarım kalmış bir tür varsa onu sürdür: aynı turda ölçülen promptları tekrar ölçme.
    const { data: openBatch } = await context.supabase
      .from("measurement_batches")
      .select("*")
      .eq("brand_id", data.brandId)
      .eq("status", "running")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (openBatch) {
      const fresh = Date.now() - new Date(openBatch.created_at).getTime() < 60 * 60 * 1000;
      if (fresh) {
        const { data: doneRuns } = await context.supabase
          .from("prompt_runs")
          .select("prompt_id")
          .eq("brand_id", data.brandId)
          .eq("batch_id", openBatch.id);
        const doneSet = new Set((doneRuns ?? []).map((r) => r.prompt_id));
        const remaining = ids.filter((id) => !doneSet.has(id));
        return { batch: openBatch, promptIds: remaining };
      }
      await context.supabase
        .from("measurement_batches")
        .update({ status: "failed", error: "Tür yarıda kaldı", finished_at: new Date().toISOString() })
        .eq("id", openBatch.id);
    }

    const { data: batch, error } = await context.supabase
      .from("measurement_batches")
      .insert({ brand_id: data.brandId, status: "running", total_prompts: ids.length, completed_prompts: 0 })
      .select("*").single();
    if (error) throw new Error(error.message);
    return { batch, promptIds: ids };
  });

export const runMeasurementChunk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { batchId: string; brandId: string; promptIds: string[] }) => input)
  .handler(async ({ data, context }) => {
    const { measurePrompt } = await import("./measurement.server");
    const { normalizeCompetitors, competitorMatches, competitorNames } = await import("./competitors");
    const { resolveSystemPrompt } = await import("./system-prompts.server");
    const systemPrompt = await resolveSystemPrompt(context.supabase, "measurement_answer");
    const [{ data: brand }, { data: intel }, { data: prompts }] = await Promise.all([
      context.supabase.from("brands").select("name, domain").eq("id", data.brandId).single(),
      context.supabase.from("brand_intelligence").select("competitors").eq("brand_id", data.brandId).maybeSingle(),
      context.supabase.from("prompts").select("id, text").in("id", data.promptIds),
    ]);
    if (!brand) throw new Error("Marka bulunamadı");
    const competitors = normalizeCompetitors(intel?.competitors);

    const failedPromptIds: string[] = [];
    for (const prompt of prompts ?? []) {
      let measured: Awaited<ReturnType<typeof measurePrompt>>;
      try {
        measured = await measurePrompt({
          brandName: brand.name,
          brandDomain: brand.domain,
          competitors: competitorNames(competitors),
          promptText: prompt.text,
          systemPrompt,
        });
      } catch (error) {
        console.error(`Measurement failed for prompt ${prompt.id}`, error);
        failedPromptIds.push(prompt.id);
        continue;
      }
      const { count: previousRuns } = await context.supabase
        .from("prompt_runs")
        .select("id", { count: "exact", head: true })
        .eq("prompt_id", prompt.id);
      const runIndex = (previousRuns ?? 0) + 1;
      const visibility = !measured.brandMentioned
        ? 0
        : measured.position
          ? Math.max(40, 100 - (measured.position - 1) * 10)
          : 60;
      const { data: run } = await context.supabase.from("prompt_runs").insert({
        brand_id: data.brandId,
        prompt_id: prompt.id,
        batch_id: data.batchId,
        engine: "perplexity",
        brand_mentioned: measured.brandMentioned,
        position: measured.position,
        raw_answer: measured.answer,
        answer_summary: measured.answer.slice(0, 280),
        mentioned_brands: measured.mentionedBrands.map((b) => typeof b === "string" ? b : b.name),
        cited_reasons: measured.mentionedBrands,
        run_index: runIndex,
        visibility,
      }).select("id").single();

      // Yanıtta geçen, bilinmeyen markaları rakip adayı olarak biriktir.
      const ownNeedle = brand.name.toLowerCase();
      for (const brandObj of measured.mentionedBrands) {
        const name = (typeof brandObj === "string" ? brandObj : brandObj.name).trim();
        const lower = name.toLowerCase();
        if (!name || lower.includes(ownNeedle) || ownNeedle.includes(lower)) continue;
        if (competitors.some((competitor) => competitorMatches(competitor, { answer: name, domains: [] }))) continue;
        const { data: existing } = await context.supabase
          .from("competitor_candidates")
          .select("id, prompt_count, status")
          .eq("brand_id", data.brandId)
          .eq("name", name)
          .maybeSingle();
        if (existing) {
          await context.supabase
            .from("competitor_candidates")
            .update({ prompt_count: (existing.prompt_count ?? 1) + 1, updated_at: new Date().toISOString() })
            .eq("id", existing.id);
        } else {
          await context.supabase.from("competitor_candidates").insert({
            brand_id: data.brandId,
            name,
            first_seen_run_id: run?.id ?? null,
            first_seen_prompt_id: prompt.id,
            prompt_count: 1,
            status: "new",
          });
        }
      }

      const seen = new Set<string>();
      const unique = measured.sources.filter((s) => (seen.has(s.url) ? false : seen.add(s.url)));
      if (unique.length) {
        await context.supabase.from("citations").insert(
          unique.map((source) => {
            const isOwn = source.domain.includes(brand.domain) || brand.domain.includes(source.domain);
            const isCompetitor =
              !isOwn &&
              competitors.some((competitor) =>
                competitorMatches(competitor, { answer: source.title, domains: [source.domain] }),
              );
            return {
              brand_id: data.brandId,
              run_id: run?.id ?? null,
              prompt_id: prompt.id,
              domain: source.domain,
              url: source.url,
              title: source.title || source.domain,
              is_own_domain: isOwn,
              citation_type: isOwn ? "own" : isCompetitor ? "competitor" : "neutral",
            };
          }),
        );
      }
    }

    const { data: current } = await context.supabase
      .from("measurement_batches").select("completed_prompts, total_prompts").eq("id", data.batchId).single();
    const completed = (current?.completed_prompts ?? 0) + (prompts?.length ?? 0);
    await context.supabase.from("measurement_batches")
      .update({ completed_prompts: completed }).eq("id", data.batchId);
    return { completed, total: current?.total_prompts ?? 0, failedPromptIds };
  });

export const finishMeasurement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { batchId: string; brandId: string; failedCount?: number }) => input)
  .handler(async ({ data, context }) => {
    const { computeVisibilityScore } = await import("./score-model");
    const [runs, citations, sources, claims] = await Promise.all([
      // Bu turun skoru sadece bu batch'in çalışmalarından hesaplanır; kaynak/kanıt bileşenleri markanın genel (kümülatif) durumunu yansıtmaya devam eder.
      context.supabase.from("prompt_runs").select("brand_mentioned, position")
        .eq("brand_id", data.brandId).eq("batch_id", data.batchId),
      context.supabase.from("citations").select("is_own_domain").eq("brand_id", data.brandId),
      context.supabase.from("knowledge_sources").select("id", { count: "exact", head: true }).eq("brand_id", data.brandId),
      context.supabase.from("claims").select("evidence_url").eq("brand_id", data.brandId),
    ]);
    const citationRows = citations.data ?? [];
    const score = computeVisibilityScore({
      runs: runs.data ?? [],
      ownCitations: citationRows.filter((c) => c.is_own_domain).length,
      totalCitations: citationRows.length,
      knowledgeSources: sources.count ?? 0,
      claimsWithEvidence: (claims.data ?? []).filter((c) => Boolean(c.evidence_url)).length,
    });
    const { error } = await context.supabase.from("measurement_batches").update({
      status: "completed",
      score: score.total,
      components: score.components,
      finished_at: new Date().toISOString(),
      ...(data.failedCount ? { error: `${data.failedCount} soru ölçülemedi` } : {}),
    }).eq("id", data.batchId);
    if (error) throw new Error(error.message);

    // Ölçüm sonrası otomatik 3 öncelikli aksiyon.
    const { createPriorityTasks } = await import("./tasks.server");
    const created = await createPriorityTasks(context.supabase, data.brandId, citationRows);
    return { ...score, tasksCreated: created };
  });

export const getMeasurementState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { computeVisibilityScore } = await import("./score-model");
    const [{ data: batch }, runs, citations, sources, claims, approved] = await Promise.all([
      context.supabase.from("measurement_batches").select("*").eq("brand_id", data.brandId)
        .order("created_at", { ascending: false }).limit(1).maybeSingle(),
      context.supabase.from("prompt_runs").select("brand_mentioned, position").eq("brand_id", data.brandId),
      context.supabase.from("citations").select("is_own_domain, domain").eq("brand_id", data.brandId),
      context.supabase.from("knowledge_sources").select("id", { count: "exact", head: true }).eq("brand_id", data.brandId),
      context.supabase.from("claims").select("evidence_url").eq("brand_id", data.brandId),
      context.supabase.from("prompts").select("id", { count: "exact", head: true }).eq("brand_id", data.brandId).eq("status", "approved"),
    ]);
    const citationRows = citations.data ?? [];
    const score = computeVisibilityScore({
      runs: runs.data ?? [],
      ownCitations: citationRows.filter((c) => c.is_own_domain).length,
      totalCitations: citationRows.length,
      knowledgeSources: sources.count ?? 0,
      claimsWithEvidence: (claims.data ?? []).filter((c) => Boolean(c.evidence_url)).length,
    });
    return {
      batch,
      score,
      approvedPrompts: approved.count ?? 0,
      totalRuns: (runs.data ?? []).length,
    };
  });

export const getPlanUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId?: string }) => input)
  .handler(async ({ data, context }) => {
    const { getUserPlan, countApprovedPrompts } = await import("./plan.server");
    const limits = await getUserPlan(context.supabase, context.userId);
    const [{ count: brandCount }, approvedPrompts] = await Promise.all([
      context.supabase.from("brands").select("id", { count: "exact", head: true }).eq("created_by", context.userId),
      data.brandId ? countApprovedPrompts(context.supabase, data.brandId) : Promise.resolve(0),
    ]);
    return {
      plan: limits.slug,
      planLabel: limits.label,
      maxBrands: limits.maxBrands,
      maxPrompts: limits.maxPrompts,
      maxCompetitors: limits.maxCompetitors,
      monthlyContent: limits.monthlyContent,
      brands: brandCount ?? 0,
      approvedPrompts,
    };
  });

// Prompt detayında: o soruya ait son ölçüm yanıtı, kaynakları ve önerilen aksiyonlar.
export const getPromptInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; promptId: string; runId?: string }) => input)
  .handler(async ({ data, context }) => {
    const [{ data: prompt }, { data: runRows }, { data: brand }, { data: intel }] = await Promise.all([
      context.supabase.from("prompts").select("id, text, category").eq("id", data.promptId).single(),
      context.supabase
        .from("prompt_runs")
        .select("id, brand_mentioned, position, raw_answer, answer_summary, engine, created_at, mentioned_brands, run_index, visibility")
        .eq("prompt_id", data.promptId)
        .order("created_at", { ascending: false })
        .limit(20),
      context.supabase.from("brands").select("name, domain").eq("id", data.brandId).single(),
      context.supabase.from("brand_intelligence").select("competitors").eq("brand_id", data.brandId).maybeSingle(),
    ]);

    const allRuns = runRows ?? [];
    const run = (data.runId ? allRuns.find((row) => row.id === data.runId) : allRuns[0]) ?? allRuns[0] ?? null;

    const { data: citations } = run
      ? await context.supabase
          .from("citations")
          .select("url, domain, title, citation_type, is_own_domain")
          .eq("run_id", run.id)
      : { data: [] as Array<{ url: string; domain: string; title: string | null; citation_type: string; is_own_domain: boolean }> };

    const sources = (citations ?? []).map((c) => ({
      url: c.url,
      domain: c.domain,
      title: c.title ?? c.domain,
      type: c.citation_type ?? (c.is_own_domain ? "own" : "neutral"),
    }));
    const ownCited = sources.some((s) => s.type === "own");

    // Yanıtta geçen markaları kendi markamız / takip edilen rakip / yeni olarak sınıflandır.
    const { normalizeCompetitors, competitorMatches } = await import("./competitors");
    const trackedCompetitors = normalizeCompetitors(intel?.competitors);
    const ownNeedle = (brand?.name ?? "").toLowerCase();
    const mentionedBrands = (Array.isArray(run?.mentioned_brands) ? (run?.mentioned_brands as unknown[]) : [])
      .map((value) => String(value).trim())
      .filter(Boolean)
      .map((name, index) => {
        const lower = name.toLowerCase();
        const isOwn = Boolean(ownNeedle) && (lower.includes(ownNeedle) || ownNeedle.includes(lower));
        const isTracked =
          !isOwn && trackedCompetitors.some((competitor) => competitorMatches(competitor, { answer: name, domains: [] }));
        return {
          name,
          rank: index + 1,
          type: isOwn ? ("own" as const) : isTracked ? ("competitor" as const) : ("new" as const),
        };
      });

    const { data: candidateRows } = await context.supabase
      .from("competitor_candidates")
      .select("id, name, domain, prompt_count, status")
      .eq("brand_id", data.brandId)
      .eq("status", "new")
      .order("prompt_count", { ascending: false })
      .limit(12);
    const mentionedNames = new Set(mentionedBrands.map((item) => item.name.toLowerCase()));
    const candidates = (candidateRows ?? []).filter((row) => mentionedNames.has(String(row.name).toLowerCase()));

    // Deterministik aksiyon önerileri — kullanıcı ne yapacağını net görsün.
    const actions: Array<{ key: string; title: string; description: string; priority: string }> = [];
    if (!run) {
      actions.push({
        key: "measure",
        title: `"${(prompt?.text ?? "").slice(0, 80)}" sorusunu ölçün`,
        description: "Bu soru henüz hiç ölçülmedi. Ölçüm & Skor ekranından bir tur başlatın.",
        priority: "medium",
      });
    } else if (!run.brand_mentioned) {
      actions.push({
        key: "evidence-content",
        title: `"${(prompt?.text ?? "").slice(0, 80)}" sorusu için kanıt içeriği yayımlayın`,
        description: `Yapay zeka bu soruda ${brand?.name ?? "markanızı"} anmadı. Soruyu doğrudan yanıtlayan, veri ve kaynak içeren bir sayfa yayımlayın; İçerik Üretimi ekranından taslak alabilirsiniz.`,
        priority: "high",
      });
      if (sources.length) {
        actions.push({
          key: "cited-sources",
          title: "Seçilen kaynaklarda yer alın",
          description: `Bu yanıtta ${sources.slice(0, 3).map((s) => s.domain).join(", ")} kaynak gösterildi. Bu sayfalarda listelenmek, karşılaştırmaya girmek veya benzer kapsamda kendi sayfanızı üretmek için çalışın.`,
          priority: "medium",
        });
      }
    } else if (!ownCited) {
      actions.push({
        key: "own-citation",
        title: "Kendi sayfanızın kaynak gösterilmesini sağlayın",
        description: "Markanız yanıtta geçiyor ama kaynak olarak kendi siteniz gösterilmiyor. İlgili sayfayı güncelleyin, net tanımlar, tarih, veri ve SSS ekleyin.",
        priority: "medium",
      });
    } else if ((run.position ?? 99) > 3) {
      actions.push({
        key: "improve-position",
        title: "Yanıttaki sıranızı yükseltin",
        description: `Şu an ${run.position}. sıradasınız. Karşılaştırma tablosu, fiyat/teknik veri ve güncel tarih içeren kanıt sayfalarıyla öne çıkın.`,
        priority: "medium",
      });
    }
    if (!ownCited) {
      actions.push({
        key: "kb-source",
        title: "Bilgi Bankası'na bu konuda kaynak ekleyin",
        description: "Konuyla ilgili teknik doküman, vaka çalışması veya SSS ekleyip indeksleyin; marka zekası yanıt üretiminde bu kanıtları kullanır.",
        priority: "low",
      });
    }

    // Kaydedilmiş tamamlanma durumlarını adımlarla eşleştir.
    const { data: savedItems } = await context.supabase
      .from("prompt_action_items")
      .select("action_key, done, done_at")
      .eq("prompt_id", data.promptId);
    const doneMap = new Map(
      ((savedItems ?? []) as Array<{ action_key: string; done: boolean; done_at: string | null }>).map((row) => [
        row.action_key,
        { done: row.done, doneAt: row.done_at },
      ]),
    );

    return {
      prompt: prompt ?? null,
      run: run
        ? {
            id: run.id,
            brandMentioned: run.brand_mentioned,
            position: run.position,
            answer: run.raw_answer ?? run.answer_summary ?? "",
            engine: run.engine,
            createdAt: run.created_at,
            runIndex: run.run_index ?? null,
            visibility: run.visibility === null || run.visibility === undefined ? null : Number(run.visibility),
          }
        : null,
      runs: allRuns.map((row, index) => ({
        id: row.id,
        engine: row.engine,
        createdAt: row.created_at,
        brandMentioned: Boolean(row.brand_mentioned),
        position: row.position,
        runIndex: row.run_index ?? allRuns.length - index,
        visibility:
          row.visibility === null || row.visibility === undefined
            ? row.brand_mentioned
              ? row.position
                ? Math.max(40, 100 - (row.position - 1) * 10)
                : 60
              : 0
            : Number(row.visibility),
      })),
      mentionedBrands,
      candidates: candidates.map((row) => ({
        id: row.id,
        name: row.name,
        domain: row.domain ?? "",
        promptCount: row.prompt_count ?? 1,
      })),
      sources,
      actions: actions.map((action) => ({
        ...action,
        done: doneMap.get(action.key)?.done ?? false,
        doneAt: doneMap.get(action.key)?.doneAt ?? null,
      })),
    };
  });

// Aksiyon adımını tamamlandı / tamamlanmadı olarak işaretler.
export const setPromptActionDone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      brandId: string;
      promptId: string;
      key: string;
      title: string;
      description?: string;
      priority?: string;
      done: boolean;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("prompt_action_items").upsert(
      {
        brand_id: data.brandId,
        prompt_id: data.promptId,
        action_key: data.key,
        title: data.title,
        description: data.description ?? null,
        priority: data.priority ?? "medium",
        done: data.done,
        done_at: data.done ? new Date().toISOString() : null,
      },
      { onConflict: "prompt_id,action_key" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Rakip arama: alan adı + sektör bilgisinden gerçek rakip adayları bulur (Perplexity).
export const searchCompetitors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; query?: string }) => input)
  .handler(async ({ data, context }) => {
    const { perplexityJson } = await import("./perplexity.server");
    const { normalizeCompetitors, cleanDomain } = await import("./competitors");
    const [{ data: brand }, { data: intel }] = await Promise.all([
      context.supabase.from("brands").select("name, domain").eq("id", data.brandId).single(),
      context.supabase.from("brand_intelligence").select("summary, competitors").eq("brand_id", data.brandId).maybeSingle(),
    ]);
    if (!brand) throw new Error("Marka bulunamadı");

    const fallback = { competitors: [] as Array<{ name: string; domain: string; reason: string }> };
    const { result } = await perplexityJson<typeof fallback>(
      [
        {
          role: "system",
          content:
            "Sen bir pazar araştırmacısısın. Verilen markayla aynı işi yapan gerçek rakip firmaları bul. Uydurma. Yalnızca var olduğunu doğrulayabildiğin firmaları döndür, en fazla 8 tane. domain alanına sadece alan adını yaz (ör. örnek.com).",
        },
        {
          role: "user",
          content: `Marka: ${brand.name} (${brand.domain})
Özet: ${intel?.summary ?? ""}
Mevcut rakip listesi (tekrar etme): ${JSON.stringify(intel?.competitors ?? [])}
Arama: ${data.query?.trim() || "aynı sektördeki başlıca rakipler"}`,
        },
      ],
      {
        name: "competitors",
        schema: {
          type: "object",
          properties: {
            competitors: {
              type: "array",
              items: {
                type: "object",
                properties: { name: { type: "string" }, domain: { type: "string" }, reason: { type: "string" } },
                required: ["name", "domain", "reason"],
                additionalProperties: false,
              },
            },
          },
          required: ["competitors"],
          additionalProperties: false,
        },
      },
      fallback,
    );

    const saved = normalizeCompetitors(intel?.competitors);
    const existingNames = new Set(saved.map((c) => c.name.toLowerCase()));
    const existingDomains = new Set(saved.map((c) => c.domain).filter(Boolean));
    return result.competitors
      .map((c) => ({ ...c, domain: cleanDomain(c.domain) }))
      .filter((c) => c.name && !existingNames.has(c.name.toLowerCase()) && !existingDomains.has(c.domain))
      .slice(0, 8);
  });

// Marka zekasındaki rakip listesini okur / günceller.
export const getCompetitors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { getUserPlan } = await import("./plan.server");
    const { isUnlimited } = await import("./plan-limits");
    const { normalizeCompetitors } = await import("./competitors");
    const [{ data: intel }, limits] = await Promise.all([
      context.supabase.from("brand_intelligence").select("competitors").eq("brand_id", data.brandId).maybeSingle(),
      getUserPlan(context.supabase, context.userId),
    ]);
    const competitors = normalizeCompetitors(intel?.competitors);
    const unlimited = isUnlimited(limits.maxCompetitors);
    return {
      competitors,
      plan: limits.slug,
      planLabel: limits.label,
      maxCompetitors: limits.maxCompetitors,
      unlimited,
      remaining: unlimited ? Number.MAX_SAFE_INTEGER : Math.max(0, limits.maxCompetitors - competitors.length),
    };
  });

export const saveCompetitors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; competitors: Array<{ name: string; domain?: string; type?: string }> }) => input)
  .handler(async ({ data, context }) => {
    const { normalizeCompetitors } = await import("./competitors");
    const { data: current } = await context.supabase
      .from("brand_intelligence").select("competitors").eq("brand_id", data.brandId).maybeSingle();
    const previous = normalizeCompetitors(current?.competitors).length;
    const next = normalizeCompetitors(data.competitors);
    // Liste küçülüyorsa (rakip kaldırma) kota kontrolü yapılmaz.
    if (next.length > previous) {
      const { assertCompetitorQuota } = await import("./plan.server");
      try {
        await assertCompetitorQuota(context.supabase, context.userId, next.length);
      } catch (error) {
        // Kota aşımı bir hata değil, kullanıcıya gösterilecek bir durumdur.
        return { ok: false as const, message: error instanceof Error ? error.message : "Plan limiti aşıldı." };
      }
    }
    const { error } = await context.supabase
      .from("brand_intelligence")
      .upsert({ brand_id: data.brandId, competitors: next }, { onConflict: "brand_id" });
    if (error) throw new Error(error.message);
    return { ok: true as const, message: "" };
  });

// Prompt sonuçlarından çıkan rakip adayını takip listesine ekler.
export const promoteCompetitorCandidate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; candidateId: string; domain?: string }) => input)
  .handler(async ({ data, context }) => {
    const { normalizeCompetitors } = await import("./competitors");
    const [{ data: candidate }, { data: current }] = await Promise.all([
      context.supabase
        .from("competitor_candidates")
        .select("id, name, domain")
        .eq("id", data.candidateId)
        .eq("brand_id", data.brandId)
        .single(),
      context.supabase.from("brand_intelligence").select("competitors").eq("brand_id", data.brandId).maybeSingle(),
    ]);
    if (!candidate) return { ok: false as const, message: "Aday bulunamadı." };

    const existing = normalizeCompetitors(current?.competitors);
    const next = normalizeCompetitors([
      ...existing,
      { name: candidate.name, domain: data.domain ?? candidate.domain ?? "", type: "direct" },
    ]);
    if (next.length > existing.length) {
      const { assertCompetitorQuota } = await import("./plan.server");
      try {
        await assertCompetitorQuota(context.supabase, context.userId, next.length);
      } catch (error) {
        return { ok: false as const, message: error instanceof Error ? error.message : "Plan limiti aşıldı." };
      }
    }
    const { error } = await context.supabase
      .from("brand_intelligence")
      .upsert({ brand_id: data.brandId, competitors: next }, { onConflict: "brand_id" });
    if (error) throw new Error(error.message);
    await context.supabase
      .from("competitor_candidates")
      .update({ status: "tracked", updated_at: new Date().toISOString() })
      .eq("id", candidate.id);
    return { ok: true as const, message: `${candidate.name} rakip listesine eklendi.` };
  });

// Rakip adayını yoksayar; bir daha listelenmez.
export const dismissCompetitorCandidate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; candidateId: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("competitor_candidates")
      .update({ status: "dismissed", updated_at: new Date().toISOString() })
      .eq("id", data.candidateId)
      .eq("brand_id", data.brandId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// Ölçüm sonuçlarından öncelikli görev üretir (Görevler ekranındaki buton).
export const suggestGeoTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { createPriorityTasks } = await import("./tasks.server");
    const { data: citations } = await context.supabase
      .from("citations").select("is_own_domain").eq("brand_id", data.brandId).limit(500);
    const created = await createPriorityTasks(context.supabase, data.brandId, citations ?? []);
    return { created };
  });

// Ölçüm sonuclarindaki kaynaklardan potansiyel rakip adaylari cikarir.
export const getCompetitorInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const [{ data: citations }, { data: intel }, { data: brand }] = await Promise.all([
      context.supabase
        .from("citations")
        .select("domain, is_own_domain, created_at")
        .eq("brand_id", data.brandId)
        .order("created_at", { ascending: false })
        .limit(1000),
      context.supabase.from("brand_intelligence").select("competitors").eq("brand_id", data.brandId).maybeSingle(),
      context.supabase.from("brands").select("domain").eq("id", data.brandId).single(),
    ]);

    const { normalizeCompetitors, domainIsTracked } = await import("./competitors");
    const tracked = normalizeCompetitors(intel?.competitors);
    const ownDomain = (brand?.domain ?? "").replace(/^https?:\/\//, "").replace(/^www\./, "").toLowerCase();
    const counts = new Map<string, number>();
    for (const row of citations ?? []) {
      if (row.is_own_domain) continue;
      const domain = String(row.domain ?? "").replace(/^www\./, "").toLowerCase();
      if (!domain || domain === ownDomain) continue;
      counts.set(domain, (counts.get(domain) ?? 0) + 1);
    }

    const suggestions = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([domain, mentions]) => ({
        domain,
        mentions,
        tracked: domainIsTracked(tracked, domain),
      }));

    return { suggestions, totalCitations: (citations ?? []).length };
  });

export const getCompetitorVisibilityTrend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; days?: number }) => input)
  .handler(async ({ data, context }) => {
    const { buildCompetitorTrend } = await import("./competitor-trend.server");
    const { normalizeCompetitors } = await import("./competitors");
    const days = data.days ?? 30;
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const [{ data: runs }, { data: intel }, { data: brand }] = await Promise.all([
      context.supabase
        .from("prompt_runs")
        .select("created_at, brand_mentioned, raw_answer")
        .eq("brand_id", data.brandId)
        .gte("created_at", since)
        .order("created_at", { ascending: true })
        .limit(2000),
      context.supabase.from("brand_intelligence").select("competitors").eq("brand_id", data.brandId).maybeSingle(),
      context.supabase.from("brands").select("name").eq("id", data.brandId).single(),
    ]);

    return buildCompetitorTrend(
      (runs ?? []).map((r) => ({ created_at: r.created_at, brand_mentioned: Boolean(r.brand_mentioned), raw_answer: r.raw_answer })),
      brand?.name ?? "Markanız",
      normalizeCompetitors(intel?.competitors),
      days,
    );
  });

// ============ Evidence Bridge ============

export const startEvidenceBridge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; promptId: string; competitorDomain: string }) => input)
  .handler(async ({ data, context }) => {
    const { assertBrandActive } = await import("./plan.server");
    await assertBrandActive(context.supabase, context.userId, data.brandId);

    const { data: batch, error } = await context.supabase
      .from("measurement_batches")
      .insert({
        brand_id: data.brandId,
        status: "running",
        engine: "evidence_bridge",
        total_prompts: 1,
        completed_prompts: 0,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    const { data: run } = await context.supabase
      .from("evidence_bridge_runs")
      .insert({
        brand_id: data.brandId,
        prompt_id: data.promptId,
        competitor_domain: data.competitorDomain,
        batch_id: batch.id,
        status: "pending",
      })
      .select("id")
      .single();

    return { batch, runId: run?.id };
  });

export const runEvidenceBridgeChunk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { batchId: string; brandId: string; runId: string; competitorDomain: string }) => input)
  .handler(async ({ data, context }) => {
    const { measurePrompt } = await import("./measurement.server");
    const { fetchSitemapUrls } = await import("./ai.server");
    const { extractEvidence } = await import("./extract.server");
    const { synthesizeEvidenceGap } = await import("./evidence-synthesis.server");
    const { recordApiUsage } = await import("./observability.server");

    const [{ data: brand }, { data: prompt }, { data: run }] = await Promise.all([
      context.supabase.from("brands").select("name, domain").eq("id", data.brandId).single(),
      context.supabase.from("evidence_bridge_runs").select("prompt_id").eq("id", data.runId).single(),
      context.supabase.from("evidence_bridge_runs").select("*").eq("id", data.runId).single(),
    ]);

    if (!brand || !run) throw new Error("Brand or run not found");

    const promptData = await context.supabase.from("prompts").select("text").eq("id", run.prompt_id).single();
    const promptText = (promptData.data as any)?.text || "";

    const startedAt = Date.now();
    try {
      // Aşama 1: AI yanıtı
      const measured = await measurePrompt({
        brandName: brand.name,
        brandDomain: brand.domain,
        competitors: [],
        promptText,
      });

      // Aşama 2: Firecrawl kanıt çıkarımı (her iki site için)
      const brandUrls = (await fetchSitemapUrls(brand.domain, 5)).slice(0, 5);
      const competitorUrls = (await fetchSitemapUrls(data.competitorDomain, 5)).slice(0, 5);

      const evidenceSchema = {
        name: "citation_evidence",
        schema: {
          type: "object",
          properties: {
            citation_evidence: {
              type: "object",
              properties: {
                evidence_types_present: { type: "array", items: { type: "string" } },
                direct_answer_format: { type: "boolean" },
                trust_signals: { type: "array", items: { type: "string" } },
              },
              required: ["evidence_types_present", "direct_answer_format"],
            },
            evidence_gap: {
              type: "object",
              properties: {
                missing_evidence: { type: "array", items: { type: "string" } },
                structured_data_gap: { type: "string" },
              },
              required: ["missing_evidence"],
            },
          },
          required: ["citation_evidence", "evidence_gap"],
        },
      };

      const [brandEvidenceResults, competitorEvidenceResults] = await Promise.all([
        extractEvidence(brandUrls, evidenceSchema),
        extractEvidence(competitorUrls, evidenceSchema),
      ]);

      // Aşama 3: Sentez
      const priorities = await synthesizeEvidenceGap({
        brandName: brand.name,
        brandDomain: brand.domain,
        competitorDomain: data.competitorDomain,
        promptText,
        aiAnswer: measured.answer,
        citedReasons: measured.mentionedBrands,
        brandEvidence: brandEvidenceResults[0],
        competitorEvidence: competitorEvidenceResults[0],
      });

      // Sonuçları kaydet
      const { error } = await context.supabase.from("evidence_bridge_runs").update({
        status: "completed",
        ai_response_raw: measured.answer,
        ai_response_parsed: {
          mentioned_brands: measured.mentionedBrands,
          sources: measured.sources,
          position: measured.position,
        },
        firecrawl_brand: brandEvidenceResults[0],
        firecrawl_competitor: competitorEvidenceResults[0],
        content_priorities: priorities,
        finished_at: new Date().toISOString(),
      }).eq("id", data.runId);

      if (error) throw new Error(error.message);

      recordApiUsage({
        provider: "evidence_bridge",
        operation: "synthesis",
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      await context.supabase
        .from("evidence_bridge_runs")
        .update({
          status: "failed",
          error: String(error),
          finished_at: new Date().toISOString(),
        })
        .eq("id", data.runId);
      throw error;
    }
  });

export const finishEvidenceBridge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { batchId: string; brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: runs } = await context.supabase
      .from("evidence_bridge_runs")
      .select("*")
      .eq("batch_id", data.batchId);

    const completed = (runs ?? []).filter((r: any) => r.status === "completed").length;
    const failed = (runs ?? []).filter((r: any) => r.status === "failed").length;

    const status = failed > 0 ? "failed" : completed > 0 ? "completed" : "pending";

    const { error } = await context.supabase
      .from("measurement_batches")
      .update({
        status,
        completed_prompts: completed,
        finished_at: new Date().toISOString(),
      })
      .eq("id", data.batchId);

    if (error) throw new Error(error.message);
    return { status, completed, failed };
  });
