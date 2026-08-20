import { createClient } from "@supabase/supabase-js";

const MODEL = "pplx-embed-v1-4b";
const DIMS = 1024;
const BATCH_SIZE = 32;
const MAX_RETRIES = 5;

type ChunkRow = { id: string; content: string; heading: string | null };
type EmbeddingRow = { index: number; embedding: string | number[] };

const supabaseUrl = process.env["SUPABASE_URL"];
const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
const perplexityKey = process.env["PERPLEXITY_API_KEY"];

if (!supabaseUrl || !serviceRoleKey || !perplexityKey) {
  throw new Error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY ve PERPLEXITY_API_KEY gerekli");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  db: { schema: "onecite" },
  auth: { autoRefreshToken: false, persistSession: false },
});

function normalize(values: number[]): number[] {
  const vector = values.slice(0, DIMS);
  if (vector.length !== DIMS)
    throw new Error(`Embedding boyutu ${vector.length}; beklenen ${DIMS}`);
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return norm > 0 ? vector.map((value) => value / norm) : vector;
}

function decodeInt8Base64(value: string): number[] {
  const bytes = Buffer.from(value, "base64");
  const values = Array.from(bytes, (byte) => (byte > 127 ? byte - 256 : byte));
  return normalize(values);
}

function parseEmbedding(row: EmbeddingRow): number[] {
  return typeof row.embedding === "string"
    ? decodeInt8Base64(row.embedding)
    : normalize(row.embedding);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestEmbeddings(inputs: string[]): Promise<number[][]> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const response = await fetch("https://api.perplexity.ai/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${perplexityKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: MODEL, input: inputs }),
    });

    if (response.ok) {
      const json = (await response.json()) as { data?: EmbeddingRow[] };
      return (json.data ?? [])
        .slice()
        .sort((a, b) => a.index - b.index)
        .map(parseEmbedding);
    }

    const body = await response.text();
    const retryAfter = Number(response.headers.get("retry-after"));
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === MAX_RETRIES) {
      throw new Error(
        `Perplexity embeddings başarısız [${response.status}]: ${body.slice(0, 500)}`,
      );
    }

    const delay =
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 1000;
    console.warn(`Perplexity ${response.status}; ${delay}ms sonra tekrar denenecek`);
    await sleep(delay);
  }

  throw new Error("Perplexity embedding retry döngüsü beklenmedik şekilde sona erdi");
}

let processed = 0;

while (true) {
  const { data, error } = await supabase
    .from("kb_chunks")
    .select("id,content,heading")
    .is("embedding", null)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) throw new Error(`NULL chunk sorgusu başarısız: ${error.message}`);
  const rows = (data ?? []) as ChunkRow[];
  if (rows.length === 0) break;

  const inputs = rows.map((row) => [row.heading, row.content].filter(Boolean).join("\n"));
  const vectors = await requestEmbeddings(inputs);
  if (vectors.length !== rows.length) {
    throw new Error(`Perplexity ${rows.length} embedding istedi, ${vectors.length} döndürdü`);
  }

  for (let index = 0; index < rows.length; index += 1) {
    const { error: updateError } = await supabase
      .from("kb_chunks")
      .update({ embedding: JSON.stringify(vectors[index]) })
      .eq("id", rows[index]!.id)
      .is("embedding", null);
    if (updateError) throw new Error(`Chunk ${rows[index]!.id} yazılamadı: ${updateError.message}`);
  }

  processed += rows.length;
  console.log(`Embedding yazıldı: ${processed} chunk`);
}

console.log(`Tamamlandı: ${processed} chunk yeniden embed edildi`);
