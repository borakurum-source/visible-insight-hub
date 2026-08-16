import { perplexityJson } from "./src/lib/perplexity.server";
import { deepseekJson } from "./src/lib/deepseek.server";

async function main() {
  console.log("Testing Perplexity...");
  const { result, citations } = await perplexityJson(
    [
      { role: "system", content: "Sen yardımcı bir asistansın." },
      { role: "user", content: "Türkiye'deki en iyi dijital pazarlama ajansları hangileri? JSON: {answer: string, mentionedBrands: string[]}" },
    ],
    {
      name: "test",
      schema: {
        type: "object",
        properties: {
          answer: { type: "string" },
          mentionedBrands: { type: "array", items: { type: "string" } },
        },
        required: ["answer", "mentionedBrands"],
      },
    },
    { answer: "", mentionedBrands: [] }
  );
  console.log("Perplexity result:", JSON.stringify(result, null, 2));
  console.log("Perplexity citations:", citations);

  console.log("\nTesting DeepSeek...");
  const dsResult = await deepseekJson(
    [
      { role: "system", content: "Sen marka analistisin." },
      { role: "user", content: "OneCite markası için 3 kısa ürün sloganı üret. JSON: {slogans: string[]}" },
    ],
    { slogans: [] }
  );
  console.log("DeepSeek result:", JSON.stringify(dsResult, null, 2));
}

main().catch(console.error);
