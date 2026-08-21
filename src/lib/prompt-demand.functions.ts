import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ClusterAnalysis } from "./prompt-demand/types";

export const analyzePromptDemand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { brandId: string; topic: string; country?: string; language?: string }) => input,
  )
  .handler(async ({ data, context }): Promise<ClusterAnalysis> => {
    const topic = data.topic.trim();
    if (topic.length < 3) throw new Error("Lütfen en az 3 karakterlik bir konu girin");

    const country = data.country || "TR";
    const language = data.language || "tr";

    const [{ data: brand }, { data: intel }] = await Promise.all([
      context.supabase.from("brands").select("name, domain").eq("id", data.brandId).single(),
      context.supabase
        .from("brand_intelligence")
        .select("summary, products, audiences, competitors")
        .eq("brand_id", data.brandId)
        .maybeSingle(),
    ]);
    if (!brand) throw new Error("Marka bulunamadı");

    const { expandPrompts, attachCitationData, attachSearchSignals } =
      await import("./prompt-demand.server");
    const { buildCluster } = await import("./prompt-demand/engine");

    const expansion = await expandPrompts({
      topic,
      country,
      language,
      brandName: brand.name as string,
      brandDomain: brand.domain as string,
      context: `${intel?.summary ?? ""} | Ürünler: ${JSON.stringify(intel?.products ?? [])} | Kitle: ${JSON.stringify(intel?.audiences ?? [])}`,
    });
    if (!expansion.candidates.length)
      throw new Error("Bu konu için yeterli prompt sinyali bulunamadı");

    const enriched = await attachCitationData(context.supabase, data.brandId, expansion.candidates);
    const measuredPromptCount = enriched.candidates.filter((c) => c.source === "measured").length;
    const withSearch = await attachSearchSignals(
      context.supabase,
      data.brandId,
      enriched.candidates,
      measuredPromptCount,
      language,
    );

    const analysis = buildCluster({
      topic,
      canonicalCluster: expansion.canonicalCluster,
      country,
      language,
      candidates: withSearch.candidates,
      citationShare: enriched.citationShare,
      citationShareSource: enriched.citationShareSource,
      competitors: enriched.competitors,
      signalSources: withSearch.signalSources,
      calibration: withSearch.calibration,
      ga4Signal: withSearch.ga4Signal,
      ...(withSearch.ga4Signal.platformMix
        ? { platformFactors: withSearch.ga4Signal.platformMix }
        : {}),
    });

    const signalClass =
      withSearch.signalSources.gscMatchedPrompts > 0
        ? "observed_search_demand"
        : withSearch.signalSources.ga4AiSessions > 0
          ? "observed_ai_referral"
          : "discovery_evidence";
    const confidence =
      analysis.confidence === "high" ? 0.85 : analysis.confidence === "medium" ? 0.6 : 0.35;
    const { error: historyError } = await context.supabase
      .from("prompt_demand_runs" as never)
      .insert({
        brand_id: data.brandId,
        query_manifest: { topic, country, language },
        results: analysis,
        sources: {
          gsc: withSearch.signalSources.gscConnected,
          ga4: withSearch.signalSources.ga4Connected,
          measurement: enriched.citationShareSource,
        },
        signal_class: signalClass,
        opportunity_signal: analysis.opportunityScore,
        confidence,
        model_id: "perplexity-role/bulk_fast",
      } as never);
    if (historyError) throw new Error(`Talep keşfi geçmişe kaydedilemedi: ${historyError.message}`);
    return analysis;
  });

export const listPromptDemandHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; limit?: number }) => input)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("prompt_demand_runs" as never)
      .select(
        "id,query_manifest,signal_class,opportunity_signal,confidence,model_id,cost_usd,created_at" as never,
      )
      .eq("brand_id" as never, data.brandId)
      .order("created_at" as never, { ascending: false })
      .limit(Math.min(50, Math.max(1, data.limit ?? 12)));
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as Array<{
      id: string;
      query_manifest: { topic?: string; country?: string; language?: string };
      signal_class: "observed_search_demand" | "observed_ai_referral" | "discovery_evidence";
      opportunity_signal: number | null;
      confidence: number | null;
      model_id: string | null;
      cost_usd: number;
      created_at: string;
    }>;
  });
