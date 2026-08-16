import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listBrands from "./tools/list-brands";
import getVisibility from "./tools/get-visibility";
import listPromptsTool from "./tools/list-prompts";
import searchKnowledgeTool from "./tools/search-knowledge";
import addKnowledgeSourceTool from "./tools/add-knowledge-source";

// OAuth issuer doğrudan Supabase host'u olmalı; proje ref build sırasında gömülür.
const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "onecite",
  title: "OneCite",
  version: "0.1.0",
  instructions:
    "OneCite yapay zekâ görünürlük paneli araçları. Önce list_brands ile marka kimliğini alın; ardından get_visibility ile skoru, list_prompts ile izlenen soruları, search_knowledge ile marka bilgi bankasındaki kanıtları okuyun. add_knowledge_source ile yeni kaynak ekleyebilirsiniz.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listBrands, getVisibility, listPromptsTool, searchKnowledgeTool, addKnowledgeSourceTool],
});
