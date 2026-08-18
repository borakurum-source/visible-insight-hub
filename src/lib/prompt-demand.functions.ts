import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ClusterAnalysis } from "./prompt-demand/types";

export const analyzePromptDemand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brandId: string; topic: string; country?: string; language?: string }) => input)
  .handler(async ({ data, context }): Promise<ClusterAnalysis> => {
    const topic = data.topic.trim();
    if (topic.length < 3) throw new Error("Lütfen en az 3 karakterlik bir konu girin");

    const country = data.country || "TR";
    const language = data.language || "tr";

    const [{ data: brand }, { data: intel }] = await Promise.all([
      context.supabase.from("brands").select("name, domain").eq("id", data.brandId).single(),
      context.supabase.from("brand_intelligence").select("summary, products, audiences, competitors").eq("brand_id", data.brandId).maybeSingle(),
    ]);
    if (!brand) throw new Error("Marka bulunamadı");

    const { expandPrompts, attachCitationData } = await import("./prompt-demand.server");
    const { buildCluster } = await import("./prompt-demand/engine");

    const expansion = await expandPrompts({
      topic,
      country,
      language,
      brandName: brand.name as string,
      brandDomain: brand.domain as string,
      context: `${intel?.summary ?? ""} | Ürünler: ${JSON.stringify(intel?.products ?? [])} | Kitle: ${JSON.stringify(intel?.audiences ?? [])}`,
    });
    if (!expansion.candidates.length) throw new Error("Bu konu için yeterli prompt sinyali bulunamadı");

    const enriched = await attachCitationData(context.supabase, data.brandId, expansion.candidates);

    return buildCluster({
      topic,
      canonicalCluster: expansion.canonicalCluster,
      country,
      language,
      candidates: enriched.candidates,
      citationShare: enriched.citationShare,
      citationShareSource: enriched.citationShareSource,
      competitors: enriched.competitors,
    });
  });