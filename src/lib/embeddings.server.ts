// Bilgi bankası → parça → embedding hattının sunucu tarafı yardımcıları.
const EMBEDDING_MODEL = "google/gemini-embedding-2";
const EMBEDDING_DIMS = 3072;

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

export async function embedTexts(inputs: string[]): Promise<number[][]> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key || inputs.length === 0) return [];
  const vectors: number[][] = [];
  for (let i = 0; i < inputs.length; i += 50) {
    const batch = inputs.slice(i, i + 50);
    const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Lovable-API-Key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: batch }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("Embedding error", res.status, body);
      throw new Error(`Embedding isteği başarısız [${res.status}]: ${body.slice(0, 300)}`);
    }
    const json = (await res.json()) as { data?: Array<{ index: number; embedding: number[] }> };
    const rows = (json.data ?? []).slice().sort((a, b) => a.index - b.index);
    for (const row of rows) vectors.push(row.embedding);
  }
  return vectors;
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
