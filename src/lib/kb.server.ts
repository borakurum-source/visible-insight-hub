// RAG hattının paylaşılan sunucu mantığı: kaynak → metin → parça → embedding → kb_chunks.
import type { SupabaseClient } from "@supabase/supabase-js";
import { chunkText, embedTexts, fetchPageText, hashText, SOURCE_WEIGHTS } from "./embeddings.server";

type AnyClient = SupabaseClient<any, any, any>;

export type IndexResult = { ok: boolean; chunks: number; reason?: string };

export async function indexSource(supabase: AnyClient, sourceId: string, force = false): Promise<IndexResult> {
  const { data: source } = await supabase
    .from("knowledge_sources")
    .select("id, brand_id, title, url, content, source_type, content_hash")
    .eq("id", sourceId)
    .single();
  if (!source) throw new Error("Kaynak bulunamadı");

  const text = (source.content?.trim() || (source.url ? await fetchPageText(source.url) : "")).trim();
  if (!text) {
    await supabase
      .from("knowledge_sources")
      .update({ index_status: "hata", indexed_at: new Date().toISOString() })
      .eq("id", source.id);
    return { ok: false, chunks: 0, reason: "İçerik alınamadı" };
  }

  const hash = hashText(text);
  if (!force && source.content_hash === hash) return { ok: true, chunks: 0, reason: "İçerik değişmemiş" };

  await supabase.from("knowledge_sources").update({ index_status: "isleniyor" }).eq("id", source.id);

  const pieces = chunkText(text);
  const vectors = await embedTexts(pieces);
  if (vectors.length !== pieces.length) {
    await supabase.from("knowledge_sources").update({ index_status: "hata" }).eq("id", source.id);
    throw new Error("Embedding sayısı parça sayısıyla eşleşmedi");
  }

  await supabase.from("kb_chunks").delete().eq("source_id", source.id);
  const weight = SOURCE_WEIGHTS[source.source_type] ?? 1.0;
  const rows = pieces.map((content, index) => ({
    brand_id: source.brand_id,
    source_id: source.id,
    content,
    embedding: JSON.stringify(vectors[index]) as unknown as string,
    source_type: source.source_type,
    source_weight: weight,
    content_hash: hash,
    chunk_index: index,
  }));
  const { error } = await supabase.from("kb_chunks").insert(rows);
  if (error) throw new Error(error.message);

  await supabase
    .from("knowledge_sources")
    .update({ content_hash: hash, index_status: "hazir", chunk_count: rows.length, indexed_at: new Date().toISOString() })
    .eq("id", source.id);

  return { ok: true, chunks: rows.length };
}
