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
      summary: string; positioning: string; tone: string;
      products: string[]; audiences: string[]; competitors: string[]; keywords: string[];
    }>(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Marka: ${brand.name}\nAlan adı: ${brand.domain}\nSite metni:\n${siteText || "(site metni alınamadı, alan adından çıkarım yap)"}` },
      ],
      { summary: "", positioning: "", tone: "", products: [], audiences: [], competitors: [], keywords: [] },
    );

    const payload = {
      brand_id: brand.id,
      summary: result.summary,
      positioning: result.positioning,
      tone: result.tone,
      products: result.products,
      audiences: result.audiences,
      competitors: result.competitors,
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
    products: string[]; audiences: string[]; competitors: string[]; keywords: string[];
  }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("brand_intelligence").upsert({
      brand_id: data.brandId,
      summary: data.summary,
      positioning: data.positioning,
      tone: data.tone,
      products: data.products,
      audiences: data.audiences,
      competitors: data.competitors,
      keywords: data.keywords,
      approved: true,
    }, { onConflict: "brand_id" });
    if (error) throw new Error(error.message);
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
    const result = await aiJson<{ items: Array<{ text: string; category: string; intent: string }> }>(
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
    return rows ?? [];
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
    await assertPromptQuota(context.supabase, context.userId, data.brandId, data.items.length);
    const { error } = await context.supabase.from("prompts").insert(
      data.items.map((item) => ({
        brand_id: data.brandId,
        text: item.text,
        category: item.cluster || "kategori",
        intent: item.intent || null,
        status: "approved",
        origin: "discovery",
      })),
    );
    if (error) throw new Error(error.message);
    return { inserted: data.items.length };
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

// Ölçüm ekranı: her sorunun yanıtı ve o yanıtta yapay zekânın kullandığı kaynaklar.
export const listRunCitations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; limit?: number }) => input)
  .handler(async ({ data, context }) => {
    const limit = Math.min(Math.max(data.limit ?? 25, 1), 60);
    const { data: runs } = await context.supabase
      .from("prompt_runs")
      .select("id, prompt_id, brand_mentioned, position, answer_summary, raw_answer, created_at, prompts(text)")
      .eq("brand_id", data.brandId)
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
    const competitors = ((intel?.competitors as string[] | null) ?? []).slice(0, 6);
    const share = [
      {
        name: brand?.name ?? "Markanız",
        mentions: runRows.filter((r) => r.brand_mentioned).length,
        isOwn: true,
      },
      ...competitors.map((competitor) => ({
        name: competitor,
        mentions: runRows.filter((r) => (r.raw_answer ?? "").toLowerCase().includes(competitor.toLowerCase())).length,
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
      const { data: rows } = await context.supabase
        .from("prompts").select("id, brand_id, status").in("id", data.ids);
      const pending = (rows ?? []).filter((r) => r.status !== "approved");
      const byBrand = new Map<string, number>();
      for (const r of pending) byBrand.set(r.brand_id, (byBrand.get(r.brand_id) ?? 0) + 1);
      for (const [brandId, adding] of byBrand) {
        await assertPromptQuota(context.supabase, context.userId, brandId, adding);
      }
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
    await assertPromptQuota(context.supabase, context.userId, data.brandId, 1);
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
    return { ok: true };
  });

export const deleteClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("claims").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
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
    const { data: prompts } = await context.supabase
      .from("prompts").select("id").eq("brand_id", data.brandId).eq("status", "approved");
    const ids = (prompts ?? []).map((p) => p.id);
    if (!ids.length) throw new Error("Önce en az bir prompt onaylayın.");

    // Yarım kalmış bir tur varsa onu sürdür: aynı turda ölçülen promptları tekrar ölçme.
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
          .gte("created_at", openBatch.created_at);
        const doneSet = new Set((doneRuns ?? []).map((r) => r.prompt_id));
        const remaining = ids.filter((id) => !doneSet.has(id));
        return { batch: openBatch, promptIds: remaining.length ? remaining : ids };
      }
      await context.supabase
        .from("measurement_batches")
        .update({ status: "failed", error: "Tur yarıda kaldı", finished_at: new Date().toISOString() })
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
    const { resolveSystemPrompt } = await import("./system-prompts.server");
    const systemPrompt = await resolveSystemPrompt(context.supabase, "measurement_answer");
    const [{ data: brand }, { data: intel }, { data: prompts }] = await Promise.all([
      context.supabase.from("brands").select("name, domain").eq("id", data.brandId).single(),
      context.supabase.from("brand_intelligence").select("competitors").eq("brand_id", data.brandId).maybeSingle(),
      context.supabase.from("prompts").select("id, text").in("id", data.promptIds),
    ]);
    if (!brand) throw new Error("Marka bulunamadı");
    const competitors = ((intel?.competitors as string[] | null) ?? []).map((c) => String(c).toLowerCase());

    for (const prompt of prompts ?? []) {
      const measured = await measurePrompt({
        brandName: brand.name,
        brandDomain: brand.domain,
        competitors: (intel?.competitors as string[] | null) ?? [],
        promptText: prompt.text,
        systemPrompt,
      });
      const { data: run } = await context.supabase.from("prompt_runs").insert({
        brand_id: data.brandId,
        prompt_id: prompt.id,
        engine: "perplexity",
        brand_mentioned: measured.brandMentioned,
        position: measured.position,
        raw_answer: measured.answer,
        answer_summary: measured.answer.slice(0, 280),
      }).select("id").single();

      const seen = new Set<string>();
      const unique = measured.sources.filter((s) => (seen.has(s.url) ? false : seen.add(s.url)));
      if (unique.length) {
        await context.supabase.from("citations").insert(
          unique.map((source) => {
            const isOwn = source.domain.includes(brand.domain) || brand.domain.includes(source.domain);
            const isCompetitor =
              !isOwn && competitors.some((c) => c.length > 2 && (source.domain.includes(c.replace(/\s+/g, "")) || source.title.toLowerCase().includes(c)));
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
    return { completed, total: current?.total_prompts ?? 0 };
  });

export const finishMeasurement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { batchId: string; brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { computeVisibilityScore } = await import("./score-model");
    const [runs, citations, sources, claims] = await Promise.all([
      context.supabase.from("prompt_runs").select("brand_mentioned, position").eq("brand_id", data.brandId),
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
