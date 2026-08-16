import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_prompts",
  title: "Promptları listele",
  description: "Bir markanın izlenen yapay zekâ sorularını durum filtresiyle listeler.",
  inputSchema: {
    brand_id: z.string().uuid(),
    status: z.enum(["approved", "candidate", "inactive"]).optional().describe("Varsayılan: approved."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ brand_id, status }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("prompts")
      .select("id, text, category, intent, status")
      .eq("brand_id", brand_id)
      .eq("status", status ?? "approved")
      .order("created_at")
      .limit(200);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(data ?? []) }], structuredContent: { prompts: data ?? [] } };
  },
});
