-- 2026-08-20: Embedding sağlayıcısı Perplexity pplx-embed-v1-4b (2560 boyut)
-- → yerel AI gateway bge-m3 (1024 boyut, self-hosted Ollama).
--
-- kb_chunks önceki migrasyonda (20260816192135) boşaltıldığı için veri kaybı
-- yok; kolon tipi, HNSW indeksi ve match fonksiyonu 1024'e geçer. Yeniden
-- indeksleme kuyruğa alınır (LOCAL_AI_KEY tanımlı ortamda bge-m3 ile dolar).

-- 1) Kolon tipi: vector(2560) → vector(1024) (boş tablo, USING NULL güvenli)
ALTER TABLE onecite.kb_chunks ALTER COLUMN embedding TYPE public.vector(1024) USING NULL::public.vector(1024);

-- 2) HNSW indeksi: halfvec(2560) → halfvec(1024)
DROP INDEX IF EXISTS onecite.kb_chunks_embedding_idx;
CREATE INDEX kb_chunks_embedding_idx ON onecite.kb_chunks USING hnsw (((embedding)::public.halfvec(1024)) public.halfvec_cosine_ops);

-- 3) match fonksiyonu: 1024 boyut (skor formülü korunur: cosine × source_weight × freshness)
CREATE OR REPLACE FUNCTION onecite.match_kb_chunks(_brand_id uuid, query_embedding public.vector, match_count integer DEFAULT 8)
RETURNS TABLE(id uuid, source_id uuid, content text, source_type text, similarity double precision, score double precision)
LANGUAGE sql
STABLE
SET search_path TO 'onecite', 'public', 'extensions'
AS $function$
  SELECT
    c.id,
    c.source_id,
    c.content,
    c.source_type,
    (1 - (c.embedding::public.halfvec(1024) OPERATOR(public.<=>) query_embedding::public.halfvec(1024)))::double precision AS similarity,
    (
      GREATEST(0, 1 - (c.embedding::public.halfvec(1024) OPERATOR(public.<=>) query_embedding::public.halfvec(1024)))
      * c.source_weight
      * (1.0 / (1.0 + (EXTRACT(EPOCH FROM (now() - c.updated_at)) / 86400.0) / 30.0))
    )::double precision AS score
  FROM onecite.kb_chunks c
  WHERE c.brand_id = _brand_id
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding::public.halfvec(1024) OPERATOR(public.<=>) query_embedding::public.halfvec(1024)
  LIMIT match_count;
$function$;

-- 4) Yeniden indeksleme kuyruğu (garanti: done olan kaynaklar da yeniden işlensin)
UPDATE onecite.knowledge_sources SET index_status = 'beklemede', chunk_count = 0 WHERE index_status = 'done';
