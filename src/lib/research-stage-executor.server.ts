import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { aiGateway } from "./ai-gateway.server";
import { canonicalizeEvidenceUrl } from "./acquisition-policy.server";
import { firecrawlV2 } from "./firecrawl-v2.server";
import { RESEARCH_STAGES, type ClaimedJob, type ResearchStage } from "./orchestrator-worker.server";

async function hashText(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function getJob(job: ClaimedJob) {
  const { data, error } = await supabaseAdmin
    .from("orchestrator_jobs" as never)
    .select("brand_id,run_id,job_type,payload" as never)
    .eq("id" as never, job.id)
    .maybeSingle();
  if (error || !data) throw new Error(error?.message ?? "Orchestrator job not found");
  return data as unknown as {
    brand_id: string;
    run_id: string;
    job_type: string;
    payload: Record<string, unknown>;
  };
}

async function assertLease(job: ClaimedJob) {
  const { data } = await supabaseAdmin
    .from("orchestrator_jobs" as never)
    .select("id" as never)
    .eq("id" as never, job.id)
    .eq("claim_token" as never, job.claimToken)
    .eq("status" as never, "running")
    .gt("lease_expires_at" as never, new Date().toISOString())
    .maybeSingle();
  if (!data) throw new Error("orchestrator lease lost before side effect");
}

function isLeaseLoss(error: unknown) {
  return (
    error instanceof Error && /orchestrator (?:lease lost|heartbeat failed)/i.test(error.message)
  );
}

async function executeQueuedVisibilityMeasurement(
  meta: Awaited<ReturnType<typeof getJob>>,
  job: ClaimedJob,
) {
  await assertLease(job);
  if (meta.job_type !== "visibility") return null;
  const { data: existing } = await supabaseAdmin
    .from("measurement_batches")
    .select("id,status")
    .eq("research_run_id" as never, meta.run_id as never)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing?.status === "completed") return { batchId: existing.id, reused: true };

  const requestedIds = Array.isArray(meta.payload.promptIds)
    ? meta.payload.promptIds.map(String)
    : [];
  let promptQuery = supabaseAdmin
    .from("prompts")
    .select("id,text")
    .eq("brand_id", meta.brand_id)
    .eq("status", "approved");
  if (requestedIds.length) promptQuery = promptQuery.in("id", requestedIds);
  const [{ data: prompts }, { data: brand }, { data: intel }] = await Promise.all([
    promptQuery,
    supabaseAdmin.from("brands").select("name,domain").eq("id", meta.brand_id).single(),
    supabaseAdmin
      .from("brand_intelligence")
      .select("competitors")
      .eq("brand_id", meta.brand_id)
      .maybeSingle(),
  ]);
  if (!brand || !prompts?.length) throw new Error("Queued visibility run has no approved prompts");

  const requestedMode = String(meta.payload._measurement_mode ?? "full");
  const measurementMode =
    requestedMode === "single" || requestedMode === "remeasure" ? requestedMode : "full";
  const { promptSetFingerprint } = await import("./measurement-rounds.server");
  const batchQuery = existing
    ? supabaseAdmin
        .from("measurement_batches")
        .update({
          status: "running",
          error: null,
          total_prompts: prompts.length,
          measurement_mode: measurementMode,
          prompt_set_hash: promptSetFingerprint(prompts.map((prompt) => prompt.id)),
          prompt_ids: prompts.map((prompt) => prompt.id),
        } as never)
        .eq("id", existing.id)
        .select("id")
        .single()
    : supabaseAdmin
        .from("measurement_batches")
        .insert({
          brand_id: meta.brand_id,
          research_run_id: meta.run_id,
          status: "running",
          engine: "agent_web_grounded",
          measurement_mode: measurementMode,
          prompt_set_hash: promptSetFingerprint(prompts.map((prompt) => prompt.id)),
          prompt_ids: prompts.map((prompt) => prompt.id),
          total_prompts: prompts.length,
          completed_prompts: 0,
        } as never)
        .select("id")
        .single();
  const { data: batch, error: batchError } = await batchQuery;
  if (batchError || !batch) throw new Error(batchError?.message ?? "Measurement batch failed");

  // Resuming a leased/retried job must aggregate the already persisted prompt
  // runs instead of measuring them again or dropping them from the snapshot.
  const { data: persistedRuns } = await supabaseAdmin
    .from("prompt_runs")
    .select("id,brand_mentioned,position")
    .eq("batch_id" as never, batch.id as never);
  const persistedRunIds = (persistedRuns ?? []).map((run) => run.id);
  const { data: persistedCitations } = persistedRunIds.length
    ? await supabaseAdmin.from("citations").select("is_own_domain").in("run_id", persistedRunIds)
    : { data: [] };

  const { measurePrompt } = await import("./measurement.server");
  const { normalizeCompetitors, competitorMatches, competitorNames } =
    await import("./competitors");
  const competitors = normalizeCompetitors(intel?.competitors);
  const runs: Array<{ brand_mentioned: boolean; position: number | null }> = (
    persistedRuns ?? []
  ).map((run) => ({ brand_mentioned: run.brand_mentioned, position: run.position }));
  let ownCitations = (persistedCitations ?? []).filter((citation) => citation.is_own_domain).length;
  let totalCitations = persistedCitations?.length ?? 0;
  let failures = 0;
  for (const prompt of prompts) {
    const { data: alreadyMeasured } = await supabaseAdmin
      .from("prompt_runs")
      .select("id")
      .eq("batch_id" as never, batch.id as never)
      .eq("prompt_id" as never, prompt.id as never)
      .maybeSingle();
    if (alreadyMeasured) continue;
    try {
      await assertLease(job);
      const measured = await measurePrompt({
        brandName: brand.name,
        brandDomain: brand.domain,
        competitors: competitorNames(competitors),
        promptText: prompt.text,
      });
      const visibility = !measured.brandMentioned
        ? 0
        : measured.position
          ? Math.max(40, 100 - (measured.position - 1) * 10)
          : 60;
      await assertLease(job);
      const { data: run, error: runError } = await supabaseAdmin
        .from("prompt_runs")
        .insert({
          brand_id: meta.brand_id,
          prompt_id: prompt.id,
          batch_id: batch.id,
          batch_prompt_key: `${batch.id}:${prompt.id}`,
          research_run_id: meta.run_id,
          engine: "agent_web_grounded",
          measurement_mode: measurementMode,
          measurement_surface: "agent_web_grounded",
          model_id: "perplexity/preset-fast",
          brand_mentioned: measured.brandMentioned,
          position: measured.position,
          visibility,
          raw_answer: measured.answer,
          answer_summary: measured.answer.slice(0, 280),
          mentioned_brands: measured.mentionedBrands.map((item) => item.name),
          cited_reasons: measured.mentionedBrands,
          confidence: measured.sources.length ? 0.85 : 0.55,
          coverage: 1,
        } as never)
        .select("id")
        .single();
      if (runError || !run) throw new Error(runError?.message ?? "Prompt run failed");
      runs.push({ brand_mentioned: measured.brandMentioned, position: measured.position });
      const uniqueSources = [
        ...new Map(measured.sources.map((source) => [source.url, source])).values(),
      ];
      totalCitations += uniqueSources.length;
      const citationRows = uniqueSources.map((source) => {
        const isOwn = source.domain.includes(brand.domain) || brand.domain.includes(source.domain);
        if (isOwn) ownCitations += 1;
        const isCompetitor =
          !isOwn &&
          competitors.some((competitor) =>
            competitorMatches(competitor, { answer: source.title, domains: [source.domain] }),
          );
        return {
          brand_id: meta.brand_id,
          run_id: run.id,
          prompt_id: prompt.id,
          url: source.url,
          domain: source.domain,
          title: source.title || source.domain,
          is_own_domain: isOwn,
          citation_type: isOwn ? "own" : isCompetitor ? "competitor" : "neutral",
        };
      });
      if (citationRows.length) await supabaseAdmin.from("citations").insert(citationRows);
    } catch (error) {
      if (isLeaseLoss(error)) throw error;
      failures += 1;
    }
  }
  const [{ count: knowledgeSources }, { data: claims }] = await Promise.all([
    supabaseAdmin
      .from("knowledge_sources")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", meta.brand_id),
    supabaseAdmin.from("claims").select("evidence_url").eq("brand_id", meta.brand_id),
  ]);
  const { computeVisibilityScore } = await import("./score-model");
  const score = computeVisibilityScore({
    runs,
    ownCitations,
    totalCitations,
    knowledgeSources: knowledgeSources ?? 0,
    claimsWithEvidence: (claims ?? []).filter((claim) => Boolean(claim.evidence_url)).length,
  });
  const coverage = runs.length / prompts.length;
  const { error: finishError } = await supabaseAdmin
    .from("measurement_batches")
    .update({
      status: runs.length ? "completed" : "failed",
      completed_prompts: runs.length,
      score: score.total,
      components: score.components,
      coverage,
      confidence: Math.max(0.35, Math.min(0.95, coverage * 0.75 + (totalCitations ? 0.2 : 0.05))),
      error: failures ? `${failures} prompt ölçülemedi` : null,
      finished_at: new Date().toISOString(),
    } as never)
    .eq("id", batch.id);
  if (finishError) throw new Error(finishError.message);
  if (!runs.length) throw new Error("Queued visibility measurement failed for every prompt");
  if (measurementMode === "full" && ownCitations === 0) {
    const { error: findingError } = await supabaseAdmin.from("findings" as never).insert({
      brand_id: meta.brand_id,
      run_id: meta.run_id,
      finding_type: "citation_gap",
      title: "Marka kaynakları ölçülen yanıtlarda kullanılmıyor",
      detection: `Bu tam turda ${runs.length} prompt ölçüldü; marka alan adından kaynak bulunamadı.`,
      cause: "AI yanıtlarında seçilebilir, açık ve doğrulanabilir marka kanıtı yetersiz olabilir.",
      recommendation:
        "Etkilenen promptları doğrudan yanıtlayan kaynak sayfaları güçlendirin ve aynı prompt setiyle yeniden ölçün.",
      affected_entities: { batch_id: batch.id, prompt_ids: prompts.map((prompt) => prompt.id) },
      evidence_count: totalCitations,
      confidence: Math.min(0.9, 0.5 + runs.length / 100),
      impact: 85,
      effort: 55,
    } as never);
    if (findingError && findingError.code !== "23505") throw new Error(findingError.message);
  }
  return { batchId: batch.id, reused: false, measured: runs.length, failures };
}

