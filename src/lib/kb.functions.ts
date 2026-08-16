import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Bir bilgi kaynağını çeker, parçalar, embedding'ler ve kaydeder.
export const indexKnowledgeSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; sourceId: string; force?: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { indexSource } = await import("./kb.server");
    return indexSource(context.supabase, data.sourceId, data.force ?? false);
  });

// Marka için indekslenmemiş tüm kaynakları sırayla işler.
export const indexPendingSources = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; limit?: number }) => input)
  .handler(async ({ data, context }) => {
    const { indexSource } = await import("./kb.server");
    const { data: sources } = await context.supabase
      .from("knowledge_sources")
      .select("id")
      .eq("brand_id", data.brandId)
      .neq("index_status", "hazir")
      .limit(data.limit ?? 5);

    let indexed = 0;
    let failed = 0;
    let chunks = 0;
    for (const source of sources ?? []) {
      try {
        const result = await indexSource(context.supabase, source.id);
        if (result.ok) { indexed += 1; chunks += result.chunks; } else { failed += 1; }
      } catch (error) {
        console.error("İndeksleme hatası", error);
        failed += 1;
      }
    }
    return { indexed, failed, chunks, remaining: Math.max(0, (sources ?? []).length - indexed - failed) };
  });

// İçeriği değişmiş olabilecek kaynakları yeniden indeksler (hash aynıysa atlanır).
export const refreshStaleSources = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; maxAgeDays?: number; limit?: number }) => input)
  .handler(async ({ data, context }) => {
    const { indexSource } = await import("./kb.server");
    const cutoff = new Date(Date.now() - (data.maxAgeDays ?? 7) * 86400000).toISOString();
    const { data: sources } = await context.supabase
      .from("knowledge_sources")
      .select("id, indexed_at")
      .eq("brand_id", data.brandId)
      .not("url", "is", null)
      .or(`indexed_at.is.null,indexed_at.lt.${cutoff}`)
      .limit(data.limit ?? 8);

    let updated = 0;
    let unchanged = 0;
    let failed = 0;
    for (const source of sources ?? []) {
      try {
        const result = await indexSource(context.supabase, source.id);
        if (!result.ok) failed += 1;
        else if (result.chunks > 0) updated += 1;
        else unchanged += 1;
      } catch (error) {
        console.error("Yeniden indeksleme hatası", error);
        failed += 1;
      }
    }
    return { checked: (sources ?? []).length, updated, unchanged, failed };
  });

// Ölçümde çıkan atıf kaynaklarından bilgi bankasına aday olanlar.
export const listCitationCandidates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const [{ data: citations }, { data: sources }] = await Promise.all([
      context.supabase
        .from("citations")
        .select("url, domain, title, citation_type, created_at")
        .eq("brand_id", data.brandId)
        .order("created_at", { ascending: false })
        .limit(400),
      context.supabase.from("knowledge_sources").select("url").eq("brand_id", data.brandId),
    ]);

    const existing = new Set((sources ?? []).map((s) => (s.url ?? "").replace(/\/+$/, "")));
    const map = new Map<string, { url: string; domain: string; title: string; type: string; count: number; firstSeen: string }>();
    for (const c of citations ?? []) {
      const url = (c.url ?? "").replace(/\/+$/, "");
      if (!url || existing.has(url)) continue;
      const entry = map.get(url);
      if (entry) {
        entry.count += 1;
        if (c.created_at < entry.firstSeen) entry.firstSeen = c.created_at;
      } else {
        map.set(url, {
          url,
          domain: c.domain,
          title: c.title || c.domain,
          type: c.citation_type,
          count: 1,
          firstSeen: c.created_at,
        });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => (a.type === "own" && b.type !== "own" ? -1 : b.type === "own" && a.type !== "own" ? 1 : b.count - a.count))
      .slice(0, 20);
  });

