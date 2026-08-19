// Vektor tabanli prompt <-> sorgu eslestirme.
// Birincil yontem: embedding kosinus benzerligi. Yedek: kelime ortusmesi (Jaccard).
// Embeddingler ai_cache tablosunda kalici olarak onbelleklenir (embeddings.server -> cache.server),
// bu yuzden ayni metin ikinci kez ucretlendirilmez; bellek ici onbellek tek basina yeterli degildir.
import { MATCHING } from "./config";
import { similarity as jaccard } from "./engine";

export type MatchMethod = "vector" | "jaccard";

export type MatchResult = {
  index: number;
  score: number;
  method: MatchMethod;
  borderline: boolean;
};

function normalize(text: string): string {
  return text
    .toLocaleLowerCase("tr")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(text: string): Set<string> {
  return new Set(normalize(text).split(" ").filter((word) => word.length > 2));
}

function trigrams(text: string): Set<string> {
  const clean = normalize(text).replace(/\s/g, "");
  const out = new Set<string>();
  for (let i = 0; i + 3 <= clean.length; i += 1) out.add(clean.slice(i, i + 3));
  return out;
}

function overlapRatio(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  a.forEach((item) => { if (b.has(item)) shared += 1; });
  return shared / Math.min(a.size, b.size);
}

/**
 * Kaba on filtre: O(aday x sorgu) kosinus hesabini onlemek icin
 * her aday icin en umut verici sorgu indekslerini dondurur.
 */
export function prefilterCandidates(
  candidate: string,
  queries: string[],
  limit = MATCHING.prefilterCandidates,
): number[] {
  const candTokens = tokenSet(candidate);
  const candGrams = trigrams(candidate);
  return queries
    .map((query, index) => {
      const tokenScore = overlapRatio(candTokens, tokenSet(query));
      const gramScore = overlapRatio(candGrams, trigrams(query));
      return { index, score: Math.max(tokenScore, gramScore * 0.9) };
    })
    .filter((row) => row.score >= MATCHING.prefilterMinScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.index);
}

export function cosine(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  if (!length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < length; i += 1) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function thresholdsFor(language?: string) {
  const override = language ? MATCHING.languageOverrides[language] : undefined;
  return {
    gscMatch: override?.gscMatch ?? MATCHING.gscMatch,
    measuredPromptMatch: override?.measuredPromptMatch ?? MATCHING.measuredPromptMatch,
  };
}

/** Metinleri vektore cevirir; hata halinde null doner (Jaccard yedegine dusulur). */
export async function embedAll(texts: string[]): Promise<Map<string, number[]> | null> {
  const unique = [...new Set(texts.map(normalize).filter(Boolean))];
  if (!unique.length) return new Map();
  try {
    const { embedTexts } = await import("../embeddings.server");
    const vectors = await embedTexts(unique);
    if (vectors.length !== unique.length) return null;
    const map = new Map<string, number[]>();
    unique.forEach((text, index) => {
      const vector = vectors[index];
      if (vector) map.set(text, vector);
    });
    return map;
  } catch (error) {
    console.warn("[prompt-demand] embedding üretilemedi, Jaccard yedeğine düşülüyor", error);
    return null;
  }
}

/**
 * Bir aday icin en iyi eslesmeyi bulur.
 * vectors null ise Jaccard yedegi ve onun esikleri kullanilir.
 */
export function bestMatch(
  candidate: string,
  queries: string[],
  vectors: Map<string, number[]> | null,
  threshold: number,
  jaccardThreshold: number,
): MatchResult | null {
  const pool = prefilterCandidates(candidate, queries);
  const searchSpace = pool.length ? pool : queries.map((_, index) => index);
  const candVector = vectors?.get(normalize(candidate)) ?? null;

  let best: MatchResult | null = null;
  for (const index of searchSpace) {
    const query = queries[index];
    if (!query) continue;
    const queryVector = vectors?.get(normalize(query)) ?? null;
    const useVector = Boolean(candVector && queryVector);
    const score = useVector ? cosine(candVector!, queryVector!) : jaccard(candidate, query);
    const method: MatchMethod = useVector ? "vector" : "jaccard";
    if (!best || score > best.score) {
      best = { index, score, method, borderline: false };
    }
  }
  if (!best) return null;
  const limit = best.method === "vector" ? threshold : jaccardThreshold;
  if (best.score < limit) return null;
  best.borderline = best.score - limit <= MATCHING.borderlineMargin;
  if (best.borderline) {
    console.warn(
      `[prompt-demand] sınırda eşleşme: "${candidate}" ↔ "${queries[best.index]}" skor=${best.score.toFixed(3)} eşik=${limit}`,
    );
  }
  return best;
}