async function getArtifact(runId: string, type: string): Promise<Record<string, unknown> | null> {
  const { data } = await supabaseAdmin
    .from("research_artifacts" as never)
    .select("inline_payload" as never)
    .eq("run_id" as never, runId)
    .eq("artifact_type" as never, type)
    .maybeSingle();
  return (
    (data as unknown as { inline_payload?: Record<string, unknown> } | null)?.inline_payload ?? null
  );
}

async function putArtifact(
  brandId: string,
  runId: string,
  type: string,
  payload: unknown,
  provenance: string,
) {
  const serialized = JSON.stringify(payload);
  const contentHash = await hashText(serialized);
  const storagePath = `${brandId}/${runId}/${type.replaceAll(/[^a-z0-9_-]/gi, "_")}.json`;
  const { error: storageError } = await supabaseAdmin.storage
    .from("research-artifacts")
    .upload(storagePath, serialized, {
      upsert: true,
      contentType: "application/json; charset=utf-8",
    });
  if (storageError) throw new Error(`Research artifact storage failed: ${storageError.message}`);
  const { error } = await supabaseAdmin.from("research_artifacts" as never).upsert(
    {
      brand_id: brandId,
      run_id: runId,
      artifact_type: type,
      storage_path: storagePath,
      mime_type: "application/json",
      sha256: contentHash,
      size_bytes: new TextEncoder().encode(serialized).byteLength,
      inline_payload: payload,
      provenance,
    } as never,
    { onConflict: "run_id,artifact_type" },
  );
  if (error) throw new Error(error.message);
}

