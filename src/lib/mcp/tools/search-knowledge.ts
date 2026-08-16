import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_knowledge",
  title: "Bilgi bankasında ara",
  description: "Markanın bilgi bankasında anlamsal (vektör) arama yapar ve en ilgili kanıt parçalarını döner.",
  inputSchema: {
    brand_id: z.string().uuid(),
    query: z.string().trim().min(2).describe("Aranacak soru veya konu."),
    limit: z.number().int().min(1).max(12).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ brand_id, query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { embedOne } = await import("@/lib/embeddings.server");
    const vector = await embedOne(query);
    if (!vector) return { content: [{ type: "text", text: "Sorgu vektöre çevrilemedi" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.rpc("match_kb_chunks", {
      _brand_id: brand_id,
      query_embedding: JSON.stringify(vector) as unknown as string,
      match_count: limit ?? 6,
    });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const matches = ((data ?? []) as Array<{ id: string; content: string; similarity: number }>).map((row) => ({
      id: row.id,
      content: row.content.slice(0, 800),
      similarity: Math.round(row.similarity * 100),
    }));
    return { content: [{ type: "text", text: JSON.stringify(matches) }], structuredContent: { matches } };
  },
});
