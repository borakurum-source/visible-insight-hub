// RAG hattının paylaşılan sunucu mantığı: kaynak → temiz metin → parça → embedding → kb_chunks.
import type { SupabaseClient } from "@supabase/supabase-js";
import { chunkStructured, embedTexts, hashText, weightFor, withContext } from "./embeddings.server";
import { extractFromHtml, fetchExtracted } from "./extract.server";

type AnyClient = SupabaseClient<any, any, any>;

export type IndexResult = {
  ok: boolean;
  chunks: number;
  reason?: string;
  qualityScore?: number;
  noiseRatio?: number;
};

export type BrandEeatSignals = {
  scope?: string | null;
  naming_aliases?: unknown;
  voice_notes?: string | null;
  author_profiles?: unknown;
  experience_role_type?: string | null;
  experience_methodologies?: unknown;
  leadership?: unknown;
  partnerships?: unknown;
  external_recognition?: unknown;
  content_owner_type?: string | null;
  review_cadence?: string | null;
  data_sourcing_notes?: string | null;
  disclosure_policy?: string | null;
  testimonials?: unknown;
  third_party_reviews?: unknown;
  external_citations?: unknown;
  ai_disclosure_note?: string | null;
  default_schema_types?: unknown;
};

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

/**
 * Dolu olmayan E-E-A-T alanları için hiç satır üretmez — modelin boş alanı
 * "bilgi" sanıp uydurmasını önlemek amacıyla, sadece gerçekten dolu olan
 * alanlar promptun user mesajına eklenir.
 */
export function buildBrandSignalsBlock(intel: BrandEeatSignals | null | undefined): string {
  if (!intel) return "";
  const lines: string[] = [];

  if (intel.scope) lines.push(`- Etki alanı: ${intel.scope}`);
  const aliases = asStringList(intel.naming_aliases);
  if (aliases.length) lines.push(`- Marka takma adları: ${aliases.join(", ")}`);
  if (intel.voice_notes) lines.push(`- Marka sesi: ${intel.voice_notes}`);

  const authors = asStringList(intel.author_profiles);
  if (authors.length) lines.push(`- Yazar profilleri: ${authors.join("; ")}`);
  if (intel.experience_role_type) lines.push(`- Deneyim rolü: ${intel.experience_role_type}`);
  const methodologies = asStringList(intel.experience_methodologies);
  if (methodologies.length) lines.push(`- Metodolojiler: ${methodologies.join("; ")}`);
  const leadership = asStringList(intel.leadership);
  if (leadership.length) lines.push(`- Liderlik: ${leadership.join("; ")}`);
  const partnerships = asStringList(intel.partnerships);
  if (partnerships.length) lines.push(`- Ortaklıklar: ${partnerships.join("; ")}`);
  const recognition = asStringList(intel.external_recognition);
  if (recognition.length) lines.push(`- Dış tanınırlık: ${recognition.join("; ")}`);

  if (intel.content_owner_type) lines.push(`- İçerik sahipliği: ${intel.content_owner_type}`);
  if (intel.review_cadence) lines.push(`- İnceleme sıklığı: ${intel.review_cadence}`);
  if (intel.data_sourcing_notes) lines.push(`- Veri kaynağı notları: ${intel.data_sourcing_notes}`);
  if (intel.disclosure_policy) lines.push(`- Açıklama politikası: ${intel.disclosure_policy}`);
  if (intel.ai_disclosure_note) lines.push(`- AI açıklama notu: ${intel.ai_disclosure_note}`);

  const testimonials = asStringList(intel.testimonials);
  if (testimonials.length) lines.push(`- Referanslar: ${testimonials.join("; ")}`);
  const thirdPartyReviews = asStringList(intel.third_party_reviews);
  if (thirdPartyReviews.length) lines.push(`- Üçüncü taraf incelemeler: ${thirdPartyReviews.join("; ")}`);
  const citations = asStringList(intel.external_citations);
  if (citations.length) lines.push(`- Dış atıflar: ${citations.join("; ")}`);

  if (!lines.length) return "";
  return `Marka E-E-A-T sinyalleri (yalnızca aşağıdakileri kullan, eksik olanı uydurma):\n${lines.join("\n")}`;
}

/** Sabit genislikte paralel havuz: sayfalari tek tek beklemek yerine 4'lu isler. */
export async function runPool<T, R>(items: T[], size: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]!);
    }
  });
  await Promise.all(runners);
  return results;
}

