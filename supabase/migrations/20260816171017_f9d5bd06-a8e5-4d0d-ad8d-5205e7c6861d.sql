CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO authenticated, anon, service_role;
ALTER EXTENSION vector SET SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.match_kb_chunks(
  _brand_id uuid,
  query_embedding extensions.vector(3072),
  match_count int DEFAULT 8
)
RETURNS TABLE (
  id uuid,
  source_id uuid,
  content text,
  source_type text,
  similarity double precision,
  score double precision
)
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  SELECT
    c.id,
    c.source_id,
    c.content,
    c.source_type,
    (1 - (c.embedding::extensions.halfvec(3072) OPERATOR(extensions.<=>) query_embedding::extensions.halfvec(3072)))::double precision AS similarity,
    (
      GREATEST(0, 1 - (c.embedding::extensions.halfvec(3072) OPERATOR(extensions.<=>) query_embedding::extensions.halfvec(3072)))
      * c.source_weight
      * (1.0 / (1.0 + (EXTRACT(EPOCH FROM (now() - c.updated_at)) / 86400.0) / 30.0))
    )::double precision AS score
  FROM public.kb_chunks c
  WHERE c.brand_id = _brand_id
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding::extensions.halfvec(3072) OPERATOR(extensions.<=>) query_embedding::extensions.halfvec(3072)
  LIMIT match_count;
$$;

REVOKE ALL ON FUNCTION public.match_kb_chunks(uuid, extensions.vector, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_kb_chunks(uuid, extensions.vector, int) TO authenticated, service_role;