async function persistEvidenceGraph(
  brandId: string,
  runId: string,
  fetched: Array<{ url?: string; content?: string; provider?: string }>,
  claims: Array<{ statement: string; sourceUrl?: string; confidence: number }>,
) {
  const sourceIds = new Map<string, string>();
  for (const item of fetched) {
    const originalUrl = String(item.url ?? "").trim();
    const content = String(item.content ?? "").trim();
    if (!originalUrl || !content) continue;
    const canonicalUrl = canonicalizeEvidenceUrl(originalUrl);
    const contentHash = await hashText(content);
    const { data: source, error: sourceError } = await supabaseAdmin
      .from("evidence_sources" as never)
      .upsert(
        {
          brand_id: brandId,
          run_id: runId,
          canonical_url: canonicalUrl,
          original_url: originalUrl,
          domain: new URL(canonicalUrl).hostname.replace(/^www\./i, "").toLowerCase(),
          title: canonicalUrl,
          provenance: item.provider ?? "perplexity_fetch",
          content_hash: contentHash,
          metadata: { fetched: true },
        } as never,
        { onConflict: "brand_id,canonical_url,content_hash" },
      )
      .select("id" as never)
      .single();
    if (sourceError || !source) throw new Error(sourceError?.message ?? "Evidence source failed");
    const sourceId = String((source as unknown as { id: string }).id);
    sourceIds.set(canonicalUrl, sourceId);
    const chunks = content
      .match(/.{1,1400}(?:\s|$)/gs)
      ?.map((chunk) => chunk.trim())
      .filter(Boolean) ?? [content];
    await supabaseAdmin.from("evidence_chunks" as never).upsert(
      chunks.map((chunk, ordinal) => ({
        brand_id: brandId,
        source_id: sourceId,
        ordinal,
        content: chunk,
        content_hash: contentHash,
        metadata: { run_id: runId },
      })) as never,
      { onConflict: "source_id,ordinal" },
    );
  }
  for (const claim of claims) {
    const statement = claim.statement.trim();
    if (!statement) continue;
    const { data: existing } = await supabaseAdmin
      .from("evidence_claims" as never)
      .select("id" as never)
      .eq("run_id" as never, runId)
      .eq("statement" as never, statement)
      .maybeSingle();
    const { data: claimRow, error: claimError } = existing
      ? { data: existing, error: null }
      : await supabaseAdmin
          .from("evidence_claims" as never)
          .insert({
            brand_id: brandId,
            run_id: runId,
            statement,
            claim_type: "external",
            status: "external",
            confidence: claim.confidence,
          } as never)
          .select("id" as never)
          .single();
    if (claimError || !claimRow) throw new Error(claimError?.message ?? "Evidence claim failed");
    // A claim without a matching acquired URL is unsupported; never attach it
    // to an arbitrary source and create a false support edge.
    const sourceId = claim.sourceUrl
      ? sourceIds.get(canonicalizeEvidenceUrl(claim.sourceUrl))
      : undefined;
    if (!sourceId) continue;
    const { data: chunk } = await supabaseAdmin
      .from("evidence_chunks" as never)
      .select("id" as never)
      .eq("source_id" as never, sourceId)
      .order("ordinal" as never)
      .limit(1)
      .maybeSingle();
    await supabaseAdmin.from("claim_evidence_edges" as never).upsert(
      {
        brand_id: brandId,
        claim_id: (claimRow as unknown as { id: string }).id,
        source_id: sourceId,
        chunk_id: (chunk as unknown as { id?: string } | null)?.id ?? null,
        relation: "supports",
        confidence: claim.confidence,
      } as never,
      { onConflict: "claim_id,source_id,chunk_id,relation" },
    );
  }
}