// Aday atıf kaynağını bilgi bankasına ekler ve hemen indeksler.
export const promoteCitationToSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; url: string; title: string }) => input)
  .handler(async ({ data, context }) => {
    const { indexSource } = await import("./kb.server");
    const { data: source, error } = await context.supabase
      .from("knowledge_sources")
      .insert({
        brand_id: data.brandId,
        title: data.title.slice(0, 180),
        url: data.url,
        source_type: "url",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    try {
      await indexSource(context.supabase, source.id);
    } catch (indexError) {
      console.error("Aday kaynak indekslenemedi", indexError);
    }
    return { id: source.id };
  });

// RAG geri getirme testi: soruyu embed eder, en yakın bilgi parçalarını döner.
export const searchKnowledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; query: string }) => input)
  .handler(async ({ data, context }) => {
    const query = data.query.trim();
    if (!query) return [];
    const { embedOne } = await import("./embeddings.server");
    const vector = await embedOne(query);
    if (!vector) throw new Error("Sorgu vektöre çevrilemedi");

    const { data: matches, error } = await context.supabase.rpc("match_kb_chunks", {
      _brand_id: data.brandId,
      query_embedding: JSON.stringify(vector) as unknown as string,
      match_count: 6,
    });
    if (error) throw new Error(error.message);

    const rows = (matches ?? []) as Array<{ id: string; content: string; source_id: string | null; similarity: number }>;
    const sourceIds = Array.from(new Set(rows.map((r) => r.source_id).filter(Boolean) as string[]));
    const { data: sources } = sourceIds.length
      ? await context.supabase.from("knowledge_sources").select("id, title, url").in("id", sourceIds)
      : { data: [] as Array<{ id: string; title: string; url: string | null }> };
    const byId = new Map((sources ?? []).map((s) => [s.id, s]));

    return rows.map((row) => ({
      id: row.id,
      content: row.content.slice(0, 400),
      similarity: Math.round(row.similarity * 100),
      sourceTitle: row.source_id ? (byId.get(row.source_id)?.title ?? "Kaynak") : "Manuel not",
      sourceUrl: row.source_id ? (byId.get(row.source_id)?.url ?? null) : null,
    }));
  });

// Kaydedilmiş vektörleri 3B koordinata indirger.
export const rebuildVectorMap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { projectTo3D } = await import("./embeddings.server");
    const { data: rows } = await context.supabase
      .from("kb_chunks")
      .select("id, embedding")
      .eq("brand_id", data.brandId)
      .not("embedding", "is", null)
      .limit(1200);
    const chunks = rows ?? [];
    if (chunks.length < 3) return { ok: true, points: chunks.length };

    const vectors = chunks.map((row) => {
      const raw = row.embedding as unknown;
      return typeof raw === "string" ? (JSON.parse(raw) as number[]) : (raw as number[]);
    });
    const coords = projectTo3D(vectors);
    for (let i = 0; i < chunks.length; i += 1) {
      const point = coords[i];
      if (!point) continue;
      await context.supabase.from("kb_chunks").update({ x: point.x, y: point.y, z: point.z }).eq("id", chunks[i]!.id);
    }
    return { ok: true, points: chunks.length };
  });

// Marka zekâsından varlık düğümlerini ve ilişkilerini üretir.
export const rebuildGraphEntities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: brand }, { data: intel }] = await Promise.all([
      supabase.from("brands").select("id, name, domain").eq("id", data.brandId).single(),
      supabase.from("brand_intelligence").select("products, audiences, competitors, keywords").eq("brand_id", data.brandId).maybeSingle(),
    ]);
    if (!brand) throw new Error("Marka bulunamadı");

    const asList = (value: unknown): string[] =>
      Array.isArray(value) ? value.map((v) => String(v)).filter(Boolean).slice(0, 8) : [];

    const entities: Array<{ key: string; label: string; entity_type: string; weight: number }> = [
      { key: "brand", label: brand.name, entity_type: "marka", weight: 3 },
    ];
    const edges: Array<{ source_key: string; target_key: string; relation: string }> = [];

    const push = (items: string[], type: string, relation: string, weight: number) => {
      items.forEach((label, index) => {
        const key = `${type}-${index}`;
        entities.push({ key, label, entity_type: type, weight });
        edges.push({ source_key: "brand", target_key: key, relation });
      });
    };

    push(asList(intel?.products), "hizmet", "sunar", 2);
    push(asList(intel?.audiences), "kitle", "hedefler", 1.5);
    push(asList(intel?.competitors), "rakip", "rekabet", 2);
    push(asList(intel?.keywords), "konu", "ilişkili", 1);

    await supabase.from("graph_edges").delete().eq("brand_id", data.brandId);
    await supabase.from("graph_entities").delete().eq("brand_id", data.brandId);
    await supabase.from("graph_entities").insert(entities.map((e) => ({ ...e, brand_id: data.brandId })));
    await supabase.from("graph_edges").insert(edges.map((e) => ({ ...e, brand_id: data.brandId })));

    return { entities: entities.length, edges: edges.length };
  });

