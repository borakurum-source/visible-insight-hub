CREATE TABLE IF NOT EXISTS public.ai_cache (
  cache_key text PRIMARY KEY,
  kind text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
GRANT ALL ON public.ai_cache TO service_role;
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS ai_cache_expires_idx ON public.ai_cache (expires_at);

DROP INDEX IF EXISTS public.kb_chunks_embedding_idx;
DELETE FROM public.kb_chunks;
ALTER TABLE public.kb_chunks ALTER COLUMN embedding TYPE extensions.vector(2560) USING NULL::extensions.vector(2560);
CREATE INDEX kb_chunks_embedding_idx ON public.kb_chunks USING hnsw (((embedding)::extensions.halfvec(2560)) extensions.halfvec_cosine_ops);
UPDATE public.knowledge_sources SET index_status = 'beklemede', chunk_count = 0, content_hash = NULL;

CREATE OR REPLACE FUNCTION public.match_kb_chunks(_brand_id uuid, query_embedding extensions.vector, match_count integer DEFAULT 8)
RETURNS TABLE(id uuid, source_id uuid, content text, source_type text, similarity double precision, score double precision)
LANGUAGE sql
STABLE
SET search_path TO 'public', 'extensions'
AS $function$
  SELECT
    c.id,
    c.source_id,
    c.content,
    c.source_type,
    (1 - (c.embedding::extensions.halfvec(2560) OPERATOR(extensions.<=>) query_embedding::extensions.halfvec(2560)))::double precision AS similarity,
    (
      GREATEST(0, 1 - (c.embedding::extensions.halfvec(2560) OPERATOR(extensions.<=>) query_embedding::extensions.halfvec(2560)))
      * c.source_weight
      * (1.0 / (1.0 + (EXTRACT(EPOCH FROM (now() - c.updated_at)) / 86400.0) / 30.0))
    )::double precision AS score
  FROM public.kb_chunks c
  WHERE c.brand_id = _brand_id
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding::extensions.halfvec(2560) OPERATOR(extensions.<=>) query_embedding::extensions.halfvec(2560)
  LIMIT match_count;
$function$;