-- 2026-08-20: Perplexity pplx-embed-v1-4b MRL embeddings at vector(1024).
-- Local embedding services are intentionally not part of the self-hosted path.

-- 1) The imported kb_chunks embeddings are intentionally NULL. Re-embedding
-- happens after import and is resumable, so this conversion cannot truncate
-- user data in the migration itself.
ALTER TABLE onecite.kb_chunks
  ALTER COLUMN embedding TYPE public.vector(1024)
  USING NULL::public.vector(1024);

-- 2) Rebuild the ANN index for the new dimensionality.
DROP INDEX IF EXISTS onecite.kb_chunks_embedding_idx;
CREATE INDEX kb_chunks_embedding_idx
  ON onecite.kb_chunks
  USING hnsw (((embedding)::public.halfvec(1024)) public.halfvec_cosine_ops);

-- 3) Vector retrieval uses the same dimensionality as the application.
CREATE OR REPLACE FUNCTION onecite.match_kb_chunks(
  _brand_id uuid,
  query_embedding public.vector(1024),
  match_count integer DEFAULT 8
)
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

-- 4) Keep the five-argument retrieval overload in the same vector space.
CREATE OR REPLACE FUNCTION onecite.match_kb_chunks(
  _brand_id uuid,
  query_embedding public.vector(1024),
  match_count integer DEFAULT 8,
  min_similarity double precision DEFAULT 0.18,
  per_source_limit integer DEFAULT 3
)
RETURNS TABLE(id uuid, source_id uuid, content text, heading text, source_type text, similarity double precision, score double precision)
LANGUAGE sql
STABLE
SET search_path TO 'onecite', 'public', 'extensions'
AS $function$
  WITH scored AS (
    SELECT
      c.id,
      c.source_id,
      c.content,
      c.heading,
      c.source_type,
      (1 - (c.embedding::public.halfvec(1024) OPERATOR(public.<=>) query_embedding::public.halfvec(1024)))::double precision AS similarity,
      (
        GREATEST(0, 1 - (c.embedding::public.halfvec(1024) OPERATOR(public.<=>) query_embedding::public.halfvec(1024)))
        * c.source_weight
        * (1.0 / (1.0 + (EXTRACT(EPOCH FROM (now() - c.updated_at)) / 86400.0) / 30.0))
      )::double precision AS score
    FROM onecite.kb_chunks c
    LEFT JOIN onecite.knowledge_sources s ON s.id = c.source_id
    WHERE c.brand_id = _brand_id
      AND c.embedding IS NOT NULL
      AND coalesce(s.excluded, false) = false
    ORDER BY c.embedding::public.halfvec(1024) OPERATOR(public.<=>) query_embedding::public.halfvec(1024)
    LIMIT GREATEST(match_count * 6, 60)
  ), ranked AS (
    SELECT scored.*,
      row_number() OVER (PARTITION BY coalesce(scored.source_id, scored.id) ORDER BY scored.score DESC) AS source_rank
    FROM scored
    WHERE scored.similarity >= min_similarity
  )
  SELECT ranked.id, ranked.source_id, ranked.content, ranked.heading, ranked.source_type, ranked.similarity, ranked.score
  FROM ranked
  WHERE ranked.source_rank <= per_source_limit
  ORDER BY ranked.score DESC
  LIMIT match_count;
$function$;

-- 5) The application also calls the hybrid RPC; leave no 2560-dimensional
-- function active after the column conversion.
CREATE OR REPLACE FUNCTION onecite.match_kb_hybrid(
  _brand_id uuid,
  query_embedding public.vector(1024),
  query_text text,
  match_count integer DEFAULT 8,
  min_similarity double precision DEFAULT 0.18,
  per_source_limit integer DEFAULT 3
)
RETURNS TABLE(id uuid, source_id uuid, content text, heading text, source_type text, similarity double precision, score double precision)
LANGUAGE sql
STABLE
SET search_path TO 'onecite', 'public', 'extensions'
AS $function$
  WITH vector_hits AS (
    SELECT
      c.id, c.source_id, c.content, c.heading, c.source_type, c.source_weight, c.updated_at,
      (1 - (c.embedding::public.halfvec(1024) OPERATOR(public.<=>) query_embedding::public.halfvec(1024)))::double precision AS similarity,
      row_number() OVER (ORDER BY c.embedding::public.halfvec(1024) OPERATOR(public.<=>) query_embedding::public.halfvec(1024)) AS rank
    FROM onecite.kb_chunks c
    LEFT JOIN onecite.knowledge_sources s ON s.id = c.source_id
    WHERE c.brand_id = _brand_id AND c.embedding IS NOT NULL AND coalesce(s.excluded, false) = false
    ORDER BY c.embedding::public.halfvec(1024) OPERATOR(public.<=>) query_embedding::public.halfvec(1024)
    LIMIT GREATEST(match_count * 6, 60)
  ), text_hits AS (
    SELECT
      c.id, c.source_id, c.content, c.heading, c.source_type, c.source_weight, c.updated_at,
      0.0::double precision AS similarity,
      row_number() OVER (ORDER BY ts_rank(c.tsv, plainto_tsquery('simple', query_text)) DESC) AS rank
    FROM onecite.kb_chunks c
    LEFT JOIN onecite.knowledge_sources s ON s.id = c.source_id
    WHERE c.brand_id = _brand_id
      AND coalesce(s.excluded, false) = false
      AND query_text IS NOT NULL
      AND length(btrim(query_text)) > 0
      AND c.tsv @@ plainto_tsquery('simple', query_text)
    ORDER BY ts_rank(c.tsv, plainto_tsquery('simple', query_text)) DESC
    LIMIT GREATEST(match_count * 4, 40)
  ), fused AS (
    SELECT
      coalesce(v.id, t.id) AS id,
      coalesce(v.source_id, t.source_id) AS source_id,
      coalesce(v.content, t.content) AS content,
      coalesce(v.heading, t.heading) AS heading,
      coalesce(v.source_type, t.source_type) AS source_type,
      coalesce(v.similarity, 0)::double precision AS similarity,
      (
        (coalesce(1.0 / (60 + v.rank), 0) + coalesce(1.0 / (60 + t.rank), 0))
        * coalesce(v.source_weight, t.source_weight, 1.0)
        * (1.0 / (1.0 + (EXTRACT(EPOCH FROM (now() - coalesce(v.updated_at, t.updated_at))) / 86400.0) / 30.0))
      )::double precision AS score
    FROM vector_hits v
    FULL OUTER JOIN text_hits t ON t.id = v.id
  ), ranked AS (
    SELECT fused.*, row_number() OVER (PARTITION BY coalesce(fused.source_id, fused.id) ORDER BY fused.score DESC) AS source_rank
    FROM fused
    WHERE fused.similarity >= min_similarity OR fused.similarity = 0
  )
  SELECT ranked.id, ranked.source_id, ranked.content, ranked.heading, ranked.source_type, ranked.similarity, ranked.score
  FROM ranked
  WHERE ranked.source_rank <= per_source_limit
  ORDER BY ranked.score DESC
  LIMIT match_count;
$function$;

-- 6) Re-indexing is performed separately and can resume from NULL embeddings.
UPDATE onecite.knowledge_sources
SET index_status = 'beklemede', chunk_count = 0
WHERE index_status = 'done';