export const getKnowledgeGraph = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: chunks }, { data: entities }, { data: edges }, { data: sources }] = await Promise.all([
      supabase
        .from("kb_chunks")
        .select("id, source_id, content, source_type, source_weight, x, y, z, updated_at")
        .eq("brand_id", data.brandId)
        .not("x", "is", null)
        .limit(1200),
      supabase.from("graph_entities").select("key, label, entity_type, weight").eq("brand_id", data.brandId),
      supabase.from("graph_edges").select("source_key, target_key, relation").eq("brand_id", data.brandId),
      supabase.from("knowledge_sources").select("id, title, url, index_status, chunk_count").eq("brand_id", data.brandId),
    ]);

    const sourceById = new Map((sources ?? []).map((s) => [s.id, s]));
    const now = Date.now();

    return {
      points: (chunks ?? []).map((c) => ({
        id: c.id,
        x: c.x ?? 0,
        y: c.y ?? 0,
        z: c.z ?? 0,
        type: c.source_type,
        weight: Number(c.source_weight ?? 1),
        freshness: 1 / (1 + (now - new Date(c.updated_at).getTime()) / (1000 * 60 * 60 * 24 * 30)),
        excerpt: c.content.slice(0, 260),
        sourceTitle: c.source_id ? (sourceById.get(c.source_id)?.title ?? "Kaynak") : "Manuel",
        sourceUrl: c.source_id ? (sourceById.get(c.source_id)?.url ?? null) : null,
      })),
      entities: entities ?? [],
      edges: edges ?? [],
      sources: (sources ?? []).map((s) => ({
        id: s.id,
        title: s.title,
        status: s.index_status,
        chunkCount: s.chunk_count,
      })),
    };
  });

// Kanıt boşlukları: ölçümde kaybedilen promptlar + zayıf vektör kapsamı.
export const listContentGaps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { embedOne } = await import("./embeddings.server");
    const { supabase } = context;

    const [{ data: prompts }, { data: runs }, { data: drafts }] = await Promise.all([
      supabase.from("prompts").select("id, text, category").eq("brand_id", data.brandId).eq("status", "approved").limit(40),
      supabase.from("prompt_runs").select("prompt_id, brand_mentioned").eq("brand_id", data.brandId),
      supabase.from("content_drafts").select("prompt_id").eq("brand_id", data.brandId),
    ]);

    const mentionByPrompt = new Map<string, { total: number; mentioned: number }>();
    for (const run of runs ?? []) {
      const entry = mentionByPrompt.get(run.prompt_id) ?? { total: 0, mentioned: 0 };
      entry.total += 1;
      if (run.brand_mentioned) entry.mentioned += 1;
      mentionByPrompt.set(run.prompt_id, entry);
    }
    const draftedPrompts = new Set((drafts ?? []).map((d) => d.prompt_id).filter(Boolean) as string[]);

    const candidates = (prompts ?? [])
      .filter((p) => !draftedPrompts.has(p.id))
      .map((p) => {
        const stat = mentionByPrompt.get(p.id);
        const mentionRate = stat && stat.total ? stat.mentioned / stat.total : 0;
        return { ...p, measured: Boolean(stat), mentionRate };
      })
      .sort((a, b) => a.mentionRate - b.mentionRate)
      .slice(0, 10);

    const gaps = [] as Array<{
      promptId: string;
      prompt: string;
      category: string;
      mentionRate: number;
      measured: boolean;
      coverage: number;
      impact: "yuksek" | "orta" | "dusuk";
    }>;

    for (const candidate of candidates) {
      let coverage = 0;
      try {
        const vector = await embedOne(candidate.text);
        if (vector) {
          const { data: matches } = await supabase.rpc("match_kb_chunks", {
            _brand_id: data.brandId,
            query_embedding: JSON.stringify(vector) as unknown as string,
            match_count: 5,
          });
          const rows = (matches ?? []) as Array<{ similarity: number }>;
          coverage = rows.length ? Math.max(0, Math.min(1, rows.reduce((s, r) => s + r.similarity, 0) / rows.length)) : 0;
        }
      } catch (error) {
        console.error("Kapsam ölçümü başarısız", error);
      }
      const impact: "yuksek" | "orta" | "dusuk" =
        coverage < 0.35 && candidate.mentionRate < 0.34 ? "yuksek" : coverage < 0.55 ? "orta" : "dusuk";
      gaps.push({
        promptId: candidate.id,
        prompt: candidate.text,
        category: candidate.category,
        mentionRate: Math.round(candidate.mentionRate * 100),
        measured: candidate.measured,
        coverage: Math.round(coverage * 100),
        impact,
      });
    }

    return gaps.sort((a, b) => a.coverage - b.coverage);
  });

