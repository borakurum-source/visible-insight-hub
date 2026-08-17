ALTER TABLE public.kb_chunks
  ADD COLUMN IF NOT EXISTS heading text,
  ADD COLUMN IF NOT EXISTS token_estimate integer NOT NULL DEFAULT 0;

ALTER TABLE public.kb_chunks
  ADD COLUMN IF NOT EXISTS tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', coalesce(heading,'') || ' ' || coalesce(content,''))) STORED;

CREATE INDEX IF NOT EXISTS kb_chunks_tsv_idx ON public.kb_chunks USING gin (tsv);
CREATE INDEX IF NOT EXISTS kb_chunks_brand_idx ON public.kb_chunks (brand_id);

ALTER TABLE public.knowledge_sources
  ADD COLUMN IF NOT EXISTS quality_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS noise_ratio numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS excluded boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.match_kb_chunks(
  _brand_id uuid,
  query_embedding extensions.vector,
  match_count integer DEFAULT 8,
  min_similarity double precision DEFAULT 0.18,
  per_source_limit integer DEFAULT 3
)
RETURNS TABLE(id uuid, source_id uuid, content text, heading text, source_type text, similarity double precision, score double precision)
LANGUAGE sql
STABLE
SET search_path TO 'public', 'extensions'
AS $function$
  WITH scored AS (
    SELECT
      c.id,
      c.source_id,
      c.content,
      c.heading,
      c.source_type,
      (1 - (c.embedding::extensions.halfvec(2560) OPERATOR(extensions.<=>) query_embedding::extensions.halfvec(2560)))::double precision AS similarity,
      (
        GREATEST(0, 1 - (c.embedding::extensions.halfvec(2560) OPERATOR(extensions.<=>) query_embedding::extensions.halfvec(2560)))
        * c.source_weight
        * (1.0 / (1.0 + (EXTRACT(EPOCH FROM (now() - c.updated_at)) / 86400.0) / 30.0))
      )::double precision AS score
    FROM public.kb_chunks c
    LEFT JOIN public.knowledge_sources s ON s.id = c.source_id
    WHERE c.brand_id = _brand_id
      AND c.embedding IS NOT NULL
      AND coalesce(s.excluded, false) = false
    ORDER BY c.embedding::extensions.halfvec(2560) OPERATOR(extensions.<=>) query_embedding::extensions.halfvec(2560)
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

CREATE OR REPLACE FUNCTION public.match_kb_hybrid(
  _brand_id uuid,
  query_embedding extensions.vector,
  query_text text,
  match_count integer DEFAULT 8,
  min_similarity double precision DEFAULT 0.18,
  per_source_limit integer DEFAULT 3
)
RETURNS TABLE(id uuid, source_id uuid, content text, heading text, source_type text, similarity double precision, score double precision)
LANGUAGE sql
STABLE
SET search_path TO 'public', 'extensions'
AS $function$
  WITH vector_hits AS (
    SELECT
      c.id, c.source_id, c.content, c.heading, c.source_type, c.source_weight, c.updated_at,
      (1 - (c.embedding::extensions.halfvec(2560) OPERATOR(extensions.<=>) query_embedding::extensions.halfvec(2560)))::double precision AS similarity,
      row_number() OVER (ORDER BY c.embedding::extensions.halfvec(2560) OPERATOR(extensions.<=>) query_embedding::extensions.halfvec(2560)) AS rank
    FROM public.kb_chunks c
    LEFT JOIN public.knowledge_sources s ON s.id = c.source_id
    WHERE c.brand_id = _brand_id AND c.embedding IS NOT NULL AND coalesce(s.excluded, false) = false
    ORDER BY c.embedding::extensions.halfvec(2560) OPERATOR(extensions.<=>) query_embedding::extensions.halfvec(2560)
    LIMIT GREATEST(match_count * 6, 60)
  ), text_hits AS (
    SELECT
      c.id, c.source_id, c.content, c.heading, c.source_type, c.source_weight, c.updated_at,
      0.0::double precision AS similarity,
      row_number() OVER (ORDER BY ts_rank(c.tsv, plainto_tsquery('simple', query_text)) DESC) AS rank
    FROM public.kb_chunks c
    LEFT JOIN public.knowledge_sources s ON s.id = c.source_id
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