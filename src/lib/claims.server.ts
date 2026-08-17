// Marka iddialari: eklenen her iddia bilgi bankasina tek bir "Marka iddialari" kaynagi olarak
// indekslenir; boylece RAG (icerik uretimi + kapsam analizi) iddialari kullanabilir.
import type { SupabaseClient } from "@supabase/supabase-js";

type AnyClient = SupabaseClient<any, any, any>;

const CLAIMS_SOURCE_TITLE = "Marka İddiaları";

export async function syncClaimsKnowledgeSource(supabase: AnyClient, brandId: string): Promise<void> {
  const { data: claims } = await supabase
    .from("claims")
    .select("statement, evidence_url")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: true });

  const rows = claims ?? [];
  const { data: existing } = await supabase
    .from("knowledge_sources")
    .select("id")
    .eq("brand_id", brandId)
    .eq("title", CLAIMS_SOURCE_TITLE)
    .maybeSingle();

  if (!rows.length) {
    if (existing?.id) {
      await supabase.from("kb_chunks").delete().eq("source_id", existing.id);
      await supabase.from("knowledge_sources").delete().eq("id", existing.id);
    }
    return;
  }

  const content = rows
    .map((row: { statement: string; evidence_url: string | null }) =>
      row.evidence_url ? `${row.statement}\nKanıt: ${row.evidence_url}` : row.statement,
    )
    .join("\n\n");

  let sourceId = existing?.id as string | undefined;
  if (sourceId) {
    await supabase.from("knowledge_sources").update({ content, index_status: "beklemede" }).eq("id", sourceId);
  } else {
    const { data: created } = await supabase
      .from("knowledge_sources")
      .insert({
        brand_id: brandId,
        title: CLAIMS_SOURCE_TITLE,
        content,
        source_type: "manual",
        status: "hazir",
        index_status: "beklemede",
      })
      .select("id")
      .single();
    sourceId = created?.id;
  }
  if (!sourceId) return;

  try {
    const { indexSource } = await import("./kb.server");
    await indexSource(supabase, sourceId, true);
  } catch (error) {
    console.error("İddia indeksleme başarısız", error);
  }
}

// Bir iddianin olcum yanitlarinda gecip gecmedigini kaba kelime ortusmesiyle tahmin eder.
export function claimEchoScore(statement: string, answer: string): number {
  const stop = new Set(["için", "ile", "olan", "olarak", "daha", "gibi", "veya", "and", "the", "bir", "bu", "de", "da", "ve"]);
  const tokens = Array.from(
    new Set(
      statement
        .toLocaleLowerCase("tr")
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((t) => t.length > 3 && !stop.has(t)),
    ),
  );
  if (!tokens.length) return 0;
  const haystack = answer.toLocaleLowerCase("tr");
  const hits = tokens.filter((t) => haystack.includes(t)).length;
  return hits / tokens.length;
}