export const generateDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; promptId: string; format?: string; length?: string; tone?: string }) => input)
  .handler(async ({ data, context }) => {
    const { embedOne } = await import("./embeddings.server");
    const { aiJson } = await import("./ai.server");
    const { resolveSystemPrompt } = await import("./system-prompts.server");
    const { supabase } = context;

    const [{ data: prompt }, { data: brand }, { data: intel }] = await Promise.all([
      supabase.from("prompts").select("id, text").eq("id", data.promptId).single(),
      supabase.from("brands").select("name, domain").eq("id", data.brandId).single(),
      supabase.from("brand_intelligence").select("summary, positioning, tone, products").eq("brand_id", data.brandId).maybeSingle(),
    ]);
    if (!prompt || !brand) throw new Error("Prompt veya marka bulunamadı");

    let evidence: Array<{ content: string; source_id: string | null }> = [];
    const vector = await embedOne(prompt.text);
    if (vector) {
      const { data: matches } = await supabase.rpc("match_kb_chunks", {
        _brand_id: data.brandId,
        query_embedding: JSON.stringify(vector) as unknown as string,
        match_count: 8,
      });
      evidence = ((matches ?? []) as Array<{ content: string; source_id: string | null }>).slice(0, 8);
    }

    const sourceIds = Array.from(new Set(evidence.map((e) => e.source_id).filter(Boolean) as string[]));
    const { data: sourceRows } = sourceIds.length
      ? await supabase.from("knowledge_sources").select("id, title, url").in("id", sourceIds)
      : { data: [] as Array<{ id: string; title: string; url: string | null }> };

    const context_text = evidence.map((e, i) => `[${i + 1}] ${e.content}`).join("\n\n") || "(bilgi bankasında ilgili içerik bulunamadı)";

    const formatLabel: Record<string, string> = {
      blog: "alıntılanabilir blog yazısı",
      faq: "soru-cevap (SSS) formatı",
      comparison: "karşılaştırma tablosu ağırlıklı içerik",
      landing: "hizmet/çözüm sayfası metni",
    };
    const lengthLabel: Record<string, string> = {
      kisa: "yaklaşık 400 kelime",
      orta: "yaklaşık 800 kelime",
      uzun: "yaklaşık 1400 kelime",
    };
    const briefing = `İçerik biçimi: ${formatLabel[data.format ?? "blog"] ?? formatLabel.blog}\nUzunluk hedefi: ${lengthLabel[data.length ?? "orta"] ?? lengthLabel.orta}\nTon tercihi: ${data.tone ?? intel?.tone ?? "marka tonuna sadık"}`;

    const result = await aiJson<{ title: string; body: string }>(
      [
        {
          role: "system",
          content: await resolveSystemPrompt(supabase, "content_draft"),
        },
        {
          role: "user",
          content: `Marka: ${brand.name} (${brand.domain})\nKonumlandırma: ${intel?.positioning ?? "-"}\nTon: ${intel?.tone ?? "-"}\nÖzet: ${intel?.summary ?? "-"}\n\n${briefing}\n\nHedef soru: ${prompt.text}\n\nBilgi bankası alıntıları:\n${context_text}`,
        },
      ],
      { title: prompt.text, body: "" },
    );

    if (!result.body) throw new Error("Taslak üretilemedi, tekrar deneyin");

    const { data: draft, error } = await supabase
      .from("content_drafts")
      .insert({
        brand_id: data.brandId,
        prompt_id: prompt.id,
        title: result.title || prompt.text,
        body: result.body,
        target_prompt: prompt.text,
        status: "taslak",
        word_count: result.body.split(/\s+/).filter(Boolean).length,
        sources: (sourceRows ?? []).map((s) => ({ title: s.title, url: s.url })),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: draft.id };
  });

export const listDrafts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("content_drafts")
      .select("id, title, body, target_prompt, status, word_count, sources, updated_at")
      .eq("brand_id", data.brandId)
      .order("updated_at", { ascending: false });
    return rows ?? [];
  });

export const setDraftStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("content_drafts").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("content_drafts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
