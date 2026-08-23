// Prompt Discovery server functions (TanStack React Start createServerFn).
// site-health.functions.ts desenini izler: ince sarmalayıcı + requireSupabaseAuth + dinamik import.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type OneCiteClient = Database["onecite"]["Tables"];

export const listOpportunities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; status?: string }) => input)
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("prompt_opportunities" as never)
      .select("*" as never)
      .eq("brand_id" as never, data.brandId);

    if (data.status) {
      q = q.eq("status" as never, data.status);
    }

    const { data: rows, error } = await q
      .order("expected_value" as never, { ascending: false, nullsLast: true })
      .limit(500);

    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as Array<OneCiteClient["prompt_opportunities"]["Row"]>;
  });

export const runDiscovery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string }) => input)
  .handler(async ({ data, context }) => {
    const { generateCandidates, scoreCandidates } = await import("./prompt-discovery.server");

    // Aday üret + skorla
    const candidates = await generateCandidates(context.supabase, data.brandId);
    const scored = await scoreCandidates(context.supabase, data.brandId, candidates);

    // Batch açınız
    const { error: batchError, data: batch } = await context.supabase
      .from("measurement_batches" as never)
      .insert({
        brand_id: data.brandId,
        engine: "prompt_discovery",
        status: "running",
        total_prompts: scored.length,
        completed_prompts: 0,
        components: { source: "discovery", candidate_count: scored.length },
      } as never)
      .select("id" as never)
      .single();

    if (batchError || !batch) throw new Error(`Batch oluşturulamadı: ${batchError?.message}`);

    // prompt_opportunities'ye upsert
    // Çakışmada (aynı text_normalized): mevcut satırın user_id korunur (status_reason falan)
    const { normalizePromptText } = await import("./prompt-normalize");
    const toInsert = scored.map((s) => ({
      brand_id: data.brandId,
      batch_id: batch.id,
      text: s.text,
      cluster: s.cluster,
      intent: s.intent,
      shape: s.shape,
      rationale: s.rationale,
      evidence_gap_type: s.evidenceGapType,
      observed_demand: s.observedDemand,
      demand_source: s.demandSource,
      demand_origin: s.demandOrigin,
      confidence: s.confidence,
      status: "new",
      metadata: { recommended_action: s.recommendedAction },
    }));

    const { error: upsertError } = await context.supabase
      .from("prompt_opportunities" as never)
      .upsert(toInsert as never, {
        onConflict: "brand_id,text_normalized",
        ignoreDuplicates: false,
      });

    if (upsertError) throw new Error(`Fırsatlar yazılamadı: ${upsertError.message}`);

    return { batchId: batch.id, candidateCount: scored.length };
  });

export const measureOpportunityChunk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; batchId: string; limit?: number }) => input)
  .handler(async ({ data, context }) => {
    const { measureCandidate } = await import("./prompt-discovery.server");
    const { evaluateOpportunity } = await import("./prompt-opportunity");

    const limit = data.limit ?? 3;

    // Sırada bekleyen satırlar: new veya measuring
    const { data: opportunities, error: fetchError } = await context.supabase
      .from("prompt_opportunities" as never)
      .select("id, text, observed_demand, demand_source, observation_count" as never)
      .eq("brand_id" as never, data.brandId)
      .eq("batch_id" as never, data.batchId)
      .in("status" as never, ["new", "measuring"])
      .limit(limit);

    if (fetchError) throw new Error(fetchError.message);
    if (!opportunities?.length) return { measured: 0, total: 0 };

    // Brand ve competitors (measurement.server.ts ile aynı deseni izle)
    const [{ data: brand }, { data: competitors }] = await Promise.all([
      context.supabase.from("brands" as never).select("name, domain" as never).eq("id", data.brandId).single(),
      context.supabase
        .from("competitor_candidates" as never)
        .select("competitor_name" as never)
        .eq("brand_id" as never, data.brandId)
        .limit(10),
    ]);

    if (!brand) throw new Error("Marka bulunamadı");

    const competitorNames = (competitors ?? [])
      .map((c) => String(c.competitor_name))
      .filter((n) => n.length > 0);

    // Batch'teki model (measurement_rounds.ts desenini izle)
    const { data: batchRow } = await context.supabase
      .from("measurement_batches" as never)
      .select("model_id" as never)
      .eq("id" as never, data.batchId)
      .single();

    const model = (batchRow as unknown as { model_id?: string | null }).model_id ?? undefined;

    let measured = 0;
    const updates: Array<{
      id: string;
      observed_visibility: number | null;
      observation_count: number;
      panel: object[];
      status: string;
      status_reason: string | null;
    }> = [];

    for (const opp of opportunities) {
      try {
        const result = await measureCandidate({
          brandName: String(brand.name),
          brandDomain: String(brand.domain),
          competitors: competitorNames,
          promptText: String(opp.text),
          repeatCount: 2,
          model,
        });

        updates.push({
          id: String(opp.id),
          observed_visibility: result.visibility,
          observation_count: (opp.observation_count ?? 0) + 2,
          panel: result.panel,
          status: "measuring",
          status_reason: null,
        });

        measured++;
      } catch (err) {
        console.error(`Measurement failed for opportunity ${opp.id}`, err);
      }
    }

    // Batch update
    for (const update of updates) {
      const { error } = await context.supabase
        .from("prompt_opportunities" as never)
        .update({
          observed_visibility: update.observed_visibility,
          observation_count: update.observation_count,
          panel: update.panel,
          status: update.status,
          status_reason: update.status_reason,
        } as never)
        .eq("id" as never, update.id);

      if (error) console.error(`Update failed for ${update.id}:`, error);
    }

    // Batch'in completed_prompts'ını artır
    const { data: current } = await context.supabase
      .from("measurement_batches" as never)
      .select("completed_prompts" as never)
      .eq("id" as never, data.batchId)
      .single();

    const newCompleted = ((current as unknown as { completed_prompts?: number })
      ?.completed_prompts ?? 0) + measured;

    await context.supabase
      .from("measurement_batches" as never)
      .update({ completed_prompts: newCompleted } as never)
      .eq("id" as never, data.batchId);

    return { measured, total: opportunities.length };
  });

