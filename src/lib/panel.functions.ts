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
    const { data: brand } = await context.supabase
      .from("brands").select("id, name, domain").eq("id", data.brandId).single();
    if (!brand) throw new Error("Marka bulunamadı");

    const siteText = await fetchSiteText(brand.domain);
    const result = await aiJson<{
      summary: string; positioning: string; tone: string;
      products: string[]; audiences: string[]; competitors: string[]; keywords: string[];
    }>(
      [
        { role: "system", content: "Sen bir marka analistisin. Yanıtı SADECE Türkçe ve şu JSON şemasıyla ver: {summary, positioning, tone, products[], audiences[], competitors[], keywords[]}. Diziler 3-6 kısa madde içersin." },
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
    const { data: brand } = await context.supabase.from("brands").select("domain, name").eq("id", data.brandId).single();
    if (!brand) throw new Error("Marka bulunamadı");
    const urls = await fetchSitemapUrls(brand.domain);
    if (urls.length) {
      const picked = await aiJson<{ items: Array<{ title: string; url: string }> }>(
        [
          { role: "system", content: "Verilen URL listesinden markanın AI görünürlüğü için en değerli 8 sayfayı seç (ürün, hizmet, fiyat, hakkımızda, SSS, referans). Yanıt JSON: {items:[{title,url}]} — başlıklar Türkçe ve kısa." },
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

    const result = await aiJson<{ items: Array<{ text: string; category: string; intent: string }> }>(
      [
        { role: "system", content: "Bir kullanıcının ChatGPT/Gemini gibi asistanlara soracağı, markanın görünür olması gereken 24 gerçekçi Türkçe soru üret. Marka adını her soruda kullanma; çoğu jenerik satın alma/araştırma sorusu olsun. JSON: {items:[{text,category,intent}]} — category: 'marka'|'kategori'|'rakip'|'problem', intent: 'bilgi'|'karşılaştırma'|'satın alma'." },
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

    const result = await aiJson<{ items: DiscoveredPrompt[] }>(
      [
        {
          role: "system",
          content:
            "Sen bir GEO (generative engine optimization) analistisin. Marka adı GEÇMEYEN, gerçek kullanıcıların ChatGPT/Perplexity gibi asistanlara soracağı 12 Türkçe fırsat sorusu üret. Yanıt json: {items:[{text, cluster, intent, rationale, opportunityScore}]}. cluster kısa tema adı; intent 'bilgi'|'karşılaştırma'|'satın alma'; rationale tek cümle, neden bu markanın kaynak gösterilebileceğini kanıta bağla; opportunityScore 0-100 arası tam sayı.",
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
      .select("domain, url, is_own_domain, created_at")
      .eq("brand_id", data.brandId)
      .order("created_at", { ascending: false })
      .limit(500);
    const map = new Map<string, { domain: string; count: number; isOwn: boolean; lastSeen: string; sampleUrl: string }>();
    for (const row of rows ?? []) {
      const current = map.get(row.domain);
      if (current) {
        current.count += 1;
      } else {
        map.set(row.domain, {
          domain: row.domain,
          count: 1,
          isOwn: row.is_own_domain,
          lastSeen: row.created_at,
          sampleUrl: row.url,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  });

export const setPromptStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ids: string[]; status: string }) => input)
  .handler(async ({ data, context }) => {
    if (!data.ids.length) return { ok: true };
    const { error } = await context.supabase.from("prompts").update({ status: data.status }).in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; text: string }) => input)
  .handler(async ({ data, context }) => {
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
    const [{ data: brand }, { data: intel }, { data: prompts }] = await Promise.all([
      context.supabase.from("brands").select("name, domain").eq("id", data.brandId).single(),
      context.supabase.from("brand_intelligence").select("competitors").eq("brand_id", data.brandId).maybeSingle(),
      context.supabase.from("prompts").select("id, text").in("id", data.promptIds),
    ]);
    if (!brand) throw new Error("Marka bulunamadı");

    for (const prompt of prompts ?? []) {
      const measured = await measurePrompt({
        brandName: brand.name,
        brandDomain: brand.domain,
        competitors: (intel?.competitors as string[] | null) ?? [],
        promptText: prompt.text,
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

      const unique = Array.from(new Set(measured.sources)).slice(0, 8);
      if (unique.length) {
        await context.supabase.from("citations").insert(
          unique.map((domain) => ({
            brand_id: data.brandId,
            run_id: run?.id ?? null,
            domain,
            url: `https://${domain}`,
            is_own_domain: domain.includes(brand.domain),
          })),
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
    return score;
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
