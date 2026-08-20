CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Knowledge base chunks (embeddings)
CREATE TABLE onecite.kb_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES onecite.brands(id) ON DELETE CASCADE,
  source_id uuid REFERENCES onecite.knowledge_sources(id) ON DELETE CASCADE,
  content text NOT NULL,
  embedding vector(3072),
  source_type text NOT NULL DEFAULT 'url',
  source_weight numeric NOT NULL DEFAULT 1.0,
  content_hash text NOT NULL DEFAULT '',
  chunk_index integer NOT NULL DEFAULT 0,
  x double precision,
  y double precision,
  z double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON onecite.kb_chunks TO authenticated;
GRANT ALL ON onecite.kb_chunks TO service_role;
ALTER TABLE onecite.kb_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY kb_chunks_all ON onecite.kb_chunks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = kb_chunks.brand_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = kb_chunks.brand_id AND m.user_id = auth.uid()));

CREATE INDEX kb_chunks_brand_idx ON onecite.kb_chunks (brand_id);
CREATE INDEX kb_chunks_source_idx ON onecite.kb_chunks (source_id);
CREATE INDEX kb_chunks_embedding_idx ON onecite.kb_chunks USING hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);

CREATE TRIGGER kb_chunks_updated_at BEFORE UPDATE ON onecite.kb_chunks
  FOR EACH ROW EXECUTE FUNCTION onecite.update_updated_at_column();

-- 2. Graph entities
CREATE TABLE onecite.graph_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES onecite.brands(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  entity_type text NOT NULL DEFAULT 'konu',
  weight numeric NOT NULL DEFAULT 1.0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON onecite.graph_entities TO authenticated;
GRANT ALL ON onecite.graph_entities TO service_role;
ALTER TABLE onecite.graph_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY graph_entities_all ON onecite.graph_entities FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = graph_entities.brand_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = graph_entities.brand_id AND m.user_id = auth.uid()));

CREATE TRIGGER graph_entities_updated_at BEFORE UPDATE ON onecite.graph_entities
  FOR EACH ROW EXECUTE FUNCTION onecite.update_updated_at_column();

-- 3. Graph edges
CREATE TABLE onecite.graph_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES onecite.brands(id) ON DELETE CASCADE,
  source_key text NOT NULL,
  target_key text NOT NULL,
  relation text NOT NULL DEFAULT 'ilişkili',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, source_key, target_key, relation)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON onecite.graph_edges TO authenticated;
GRANT ALL ON onecite.graph_edges TO service_role;
ALTER TABLE onecite.graph_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY graph_edges_all ON onecite.graph_edges FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = graph_edges.brand_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = graph_edges.brand_id AND m.user_id = auth.uid()));

-- 4. Content drafts
CREATE TABLE onecite.content_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES onecite.brands(id) ON DELETE CASCADE,
  prompt_id uuid REFERENCES onecite.prompts(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  target_prompt text,
  status text NOT NULL DEFAULT 'taslak',
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  word_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON onecite.content_drafts TO authenticated;
GRANT ALL ON onecite.content_drafts TO service_role;
ALTER TABLE onecite.content_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY content_drafts_all ON onecite.content_drafts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = content_drafts.brand_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = content_drafts.brand_id AND m.user_id = auth.uid()));

CREATE TRIGGER content_drafts_updated_at BEFORE UPDATE ON onecite.content_drafts
  FOR EACH ROW EXECUTE FUNCTION onecite.update_updated_at_column();

-- 5. knowledge_sources indexing metadata
ALTER TABLE onecite.knowledge_sources
  ADD COLUMN IF NOT EXISTS content_hash text,
  ADD COLUMN IF NOT EXISTS index_status text NOT NULL DEFAULT 'bekliyor',
  ADD COLUMN IF NOT EXISTS chunk_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS indexed_at timestamptz;

-- 6. Semantic match function (brand scoped, RLS-safe via invoker rights)
CREATE OR REPLACE FUNCTION onecite.match_kb_chunks(
  _brand_id uuid,
  query_embedding vector(3072),
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
    (1 - (c.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)))::double precision AS similarity,
    (
      GREATEST(0, 1 - (c.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)))
      * c.source_weight
      * (1.0 / (1.0 + (EXTRACT(EPOCH FROM (now() - c.updated_at)) / 86400.0) / 30.0))
    )::double precision AS score
  FROM onecite.kb_chunks c
  WHERE c.brand_id = _brand_id
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)
  LIMIT match_count;
$$;

REVOKE ALL ON FUNCTION onecite.match_kb_chunks(uuid, vector, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION onecite.match_kb_chunks(uuid, vector, int) TO authenticated, service_role;