async function stageRecord(
  job: ClaimedJob,
  stage: ResearchStage,
  status: "running" | "completed" | "failed",
  error?: unknown,
) {
  await assertLease(job);
  const meta = await getJob(job);
  const ordinal = RESEARCH_STAGES.indexOf(stage) + 1;
  const { data: existing } = await supabaseAdmin
    .from("research_run_stages" as never)
    .select("attempt_count" as never)
    .eq("run_id" as never, job.runId)
    .eq("ordinal" as never, ordinal)
    .maybeSingle();
  const priorAttempts = Number(
    (existing as unknown as { attempt_count?: number } | null)?.attempt_count ?? 0,
  );
  await supabaseAdmin.from("research_run_stages" as never).upsert(
    {
      brand_id: meta.brand_id,
      run_id: job.runId,
      stage,
      ordinal,
      status,
      attempt_count: status === "running" ? priorAttempts + 1 : priorAttempts,
      ...(status === "running"
        ? { started_at: new Date().toISOString() }
        : { finished_at: new Date().toISOString() }),
      ...(error
        ? { error: { message: error instanceof Error ? error.message : String(error) } }
        : {}),
    } as never,
    { onConflict: "run_id,ordinal" },
  );
}

export async function executeResearchStage(stage: ResearchStage, job: ClaimedJob) {
  await assertLease(job);
  await stageRecord(job, stage, "running");
  const meta = await getJob(job);
  const manifest = meta.payload ?? {};
  try {
    if (stage === "project_definition") {
      if (!meta.brand_id || !job.runId)
        throw new Error("Research manifest is missing brand or run identity");
      await putArtifact(
        meta.brand_id,
        job.runId,
        stage,
        { manifest, validatedAt: new Date().toISOString() },
        "backend",
      );
    } else if (stage === "query_expansion") {
      const topic = String(manifest.topic ?? manifest.prompt ?? manifest.domain ?? "").trim();
      const prompts = Array.isArray(manifest.prompts) ? manifest.prompts.map(String) : [];
      const response = prompts.length
        ? { data: { queries: prompts.slice(0, 30) }, model: "manifest", surface: "agent" as const }
        : await aiGateway.json({
            role: "bulk_fast",
            messages: [
              {
                role: "user",
                content: `Bu araştırma konusu için persona ve niyet çeşitliliği olan en fazla 24 doğal sorgu üret: ${topic}`,
              },
            ],
            schema: z.object({ queries: z.array(z.string().min(3)).min(1).max(30) }),
            jsonSchema: {
              name: "query_plan",
              schema: {
                type: "object",
                properties: { queries: { type: "array", items: { type: "string" } } },
                required: ["queries"],
              },
            },
          });
      await putArtifact(
        meta.brand_id,
        job.runId,
        stage,
        { queries: response.data.queries, model: response.model, surface: response.surface },
        "perplexity_router",
      );
    } else if (stage === "discovery") {
      const plan = await getArtifact(job.runId, "query_expansion");
      const queries = Array.isArray(plan?.queries) ? plan.queries.map(String).slice(0, 10) : [];
      const discoveries = [];
      for (const query of queries) {
        const response = await aiGateway.text({
          role: "search_fast",
          messages: [{ role: "user", content: query }],
          tools: [{ type: "web_search" }],
          maxOutputTokens: 800,
          brandId: meta.brand_id,
        });
        discoveries.push({
          query,
          answer: response.data,
          sources: response.sources,
          model: response.model,
          surface: "agent_web_grounded",
        });
        for (const source of response.sources) {
          await assertLease(job);
          const canonicalUrl = canonicalizeEvidenceUrl(source.url);
          const contentHash = await hashText(`${source.title}|${source.snippet ?? ""}`);
          await supabaseAdmin.from("evidence_sources" as never).upsert(
            {
              brand_id: meta.brand_id,
              run_id: job.runId,
              canonical_url: canonicalUrl,
              original_url: source.url,
              domain: source.domain,
              title: source.title,
              provenance: "perplexity_search",
              content_hash: contentHash,
              metadata: { snippet: source.snippet ?? null, query },
            } as never,
            { onConflict: "brand_id,canonical_url,content_hash" },
          );
        }
      }
      await putArtifact(meta.brand_id, job.runId, stage, { discoveries }, "perplexity_search");
    } else if (stage === "url_selection") {
      const discovery = await getArtifact(job.runId, "discovery");
      const rows = Array.isArray(discovery?.discoveries)
        ? (discovery.discoveries as Array<{ sources?: Array<{ url?: string }> }>)
        : [];
      const urls = [
        ...new Set(
          rows
            .flatMap((row) => row.sources ?? [])
            .map((source) => source.url)
            .filter((url): url is string => Boolean(url)),
        ),
      ].slice(0, 30);
      await putArtifact(
        meta.brand_id,
        job.runId,
        stage,
        { urls: urls.slice(0, Math.max(3, Math.min(30, Number(manifest.fetchLimit ?? 3)))) },
        "backend_policy",
      );
    } else if (stage === "evidence_fetch") {
      const selected = await getArtifact(job.runId, "url_selection");
      const urls = Array.isArray(selected?.urls) ? selected.urls.map(String).slice(0, 30) : [];
      const fetched = [];
      for (const url of urls) {
        try {
          const response = await aiGateway.text({
            role: "research_standard",
            messages: [
              {
                role: "user",
                content: `Bu URL'deki kanıtı, metadata ve ana iddiaları çıkar: ${url}`,
              },
            ],
            tools: [{ type: "fetch_url", urls: [url] }],
            maxOutputTokens: 1600,
            brandId: meta.brand_id,
          });
          fetched.push({ url, content: response.data, provider: "perplexity_fetch" });
        } catch {
          fetched.push({
            url,
            content: await firecrawlV2.scrape(url),
            provider: "firecrawl_scrape",
          });
        }
      }
      await putArtifact(meta.brand_id, job.runId, stage, { fetched }, "acquisition_policy");
    } else if (stage === "normalization") {
      const fetched = await getArtifact(job.runId, "evidence_fetch");
      const response = await aiGateway.json({
        role: "bulk_fast",
        messages: [
          {
            role: "user",
            content: `Bu kanıtlardan doğrulanabilir claim'leri çıkar. Harici claim'leri onaylı marka gerçeği sayma.\n${JSON.stringify(fetched).slice(0, 40_000)}`,
          },
        ],
        schema: z.object({
          claims: z.array(
            z.object({
              statement: z.string(),
              sourceUrl: z.string().optional(),
              confidence: z.number().min(0).max(1),
            }),
          ),
        }),
        jsonSchema: {
          name: "normalized_evidence",
          schema: {
            type: "object",
            properties: {
              claims: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    statement: { type: "string" },
                    sourceUrl: { type: "string" },
                    confidence: { type: "number" },
                  },
                  required: ["statement", "confidence"],
                },
              },
            },
            required: ["claims"],
          },
        },
      });
      await assertLease(job);
      await persistEvidenceGraph(
        meta.brand_id,
        job.runId,
        Array.isArray(fetched?.fetched) ? fetched.fetched : [],
        response.data.claims,
      );
      await putArtifact(meta.brand_id, job.runId, stage, response.data, "perplexity_router");
    } else if (stage === "citation_analysis") {
      const discovery = await getArtifact(job.runId, "discovery");
      const normalized = await getArtifact(job.runId, "normalization");
      await putArtifact(
        meta.brand_id,
        job.runId,
        stage,
        {
          discovery,
          claims: normalized?.claims ?? [],
          reasonCodes: ["source_presence", "claim_support", "authority_pending"],
        },
        "backend_rules",
      );
    } else if (stage === "signal_generation") {
      const { data: sources } = await supabaseAdmin
        .from("evidence_sources" as never)
        .select("domain,provenance" as never)
        .eq("run_id" as never, job.runId);
      const list = (sources ?? []) as unknown as Array<{ domain: string; provenance: string }>;
      await putArtifact(
        meta.brand_id,
        job.runId,
        stage,
        {
          sourceCount: list.length,
          sourceDiversity: new Set(list.map((item) => item.domain)).size,
          provenance: [...new Set(list.map((item) => item.provenance))],
        },
        "backend_rules",
      );
    } else if (stage === "researched_generation") {
      const normalized = await getArtifact(job.runId, "normalization");
      const response = await aiGateway.text({
        role: "research_standard",
        messages: [
          {
            role: "user",
            content: `Yalnız verilen kanıtlara dayalı strateji brief'i oluştur: ${JSON.stringify(normalized).slice(0, 30_000)}`,
          },
        ],
        maxOutputTokens: 2400,
        brandId: meta.brand_id,
      });
      await putArtifact(
        meta.brand_id,
        job.runId,
        stage,
        { brief: response.data, citations: response.citations },
        "perplexity_agent",
      );
    } else if (stage === "content_generation") {
      const brief = await getArtifact(job.runId, "researched_generation");
      const response = await aiGateway.text({
        role: "bulk_fast",
        messages: [
          {
            role: "user",
            content: `Bu brief için aksiyon ve içerik taslağı üret: ${String(brief?.brief ?? "")}`,
          },
        ],
        maxOutputTokens: 2600,
        brandId: meta.brand_id,
      });
      await putArtifact(
        meta.brand_id,
        job.runId,
        stage,
        { draft: response.data },
        "perplexity_router",
      );
    } else if (stage === "final_report") {
      const [signals, brief, draft] = await Promise.all([
        getArtifact(job.runId, "signal_generation"),
        getArtifact(job.runId, "researched_generation"),
        getArtifact(job.runId, "content_generation"),
      ]);
      const response = await aiGateway.text({
        role: "editorial_premium",
        messages: [
          {
            role: "user",
            content: `Yönetici özeti, bulgu, öneri, yöntem/kapsam/güven içeren rapor yaz. Nedensellik iddia etme.\n${JSON.stringify({ signals, brief, draft }).slice(0, 40_000)}`,
          },
        ],
        maxOutputTokens: 3500,
        brandId: meta.brand_id,
      });
      await putArtifact(
        meta.brand_id,
        job.runId,
        stage,
        { report: response.data },
        "perplexity_agent",
      );
    } else if (stage === "monitoring") {
      const selected = await getArtifact(job.runId, "url_selection");
      const urls = Array.isArray(selected?.urls) ? selected.urls.map(String).slice(0, 3) : [];
      const monitors = [];
      for (const url of urls)
        monitors.push({
          url,
          result: await firecrawlV2.monitor(url).catch((error) => ({ error: String(error) })),
        });
      const measurement = await executeQueuedVisibilityMeasurement(meta, job);
      await assertLease(job);
      await putArtifact(
        meta.brand_id,
        job.runId,
        stage,
        { monitors, measurement },
        "firecrawl_monitor",
      );
    }
    await assertLease(job);
    await stageRecord(job, stage, "completed");
  } catch (error) {
    // Do not let a replacement worker write a terminal stage status for the
    // stale claim. The queue-level fail RPC will fence the job instead.
    if (!isLeaseLoss(error)) {
      try {
        await stageRecord(job, stage, "failed", error);
      } catch (recordError) {
        if (!isLeaseLoss(recordError)) throw recordError;
      }
    }
    throw error;
  }
}
