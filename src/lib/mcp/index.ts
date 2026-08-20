import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listBrands from "./tools/list-brands";
import getVisibility from "./tools/get-visibility";
import listPromptsTool from "./tools/list-prompts";
import searchKnowledgeTool from "./tools/search-knowledge";
import addKnowledgeSourceTool from "./tools/add-knowledge-source";

// OAuth issuer, self-hosted Supabase'in public domain'inden türetilir.
type McpTools = Parameters<typeof defineMcp>[0]["tools"];

const supabaseUrl = process.env["SUPABASE_URL"] ?? import.meta.env["VITE_SUPABASE_URL"] ?? "";
const supabaseIssuer = `${supabaseUrl.replace(/\/+$/, "")}/auth/v1`;

export default defineMcp({
  name: "onecite",
  title: "OneCite",
  version: "0.1.0",
  instructions:
    "OneCite yapay zeka görünürlük paneli araçları. Önce list_brands ile marka kimliğini alın; ardından get_visibility ile skoru, list_prompts ile izlenen soruları, search_knowledge ile marka bilgi bankasındaki kanıtları okuyun. add_knowledge_source ile yeni kaynak ekleyebilirsiniz.",
  auth: auth.oauth.issuer({
    issuer: supabaseIssuer,
    acceptedAudiences: "authenticated",
  }),
  // Araç tanımları exactOptionalPropertyTypes ile birebir eşleşmiyor; SDK tipine daraltıyoruz.
  tools: [listBrands, getVisibility, listPromptsTool, searchKnowledgeTool, addKnowledgeSourceTool] as unknown as McpTools,
});
