import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "add_knowledge_source",
  title: "Bilgi kaynağı ekle",
  description: "Markanın bilgi bankasına yeni bir URL kaynağı ekler. İndeksleme panelden veya index_source ile başlatılır.",
  inputSchema: {
    brand_id: z.string().uuid(),
    url: z.string().url(),
    title: z.string().trim().min(1).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ brand_id, url, title }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("knowledge_sources")
      .insert({ brand_id, url, title: title ?? new URL(url).hostname, source_type: "url" })
      .select("id, url, title, index_status")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { source: data } };
  },
});
