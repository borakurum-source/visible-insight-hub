import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Bir bilgi kaynağını çeker, parçalar, embedding'ler ve kaydeder.
export const indexKnowledgeSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; sourceId: string; force?: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { chunkText, embedTexts, fetchPageText, hashText, SOURCE_WEIGHTS } = await import("./embeddings.server");
    const { supabase } = context;

    const { data: source } = await supabase
      .from("knowledge_sources")
      .select("id, brand_id, title, url, content, source_type, content_hash")
      .eq("id", data.sourceId)
      .single();
    if (!source) throw new Error("Kaynak bulunamadı");

    const text = (source.content?.trim() || (source.url ? await fetchPageText(source.url) : "")).trim();
    if (!text) {
      await supabase.from("knowledge_sources").update({ index_status: "hata", indexed_at: new Date().toISOString() }).eq("id", source.id);
      return { ok: false, chunks: 0, reason: "İçerik alınamadı" };
    }

    const hash = hashText(text);
    if (!data.force && source.content_hash === hash) {
      return { ok: true, chunks: 0, reason: "İçerik değişmemiş" };
    }

    await supabase.from("knowledge_sources").update({ index_status: "isleniyor" }).eq("id", source.id);

    const pieces = chunkText(text);
    const vectors = await embedTexts(pieces);
    if (vectors.length !== pieces.length) throw new Error("Embedding sayısı parça sayısıyla eşleşmedi");

    await supabase.from("kb_chunks").delete().eq("source_id", source.id);
    const weight = SOURCE_WEIGHTS[source.source_type] ?? 1.0;
    const rows = pieces.map((content, index) => ({
      brand_id: source.brand_id,
      source_id: source.id,
      content,
      embedding: JSON.stringify(vectors[index]) as unknown as string,
      source_type: source.source_type,
      source_weight: weight,
      content_hash: hash,
      chunk_index: index,
    }));
    const { error } = await supabase.from("kb_chunks").insert(rows);
    if (error) throw new Error(error.message);

    await supabase
      .from("knowledge_sources")
      .update({ content_hash: hash, index_status: "hazir", chunk_count: rows.length, indexed_at: new Date().toISOString() })
      .eq("id", source.id);

    return { ok: true, chunks: rows.length };
  });

// Marka için işlenmemiş tüm kaynakları sırayla indeksler.
export const indexPendingSources = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; limit?: number }) => input)
  .handler(async ({ data, context }) => {
    const { data: sources } = await context.supabase
      .from("knowledge_sources")
      .select("id")
      .eq("brand_id", data.brandId)
      .neq("index_status", "hazir")
      .limit(data.limit ?? 3);
    return { pending: (sources ?? []).map((s) => s.id) };
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
  .inputValidator((input: { brandId: string; promptId: string }) => input)
  .handler(async ({ data, context }) => {
    const { embedOne } = await import("./embeddings.server");
    const { aiJson } = await import("./ai.server");
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

    const result = await aiJson<{ title: string; body: string }>(
      [
        {
          role: "system",
          content:
            "Sen bir GEO içerik editörüsün. Yalnızca sana verilen bilgi bankası alıntılarına ve marka zekâsına dayanarak Türkçe içerik taslağı yaz. Bilgi bankasında olmayan iddia uydurma. Yanıtı {title, body} JSON'u olarak ver; body markdown başlıklar içersin ve 400-700 kelime olsun.",
        },
        {
          role: "user",
          content: `Marka: ${brand.name} (${brand.domain})\nKonumlandırma: ${intel?.positioning ?? "-"}\nTon: ${intel?.tone ?? "-"}\nÖzet: ${intel?.summary ?? "-"}\n\nHedef soru: ${prompt.text}\n\nBilgi bankası alıntıları:\n${context_text}`,
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
