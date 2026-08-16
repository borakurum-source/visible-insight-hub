// Sunucu tarafı yanıt önbelleği: aynı istek için tekrar tekrar dış API çağırmayı önler.
// Kayıtlar public.ai_cache tablosunda tutulur (yalnızca service_role erişir).

type CacheKind = "perplexity" | "measurement" | "embedding" | "deepseek";

const memory = new Map<string, { value: unknown; expiresAt: number }>();
const MEMORY_LIMIT = 500;

export async function hashKey(kind: CacheKind, payload: unknown): Promise<string> {
  const raw = `${kind}:${JSON.stringify(payload)}`;
  const bytes = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${kind}:${hex}`;
}

function memoryGet<T>(key: string): T | null {
  const hit = memory.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    memory.delete(key);
    return null;
  }
  return hit.value as T;
}

function memorySet(key: string, value: unknown, ttlSeconds: number) {
  if (memory.size > MEMORY_LIMIT) memory.clear();
  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

async function admin() {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return supabaseAdmin;
  } catch {
    return null;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const local = memoryGet<T>(key);
  if (local !== null) return local;
  const db = await admin();
  if (!db) return null;
  try {
    const { data } = await db
      .from("ai_cache")
      .select("payload, expires_at")
      .eq("cache_key", key)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (!data) return null;
    const value = (data.payload as { v: T } | null)?.v ?? null;
    if (value === null) return null;
    memorySet(key, value, 300);
    return value;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, kind: CacheKind, value: unknown, ttlSeconds: number): Promise<void> {
  memorySet(key, value, Math.min(ttlSeconds, 300));
  const db = await admin();
  if (!db) return;
  try {
    await db.from("ai_cache").upsert(
      {
        cache_key: key,
        kind,
        payload: { v: value },
        expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
      },
      { onConflict: "cache_key" },
    );
  } catch {
    /* önbellek yazımı kritik değil */
  }
}

// Ortak sarmalayıcı: önbellekte varsa döner, yoksa üretir ve saklar.
export async function withCache<T>(
  kind: CacheKind,
  keyPayload: unknown,
  ttlSeconds: number,
  produce: () => Promise<T>,
  shouldCache: (value: T) => boolean = () => true,
): Promise<T> {
  const key = await hashKey(kind, keyPayload);
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;
  const value = await produce();
  if (shouldCache(value)) await cacheSet(key, kind, value, ttlSeconds);
  return value;
}

export const CACHE_TTL = {
  perplexity: 60 * 60 * 12, // 12 saat
  measurement: 60 * 60 * 6, // 6 saat
  embedding: 60 * 60 * 24 * 30, // 30 gün
  deepseek: 60 * 60 * 24, // 1 gün
} as const;