// Parçanın kanıt değeri: sayı, tarih, oran, isim gibi doğrulanabilir sinyaller puan getirir.
function evidenceScore(text: string): number {
  let score = 40;
  if (/\d{1,3}[.,]?\d*\s?(%|tl|usd|eur|\$|₺)/i.test(text)) score += 15;
  if (/\b(19|20)\d{2}\b/.test(text)) score += 10;
  if (/\b\d+\b/.test(text)) score += 8;
  if (/https?:\/\//.test(text)) score += 5;
  if (text.length > 400) score += 10;
  if (/[.!?]/.test(text)) score += 5;
  // Pazarlama klişeleri kanıt değeri taşımaz.
  if (/(lider|en iyi|numara bir|müthiş|muhtesem|mükemmel|world class)/i.test(text)) score -= 8;
  return Math.max(0, Math.min(100, score));
}

export async function indexSource(supabase: AnyClient, sourceId: string, force = false): Promise<IndexResult> {
  const { data: source } = await supabase
    .from("knowledge_sources")
    .select("id, brand_id, title, url, content, source_type, content_hash, etag, last_modified")
    .eq("id", sourceId)
    .single();
  if (!source) throw new Error("Kaynak bulunamadı");

  let text = "";
  let noiseRatio = 0;
  let structured = "";
  let pageTitle = source.title as string;
  let method: "static" | "render" | "manual" = "manual";
  let etag: string | null = null;
  let lastModified: string | null = null;
  const checkedAt = new Date().toISOString();

  const manual = (source.content ?? "").trim();
  if (manual) {
    // Elle girilen içerik HTML ise yine temizlenir, düz metinse olduğu gibi kullanılır.
    if (/<\/?[a-z][\s\S]*>/i.test(manual)) {
      const page = extractFromHtml(manual);
      text = page.text;
      structured = page.structured;
      noiseRatio = page.noiseRatio;
    } else {
      text = manual;
    }
  } else if (source.url) {
    const outcome = await fetchExtracted(source.url, {
      // Zorunlu yeniden indekslemede koşullu istek atlanır.
      etag: force ? null : (source.etag as string | null),
      lastModified: force ? null : (source.last_modified as string | null),
    });

    if (outcome.status === "not-modified") {
      await supabase
        .from("knowledge_sources")
        .update({ last_checked_at: checkedAt })
        .eq("id", source.id);
      return { ok: true, chunks: 0, reason: "Sayfa değişmemiş" };
    }
    if (outcome.status === "ok") {
      text = outcome.page.text;
      structured = outcome.page.structured;
      noiseRatio = outcome.page.noiseRatio;
      method = outcome.page.method;
      etag = outcome.page.etag ?? null;
      lastModified = outcome.page.lastModified ?? null;
      if (outcome.page.title) pageTitle = outcome.page.title;
    } else {
      await supabase
        .from("knowledge_sources")
        .update({
          index_status: "hata",
          extract_method: outcome.status === "empty" ? "js-required" : "error",
          last_checked_at: checkedAt,
          indexed_at: checkedAt,
        })
        .eq("id", source.id);
      return { ok: false, chunks: 0, reason: outcome.reason };
    }
  }

  const combined = [structured, text].filter(Boolean).join("\n\n").trim();
  if (!combined) {
    await supabase
      .from("knowledge_sources")
      .update({ index_status: "hata", last_checked_at: checkedAt, indexed_at: checkedAt })
      .eq("id", source.id);
    return { ok: false, chunks: 0, reason: "İçerik alınamadı" };
  }

  const hash = hashText(combined);
  if (!force && source.content_hash === hash) return { ok: true, chunks: 0, reason: "İçerik değişmemiş" };

  await supabase.from("knowledge_sources").update({ index_status: "isleniyor" }).eq("id", source.id);

  const chunks = chunkStructured(combined);
  if (!chunks.length) {
    await supabase.from("knowledge_sources").update({ index_status: "hata" }).eq("id", source.id);
    return { ok: false, chunks: 0, reason: "Anlamlı içerik bulunamadı" };
  }

  const inputs = chunks.map((chunk) => withContext(chunk, pageTitle));
  const vectors = await embedTexts(inputs);
  if (vectors.length !== chunks.length) {
    await supabase.from("knowledge_sources").update({ index_status: "hata" }).eq("id", source.id);
    throw new Error("Embedding sayısı parça sayısıyla eşleşmedi");
  }

  await supabase.from("kb_chunks").delete().eq("source_id", source.id);
  const weight = weightFor(source.source_type, source.url);
  const scores: number[] = [];
  const rows = chunks.map((chunk, index) => {
    const score = evidenceScore(chunk.content);
    scores.push(score);
    return {
      brand_id: source.brand_id,
      source_id: source.id,
      content: chunk.content,
      heading: chunk.heading || null,
      token_estimate: Math.round(chunk.content.length / 4),
      embedding: JSON.stringify(vectors[index]) as unknown as string,
      source_type: source.source_type,
      // Kanıt değeri yüksek parçalar aramada bir tık öne çıkar.
      source_weight: Number((weight * (0.85 + (score / 100) * 0.3)).toFixed(3)),
      content_hash: hash,
      chunk_index: index,
    };
  });
  const { error } = await supabase.from("kb_chunks").insert(rows);
  if (error) throw new Error(error.message);

  const qualityScore = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);

  await supabase
    .from("knowledge_sources")
    .update({
      content_hash: hash,
      index_status: "hazir",
      chunk_count: rows.length,
      quality_score: qualityScore,
      noise_ratio: Number(noiseRatio.toFixed(3)),
      extract_method: method,
      etag,
      last_modified: lastModified,
      last_checked_at: checkedAt,
      indexed_at: checkedAt,
    })
    .eq("id", source.id);

  return { ok: true, chunks: rows.length, qualityScore, noiseRatio };
}