export const finishDiscoveryRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; batchId: string }) => input)
  .handler(async ({ data, context }) => {
    const { evaluateOpportunity } = await import("./prompt-opportunity");

    // Tüm satırlar (batch'ın olayıyla ilgili) → evaluateOpportunity yeniden çalıştır
    const { data: opportunities, error: fetchError } = await context.supabase
      .from("prompt_opportunities" as never)
      .select(
        "id, observed_demand, demand_source, observed_visibility, observation_count" as never,
      )
      .eq("batch_id" as never, data.batchId);

    if (fetchError) throw new Error(fetchError.message);

    for (const opp of opportunities ?? []) {
      const evaluation = evaluateOpportunity({
        observedDemand: opp.observed_demand ? Number(opp.observed_demand) : null,
        demandSource: String(opp.demand_source) as any,
        observedVisibility: opp.observed_visibility ? Number(opp.observed_visibility) : null,
        observationCount: opp.observation_count ?? 0,
      });

      const { error } = await context.supabase
        .from("prompt_opportunities" as never)
        .update({
          status: evaluation.status,
          status_reason: evaluation.reason,
          expected_value: evaluation.expectedValue,
        } as never)
        .eq("id" as never, opp.id);

      if (error) console.error(`Finalize failed for ${opp.id}:`, error);
    }

    // Batch durumunu kapat
    await context.supabase
      .from("measurement_batches" as never)
      .update({ status: "completed", finished_at: new Date().toISOString() } as never)
      .eq("id" as never, data.batchId);

    return { completed: true };
  });

export const decideOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; decision: "track" | "reject" }) => input)
  .handler(async ({ data, context }) => {
    if (data.decision === "reject") {
      // Sadece status'ü "rejected" yap
      const { error } = await context.supabase
        .from("prompt_opportunities" as never)
        .update({ status: "rejected", status_reason: "Kullanıcı tarafından reddedildi" } as never)
        .eq("id" as never, data.id);

      if (error) throw new Error(error.message);
      return { success: true };
    }

    if (data.decision === "track") {
      // Mevcut addDiscoveredPrompts mantığıyla prompts'a ekle
      const { data: opp } = await context.supabase
        .from("prompt_opportunities" as never)
        .select("brand_id, text, cluster, intent" as never)
        .eq("id" as never, data.id)
        .single();

      if (!opp) throw new Error("Fırsat bulunamadı");

      const { addDiscoveredPrompts } = await import("./panel.functions");
      await addDiscoveredPrompts({
        data: {
          brandId: String(opp.brand_id),
          items: [
            {
              text: String(opp.text),
              cluster: String(opp.cluster ?? "keşif"),
              intent: String(opp.intent ?? "informational"),
            },
          ],
        },
      });

      // Başarılıysa, promoted_prompt_id'yi bul ve yaz
      const { data: prompts } = await context.supabase
        .from("prompts" as never)
        .select("id" as never)
        .eq("brand_id" as never, opp.brand_id)
        .eq("text" as never, opp.text)
        .single();

      if (prompts) {
        const { error: updateError } = await context.supabase
          .from("prompt_opportunities" as never)
          .update({
            status: "tracked",
            promoted_prompt_id: prompts.id,
            status_reason: "Portföye eklendi",
          } as never)
          .eq("id" as never, data.id);

        if (updateError) throw new Error(updateError.message);
      }

      return { success: true };
    }

    throw new Error("Geçersiz karar");
  });

export const createTaskFromOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    // Yalnızca actionable fırsat → geo_tasks
    const { data: opp } = await context.supabase
      .from("prompt_opportunities" as never)
      .select("status, text, recommended_action" as never)
      .eq("id" as never, data.id)
      .single();

    if (!opp || opp.status !== "actionable") {
      throw new Error("Yalnızca aksiyona hazır fırsatlardan görev oluşturulabilir");
    }

    // Şimdi geo_tasks'a kaydı yaz (tasks.server.ts desenini izle)
    // Basit versiyon: başlık + açıklama
    const { data: opportunity } = await context.supabase
      .from("prompt_opportunities" as never)
      .select("brand_id, text, metadata" as never)
      .eq("id" as never, data.id)
      .single();

    if (!opportunity) throw new Error("Fırsat bulunamadı");

    const metadata = (opportunity.metadata as any) ?? {};
    const recommendedAction = metadata.recommended_action ?? "İçerik güncellemesi gerekli";

    const { error } = await context.supabase
      .from("geo_tasks" as never)
      .insert({
        brand_id: String(opportunity.brand_id),
        title: `"${opp.text}" — Prompt optimizasyonu`,
        description: `Talep: Bu AI prompt'ta markanız görünmüyor.\n\nÖnerilen aksiyon: ${recommendedAction}`,
        status: "open",
      } as never)
      .select("id" as never)
      .single();

    if (error) throw new Error(`Görev oluşturulamadı: ${error.message}`);

    return { success: true };
  });
