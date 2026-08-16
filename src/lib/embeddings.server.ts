// Bilgi bankası → parça → embedding hattının sunucu tarafı yardımcıları.
// Embedding sağlayıcısı: Perplexity Embeddings API (pplx-embed-v1-4b, 2560 boyut).
const EMBEDDING_MODEL = "pplx-embed-v1-4b";
const EMBEDDING_DIMS = 2560;

export const SOURCE_WEIGHTS: Record<string, number> = {
  manual: 1.5,
  sss: 1.3,
  url: 1.0,
  sitemap: 1.0,
  pdf: 0.9,
};

export function hashText(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16);
}

export function chunkText(text: string, size = 1000, overlap = 150): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    const end = Math.min(start + size, clean.length);
    chunks.push(clean.slice(start, end));
    if (end >= clean.length) break;
    start = end - overlap;
  }
  return chunks.slice(0, 40);
}

export async function fetchPageText(url: string): Promise<string> {
  try {
    const target = url.startsWith("http") ? url : `https://${url}`;
    const res = await fetch(target, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; OneCiteBot/1.0)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 40000);
  } catch {
    return "";
  }
}

function decodeInt8Base64(b64: string): number[] {
  const binary = atob(b64);
  const out = new Array<number>(binary.length);
  let norm = 0;
  for (let i = 0; i < binary.length; i += 1) {
    const byte = binary.charCodeAt(i);
    const value = byte > 127 ? byte - 256 : byte;
    out[i] = value;
    norm += value * value;
  }
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < out.length; i += 1) out[i] = out[i]! / norm;
  return out;
}

function normalizeFloatVector(values: number[]): number[] {
  let norm = 0;
  for (const value of values) norm += value * value;
  norm = Math.sqrt(norm);
  if (!norm) return values;
  return values.map((value) => value / norm);
}

async function requestEmbeddings(batch: string[]): Promise<number[][]> {
  const key = process.env["PERPLEXITY_API_KEY"];
  if (!key) throw new Error("PERPLEXITY_API_KEY tanımlı değil");
  const res = await fetch("https://api.perplexity.ai/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: batch }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("Perplexity embedding error", res.status, body);
    if (res.status === 401 && body.includes("insufficient_quota")) {
      throw new Error(
        "Perplexity API kredisi tükendi. https://console.perplexity.ai adresinden kredi yükleyin.",
      );
    }
    throw new Error(`Embedding isteği başarısız [${res.status}]: ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    data?: Array<{ index: number; embedding: string | number[] }>;
  };
  const rows = (json.data ?? []).slice().sort((a, b) => a.index - b.index);
  return rows.map((row) =>
    typeof row.embedding === "string"
      ? decodeInt8Base64(row.embedding)
      : normalizeFloatVector(row.embedding ?? []),
  );
}

export async function embedTexts(inputs: string[]): Promise<number[][]> {
  if (inputs.length === 0) return [];
  const { hashKey, cacheGet, cacheSet, CACHE_TTL } = await import("./cache.server");

  const keys = await Promise.all(
    inputs.map((text) => hashKey("embedding", { model: EMBEDDING_MODEL, text })),
  );
  const vectors = new Array<number[] | null>(inputs.length).fill(null);
  const missing: number[] = [];

  await Promise.all(
    keys.map(async (key, index) => {
      const hit = await cacheGet<number[]>(key);
      if (hit && hit.length === EMBEDDING_DIMS) vectors[index] = hit;
      else missing.push(index);
    }),
  );

  missing.sort((a, b) => a - b);
  for (let i = 0; i < missing.length; i += 32) {
    const slice = missing.slice(i, i + 32);
    const produced = await requestEmbeddings(slice.map((index) => inputs[index]!));
    for (let j = 0; j < slice.length; j += 1) {
      const vector = produced[j];
      if (!vector) continue;
      vectors[slice[j]!] = vector;
      await cacheSet(keys[slice[j]!]!, "embedding", vector, CACHE_TTL.embedding);
    }
  }

  return vectors.filter((vector): vector is number[] => Array.isArray(vector));
}

export async function embedOne(input: string): Promise<number[] | null> {
  const [vector] = await embedTexts([input]);
  return vector ?? null;
}

export { EMBEDDING_DIMS };

// Basit güç yinelemeli PCA: yüksek boyutlu vektörleri 3B koordinata indirger.
export function projectTo3D(vectors: number[][]): Array<{ x: number; y: number; z: number }> {
  const n = vectors.length;
  if (n === 0) return [];
  const dims = vectors[0]?.length ?? 0;
  if (dims === 0) return vectors.map(() => ({ x: 0, y: 0, z: 0 }));

  const mean = new Array<number>(dims).fill(0);
  for (const v of vectors) for (let d = 0; d < dims; d += 1) mean[d]! += v[d]! / n;
  const centered = vectors.map((v) => v.map((value, d) => value - mean[d]!));

  const components: number[][] = [];
  let seed = 42;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648 - 0.5;
  };

  for (let c = 0; c < 3; c += 1) {
    let vec = Array.from({ length: dims }, () => rand());
    for (let iter = 0; iter < 24; iter += 1) {
      const next = new Array<number>(dims).fill(0);
      for (const row of centered) {
        let dot = 0;
        for (let d = 0; d < dims; d += 1) dot += row[d]! * vec[d]!;
        for (let d = 0; d < dims; d += 1) next[d]! += dot * row[d]!;
      }
      for (const prev of components) {
        let dot = 0;
        for (let d = 0; d < dims; d += 1) dot += next[d]! * prev[d]!;
        for (let d = 0; d < dims; d += 1) next[d]! -= dot * prev[d]!;
      }
      let norm = Math.sqrt(next.reduce((sum, value) => sum + value * value, 0));
      if (!norm || !Number.isFinite(norm)) { vec = Array.from({ length: dims }, () => rand()); continue; }
      norm = 1 / norm;
      vec = next.map((value) => value * norm);
    }
    components.push(vec);
  }

  const raw = centered.map((row) =>
    components.map((component) => {
      let dot = 0;
      for (let d = 0; d < dims; d += 1) dot += row[d]! * component[d]!;
      return dot;
    }),
  );

  const scale = [0, 1, 2].map((axis) => {
    const values = raw.map((r) => Math.abs(r[axis] ?? 0));
    const max = Math.max(...values, 1e-6);
    return 100 / max;
  });

  return raw.map((r) => ({
    x: (r[0] ?? 0) * scale[0]!,
    y: (r[1] ?? 0) * scale[1]!,
    z: (r[2] ?? 0) * scale[2]!,
  }));
}
