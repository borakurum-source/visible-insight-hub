import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_visibility",
  title: "Görünürlük özeti",
  description: "Bir markanın yapay zeka görünürlük skorunu, ölçülen prompt sayısını ve son seçilen kaynaklarnı döner.",
  inputSchema: { brand_id: z.string().uuid().describe("OneCite marka kimliği (list_brands ile alınır).") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ brand_id }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const [batch, prompts, citations] = await Promise.all([
      supabase
        .from("measurement_batches")
        .select("score, status, measured_count, total_count, created_at")
        .eq("brand_id", brand_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("prompts").select("id", { count: "exact", head: true }).eq("brand_id", brand_id).eq("status", "approved"),
      supabase.from("citations").select("domain, url").eq("brand_id", brand_id).limit(20),
    ]);
    const summary = {
      score: batch.data?.score ?? null,
      lastRun: batch.data?.created_at ?? null,
      measured: batch.data?.measured_count ?? 0,
      total: batch.data?.total_count ?? 0,
      approvedPrompts: prompts.count ?? 0,
      citationDomains: Array.from(new Set((citations.data ?? []).map((c) => c.domain).filter(Boolean))),
    };
    return { content: [{ type: "text", text: JSON.stringify(summary) }], structuredContent: summary };
  },
});
