CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO authenticated, anon, service_role;
-- (skipped: pgvector already lives in public on this shared self-hosted cluster; do not move a shared extension) ALTER EXTENSION vector SET SCHEMA extensions;

CREATE OR REPLACE FUNCTION onecite.match_kb_chunks(
  _brand_id uuid,
  query_embedding public.vector(3072),
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
SET search_path = onecite, public, extensions
AS $$
  SELECT
    c.id,
    c.source_id,
    c.content,
    c.source_type,
    (1 - (c.embedding::public.halfvec(3072) OPERATOR(public.<=>) query_embedding::public.halfvec(3072)))::double precision AS similarity,
    (
      GREATEST(0, 1 - (c.embedding::public.halfvec(3072) OPERATOR(public.<=>) query_embedding::public.halfvec(3072)))
      * c.source_weight
      * (1.0 / (1.0 + (EXTRACT(EPOCH FROM (now() - c.updated_at)) / 86400.0) / 30.0))
    )::double precision AS score
  FROM onecite.kb_chunks c
  WHERE c.brand_id = _brand_id
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding::public.halfvec(3072) OPERATOR(public.<=>) query_embedding::public.halfvec(3072)
  LIMIT match_count;
$$;

REVOKE ALL ON FUNCTION onecite.match_kb_chunks(uuid, public.vector, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION onecite.match_kb_chunks(uuid, public.vector, int) TO authenticated, service_role;