-- OneCite Outcome OS: durable research, canonical evidence and fenced jobs.

INSERT INTO storage.buckets (id, name)
VALUES ('research-artifacts', 'research-artifacts')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- No authenticated storage.objects policy is created for this bucket. The worker writes with
-- service_role; customer access is mediated by brand-scoped application APIs.

CREATE TABLE onecite.research_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES onecite.brands(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'visibility' CHECK (kind IN ('visibility','demand_discovery','competitor','brand_memory','report','onboarding')),
  trigger text NOT NULL DEFAULT 'user' CHECK (trigger IN ('user','cron','onboarding','api')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed','cancelled','partial')),
  measurement_mode text NOT NULL DEFAULT 'full' CHECK (measurement_mode IN ('full','single','discovery','onboarding','remeasure')),
  manifest jsonb NOT NULL DEFAULT '{}'::jsonb,
  prompt_set_hash text,
  confidence numeric CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  coverage numeric CHECK (coverage IS NULL OR coverage BETWEEN 0 AND 1),
  total_cost_usd numeric NOT NULL DEFAULT 0,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid DEFAULT auth.uid(),
  legacy_source text,
  legacy_source_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (legacy_source, legacy_source_id)
);

CREATE TABLE onecite.research_run_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES onecite.brands(id) ON DELETE CASCADE,
  run_id uuid NOT NULL REFERENCES onecite.research_runs(id) ON DELETE CASCADE,
  stage text NOT NULL,
  ordinal integer NOT NULL CHECK (ordinal BETWEEN 1 AND 12),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed','skipped')),
  attempt_count integer NOT NULL DEFAULT 0,
  model_id text,
  preset text,
  tools text[] NOT NULL DEFAULT '{}',
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  cost_usd numeric NOT NULL DEFAULT 0,
  latency_ms integer,
  fallback_from text,
  schema_valid boolean,
  error jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, ordinal)
);

CREATE TABLE onecite.orchestrator_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES onecite.brands(id) ON DELETE CASCADE,
  run_id uuid REFERENCES onecite.research_runs(id) ON DELETE CASCADE,
  job_type text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','retry','completed','failed','cancelled')),
  stage text NOT NULL DEFAULT 'project_definition',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3 CHECK (max_attempts BETWEEN 1 AND 10),
  claim_token uuid,
  claimed_by text,
  lease_expires_at timestamptz,
  heartbeat_at timestamptz,
  available_at timestamptz NOT NULL DEFAULT now(),
  idempotency_key text NOT NULL,
  trigger text NOT NULL DEFAULT 'user' CHECK (trigger IN ('user','cron','onboarding','api')),
  stage_metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_error jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  UNIQUE (brand_id, idempotency_key)
);

CREATE TABLE onecite.research_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES onecite.brands(id) ON DELETE CASCADE,
  run_id uuid NOT NULL REFERENCES onecite.research_runs(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES onecite.research_run_stages(id) ON DELETE SET NULL,
  artifact_type text NOT NULL,
  storage_path text,
  mime_type text,
  sha256 text,
  size_bytes bigint,
  inline_payload jsonb,
  provenance text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (storage_path IS NOT NULL OR inline_payload IS NOT NULL)
);

CREATE TABLE onecite.evidence_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES onecite.brands(id) ON DELETE CASCADE,
  run_id uuid REFERENCES onecite.research_runs(id) ON DELETE SET NULL,
  canonical_url text NOT NULL,
  original_url text NOT NULL,
  domain text NOT NULL,
  title text,
  source_type text NOT NULL DEFAULT 'web',
  provenance text NOT NULL CHECK (provenance IN ('perplexity_search','perplexity_fetch','firecrawl_map','firecrawl_crawl','firecrawl_scrape','firecrawl_monitor','legacy')),
  content_hash text NOT NULL,
  http_status integer,
  author text,
  published_at timestamptz,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, canonical_url, content_hash)
);

CREATE TABLE onecite.evidence_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES onecite.brands(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES onecite.evidence_sources(id) ON DELETE CASCADE,
  ordinal integer NOT NULL,
  content text NOT NULL,
  content_hash text NOT NULL,
  embedding vector(1024),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, ordinal)
);

CREATE TABLE onecite.evidence_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES onecite.brands(id) ON DELETE CASCADE,
  run_id uuid REFERENCES onecite.research_runs(id) ON DELETE SET NULL,
  statement text NOT NULL,
  claim_type text NOT NULL DEFAULT 'external',
  status text NOT NULL DEFAULT 'external' CHECK (status IN ('external','conflicted','proposed','approved','rejected')),
  confidence numeric CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status <> 'approved' OR approved_by IS NOT NULL)
);

CREATE TABLE onecite.claim_evidence_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES onecite.brands(id) ON DELETE CASCADE,
  claim_id uuid NOT NULL REFERENCES onecite.evidence_claims(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES onecite.evidence_sources(id) ON DELETE CASCADE,
  chunk_id uuid REFERENCES onecite.evidence_chunks(id) ON DELETE SET NULL,
  relation text NOT NULL CHECK (relation IN ('supports','contradicts','mentions')),
  quote text,
  confidence numeric CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (claim_id, source_id, chunk_id, relation)
);

CREATE TABLE onecite.prompt_demand_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES onecite.brands(id) ON DELETE CASCADE,
  research_run_id uuid REFERENCES onecite.research_runs(id) ON DELETE SET NULL,
  query_manifest jsonb NOT NULL DEFAULT '{}'::jsonb,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  signal_class text NOT NULL DEFAULT 'discovery_evidence' CHECK (signal_class IN ('observed_search_demand','observed_ai_referral','discovery_evidence')),
  opportunity_signal numeric CHECK (opportunity_signal IS NULL OR opportunity_signal BETWEEN 0 AND 100),
  confidence numeric CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  model_id text,
  cost_usd numeric NOT NULL DEFAULT 0,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE onecite.findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES onecite.brands(id) ON DELETE CASCADE,
  run_id uuid REFERENCES onecite.research_runs(id) ON DELETE SET NULL,
  finding_type text NOT NULL,
  title text NOT NULL,
  detection text NOT NULL,
  cause text,
  recommendation text NOT NULL,
  affected_entities jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence_count integer NOT NULL DEFAULT 0,
  confidence numeric CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  impact numeric CHECK (impact IS NULL OR impact BETWEEN 0 AND 100),
  effort numeric CHECK (effort IS NULL OR effort BETWEEN 0 AND 100),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','approved','dismissed','resolved')),
  approved_task_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE onecite.onboarding_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES onecite.brands(id) ON DELETE CASCADE,
  research_run_id uuid REFERENCES onecite.research_runs(id) ON DELETE SET NULL,
  current_step integer NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 3),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scanning','awaiting_approval','completed','failed')),
  market jsonb NOT NULL DEFAULT '{}'::jsonb,
  discovered_facts jsonb NOT NULL DEFAULT '[]'::jsonb,
  approved_fact_ids uuid[] NOT NULL DEFAULT '{}',
  proposed_prompts jsonb NOT NULL DEFAULT '[]'::jsonb,
  proposed_competitors jsonb NOT NULL DEFAULT '[]'::jsonb,
  progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_error jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE onecite.measurement_batches
  ADD COLUMN IF NOT EXISTS research_run_id uuid REFERENCES onecite.research_runs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS measurement_mode text NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS prompt_set_hash text,
  ADD COLUMN IF NOT EXISTS prompt_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS coverage numeric,
  ADD COLUMN IF NOT EXISTS confidence numeric;
CREATE UNIQUE INDEX measurement_batches_research_run_mode_idx
  ON onecite.measurement_batches(research_run_id, measurement_mode)
  WHERE research_run_id IS NOT NULL;

ALTER TABLE onecite.prompt_runs
  ADD COLUMN IF NOT EXISTS measurement_mode text NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS model_id text,
  ADD COLUMN IF NOT EXISTS research_run_id uuid REFERENCES onecite.research_runs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS confidence numeric,
  ADD COLUMN IF NOT EXISTS coverage numeric,
  ADD COLUMN IF NOT EXISTS measurement_surface text NOT NULL DEFAULT 'agent_web_grounded';

-- Replay-safe prompt writes. Existing legacy rows receive an id-suffixed key;
-- new measurement paths use the deterministic batch:prompt key below.
ALTER TABLE onecite.prompt_runs
  ADD COLUMN IF NOT EXISTS batch_prompt_key text;
UPDATE onecite.prompt_runs
  SET batch_prompt_key = batch_id::text || ':' || prompt_id::text || ':' || id::text
  WHERE batch_id IS NOT NULL AND batch_prompt_key IS NULL;
CREATE UNIQUE INDEX prompt_runs_batch_prompt_key_idx
  ON onecite.prompt_runs(batch_prompt_key)
  WHERE batch_prompt_key IS NOT NULL;

ALTER TABLE onecite.citations
  ADD COLUMN IF NOT EXISTS evidence_source_id uuid REFERENCES onecite.evidence_sources(id) ON DELETE SET NULL;

ALTER TABLE onecite.geo_tasks
  ADD COLUMN IF NOT EXISTS finding_id uuid REFERENCES onecite.findings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expected_outcome text,
  ADD COLUMN IF NOT EXISTS remeasure_status text NOT NULL DEFAULT 'not_requested',
  ADD COLUMN IF NOT EXISTS before_snapshot_id uuid REFERENCES onecite.research_runs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS after_snapshot_id uuid REFERENCES onecite.research_runs(id) ON DELETE SET NULL;

ALTER TABLE onecite.findings
  ADD CONSTRAINT findings_approved_task_fk FOREIGN KEY (approved_task_id) REFERENCES onecite.geo_tasks(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX findings_one_task_idx ON onecite.geo_tasks(finding_id) WHERE finding_id IS NOT NULL;

ALTER TABLE onecite.api_usage_log
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE onecite.system_prompts SET model = 'bulk_fast' WHERE model = 'deepseek';
UPDATE onecite.system_prompts SET model = 'agent_web_grounded' WHERE model = 'perplexity';
ALTER TABLE onecite.system_prompts ALTER COLUMN model SET DEFAULT 'bulk_fast';
UPDATE onecite.brands
  SET engines = ARRAY['agent_web_grounded']::text[]
  WHERE engines IS NULL OR engines && ARRAY['deepseek','perplexity']::text[];
ALTER TABLE onecite.brands
  ALTER COLUMN engines SET DEFAULT ARRAY['agent_web_grounded']::text[];

-- Preserve legacy Evidence Bridge runs without accepting new writes there.
INSERT INTO onecite.research_runs (
  brand_id, kind, trigger, status, measurement_mode, manifest, started_at, finished_at,
  legacy_source, legacy_source_id, created_at
)
SELECT
  brand_id, 'competitor', 'user',
  CASE WHEN status = 'completed' THEN 'completed' WHEN status = 'failed' THEN 'failed' ELSE 'partial' END,
  'discovery', jsonb_build_object('prompt_id', prompt_id, 'competitor_domain', competitor_domain),
  created_at, finished_at, 'evidence_bridge_runs', id, created_at
FROM onecite.evidence_bridge_runs
ON CONFLICT (legacy_source, legacy_source_id) DO NOTHING;

INSERT INTO onecite.research_artifacts (brand_id, run_id, artifact_type, inline_payload, provenance, created_at)
SELECT e.brand_id, r.id, 'legacy_evidence_bridge',
  jsonb_build_object(
    'ai_response_raw', e.ai_response_raw,
    'ai_response_parsed', e.ai_response_parsed,
    'firecrawl_brand', e.firecrawl_brand,
    'firecrawl_competitor', e.firecrawl_competitor,
    'content_priorities', e.content_priorities,
    'error', e.error
  ), 'legacy', e.created_at
FROM onecite.evidence_bridge_runs e
JOIN onecite.research_runs r ON r.legacy_source = 'evidence_bridge_runs' AND r.legacy_source_id = e.id
WHERE NOT EXISTS (
  SELECT 1 FROM onecite.research_artifacts a
  WHERE a.run_id = r.id AND a.artifact_type = 'legacy_evidence_bridge'
);

CREATE INDEX research_runs_brand_created_idx ON onecite.research_runs(brand_id, created_at DESC);
CREATE INDEX research_stages_run_idx ON onecite.research_run_stages(run_id, ordinal);
CREATE UNIQUE INDEX research_artifacts_run_type_idx ON onecite.research_artifacts(run_id, artifact_type);
CREATE INDEX orchestrator_jobs_claim_idx ON onecite.orchestrator_jobs(status, available_at, lease_expires_at);
CREATE INDEX evidence_sources_brand_url_idx ON onecite.evidence_sources(brand_id, canonical_url, fetched_at DESC);
CREATE INDEX evidence_chunks_source_idx ON onecite.evidence_chunks(source_id, ordinal);
CREATE INDEX evidence_chunks_embedding_idx ON onecite.evidence_chunks USING hnsw (embedding vector_cosine_ops);
-- Required by the tenant-scoped source/chunk foreign key below. PostgreSQL only
-- permits a composite FK to a primary/unique key with the same column order.
CREATE UNIQUE INDEX evidence_chunks_brand_id_idx ON onecite.evidence_chunks(brand_id, id);
CREATE INDEX demand_runs_brand_created_idx ON onecite.prompt_demand_runs(brand_id, created_at DESC);
CREATE INDEX findings_brand_status_idx ON onecite.findings(brand_id, status, created_at DESC);
CREATE UNIQUE INDEX findings_run_type_idx ON onecite.findings(run_id, finding_type)
  WHERE run_id IS NOT NULL;
CREATE INDEX onboarding_runs_brand_idx ON onecite.onboarding_runs(brand_id, created_at DESC);
CREATE UNIQUE INDEX research_runs_brand_id_idx ON onecite.research_runs(brand_id, id);
CREATE UNIQUE INDEX evidence_sources_brand_id_idx ON onecite.evidence_sources(brand_id, id);
CREATE UNIQUE INDEX evidence_claims_brand_id_idx ON onecite.evidence_claims(brand_id, id);

ALTER TABLE onecite.research_run_stages
  ADD CONSTRAINT research_stages_brand_run_fk
  FOREIGN KEY (brand_id, run_id) REFERENCES onecite.research_runs(brand_id, id);
ALTER TABLE onecite.orchestrator_jobs
  ADD CONSTRAINT orchestrator_jobs_brand_run_fk
  FOREIGN KEY (brand_id, run_id) REFERENCES onecite.research_runs(brand_id, id);
ALTER TABLE onecite.research_artifacts
  ADD CONSTRAINT research_artifacts_brand_run_fk
  FOREIGN KEY (brand_id, run_id) REFERENCES onecite.research_runs(brand_id, id);
ALTER TABLE onecite.evidence_sources
  ADD CONSTRAINT evidence_sources_brand_run_fk
  FOREIGN KEY (brand_id, run_id) REFERENCES onecite.research_runs(brand_id, id);
ALTER TABLE onecite.evidence_chunks
  ADD CONSTRAINT evidence_chunks_brand_source_fk
  FOREIGN KEY (brand_id, source_id) REFERENCES onecite.evidence_sources(brand_id, id);
ALTER TABLE onecite.evidence_claims
  ADD CONSTRAINT evidence_claims_brand_run_fk
  FOREIGN KEY (brand_id, run_id) REFERENCES onecite.research_runs(brand_id, id);
ALTER TABLE onecite.claim_evidence_edges
  ADD CONSTRAINT claim_edges_brand_claim_fk
  FOREIGN KEY (brand_id, claim_id) REFERENCES onecite.evidence_claims(brand_id, id),
  ADD CONSTRAINT claim_edges_brand_source_fk
  FOREIGN KEY (brand_id, source_id) REFERENCES onecite.evidence_sources(brand_id, id),
  ADD CONSTRAINT claim_edges_brand_chunk_fk
  FOREIGN KEY (brand_id, chunk_id) REFERENCES onecite.evidence_chunks(brand_id, id);
ALTER TABLE onecite.prompt_demand_runs
  ADD CONSTRAINT demand_runs_brand_run_fk
  FOREIGN KEY (brand_id, research_run_id) REFERENCES onecite.research_runs(brand_id, id);
ALTER TABLE onecite.findings
  ADD CONSTRAINT findings_brand_run_fk
  FOREIGN KEY (brand_id, run_id) REFERENCES onecite.research_runs(brand_id, id);

GRANT SELECT, INSERT, UPDATE, DELETE ON
  onecite.research_runs, onecite.research_run_stages, onecite.research_artifacts,
  onecite.evidence_sources, onecite.evidence_chunks, onecite.evidence_claims,
  onecite.claim_evidence_edges, onecite.prompt_demand_runs, onecite.findings,
  onecite.onboarding_runs
TO authenticated;
GRANT ALL ON
  onecite.research_runs, onecite.research_run_stages, onecite.orchestrator_jobs,
  onecite.research_artifacts, onecite.evidence_sources, onecite.evidence_chunks,
  onecite.evidence_claims, onecite.claim_evidence_edges, onecite.prompt_demand_runs,
  onecite.findings, onecite.onboarding_runs
TO service_role;
REVOKE INSERT, UPDATE, DELETE ON onecite.evidence_claims, onecite.findings FROM authenticated;
GRANT SELECT ON onecite.evidence_claims, onecite.findings TO authenticated;

ALTER TABLE onecite.research_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE onecite.research_run_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE onecite.orchestrator_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE onecite.research_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE onecite.evidence_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE onecite.evidence_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE onecite.evidence_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE onecite.claim_evidence_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE onecite.prompt_demand_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE onecite.findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE onecite.onboarding_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY research_runs_members ON onecite.research_runs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = research_runs.brand_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = research_runs.brand_id AND m.user_id = auth.uid()));
CREATE POLICY research_stages_members ON onecite.research_run_stages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = research_run_stages.brand_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = research_run_stages.brand_id AND m.user_id = auth.uid()));
CREATE POLICY research_artifacts_members ON onecite.research_artifacts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = research_artifacts.brand_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = research_artifacts.brand_id AND m.user_id = auth.uid()));
CREATE POLICY evidence_sources_members ON onecite.evidence_sources FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = evidence_sources.brand_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = evidence_sources.brand_id AND m.user_id = auth.uid()));
CREATE POLICY evidence_chunks_members ON onecite.evidence_chunks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = evidence_chunks.brand_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = evidence_chunks.brand_id AND m.user_id = auth.uid()));
CREATE POLICY evidence_claims_members ON onecite.evidence_claims FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = evidence_claims.brand_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = evidence_claims.brand_id AND m.user_id = auth.uid()));
CREATE POLICY claim_edges_members ON onecite.claim_evidence_edges FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = claim_evidence_edges.brand_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = claim_evidence_edges.brand_id AND m.user_id = auth.uid()));
CREATE POLICY demand_runs_members ON onecite.prompt_demand_runs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = prompt_demand_runs.brand_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = prompt_demand_runs.brand_id AND m.user_id = auth.uid()));
CREATE POLICY findings_members ON onecite.findings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = findings.brand_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = findings.brand_id AND m.user_id = auth.uid()));
CREATE POLICY onboarding_runs_members ON onecite.onboarding_runs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = onboarding_runs.brand_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = onboarding_runs.brand_id AND m.user_id = auth.uid()));
CREATE POLICY orchestrator_jobs_service_only ON onecite.orchestrator_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Atomic lease acquisition. Expired work can be reclaimed with a new token.
CREATE OR REPLACE FUNCTION onecite.claim_orchestrator_job(
  _worker_id text,
  _lease_seconds integer DEFAULT 120
) RETURNS SETOF onecite.orchestrator_jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path = onecite, public AS $$
DECLARE _job_id uuid;
BEGIN
  SELECT id INTO _job_id
  FROM onecite.orchestrator_jobs
  WHERE attempt_count < max_attempts
    AND available_at <= now()
    AND (
      status IN ('queued','retry')
      OR (status = 'running' AND lease_expires_at < now())
    )
  ORDER BY available_at, created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF _job_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  UPDATE onecite.orchestrator_jobs
  SET status = 'running',
      claim_token = gen_random_uuid(),
      claimed_by = _worker_id,
      lease_expires_at = now() + make_interval(secs => GREATEST(30, LEAST(_lease_seconds, 900))),
      heartbeat_at = now(),
      attempt_count = attempt_count + 1,
      updated_at = now()
  WHERE id = _job_id
  RETURNING *;
END;
$$;

CREATE OR REPLACE FUNCTION onecite.heartbeat_orchestrator_job(
  _job_id uuid,
  _claim_token uuid,
  _lease_seconds integer DEFAULT 120
) RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = onecite, public AS $$
  WITH updated AS (
    UPDATE onecite.orchestrator_jobs
    SET heartbeat_at = now(),
        lease_expires_at = now() + make_interval(secs => GREATEST(30, LEAST(_lease_seconds, 900))),
        updated_at = now()
    WHERE id = _job_id AND claim_token = _claim_token AND status = 'running'
    RETURNING 1
  ) SELECT EXISTS (SELECT 1 FROM updated);
$$;

CREATE OR REPLACE FUNCTION onecite.finish_orchestrator_job(
  _job_id uuid,
  _claim_token uuid,
  _status text,
  _stage text,
  _metrics jsonb DEFAULT '{}'::jsonb,
  _error jsonb DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = onecite, public AS $$
DECLARE _updated integer;
BEGIN
  IF _status NOT IN ('completed','retry','failed') THEN
    RAISE EXCEPTION 'invalid terminal job status';
  END IF;
  UPDATE onecite.orchestrator_jobs
  SET status = _status,
      stage = _stage,
      stage_metrics = stage_metrics || COALESCE(_metrics, '{}'::jsonb),
      last_error = _error,
      available_at = CASE WHEN _status = 'retry' THEN now() + make_interval(secs => LEAST(300, 5 * power(2, attempt_count)::integer)) ELSE available_at END,
      finished_at = CASE WHEN _status IN ('completed','failed') THEN now() ELSE NULL END,
      lease_expires_at = NULL,
      heartbeat_at = now(),
      updated_at = now()
  WHERE id = _job_id AND claim_token = _claim_token AND status = 'running';
  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN _updated = 1;
END;
$$;

CREATE OR REPLACE FUNCTION onecite.advance_orchestrator_job(
  _job_id uuid,
  _claim_token uuid,
  _stage text
) RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = onecite, public AS $$
  WITH updated AS (
    UPDATE onecite.orchestrator_jobs
    SET stage = _stage, heartbeat_at = now(), updated_at = now()
    WHERE id = _job_id AND claim_token = _claim_token AND status = 'running'
    RETURNING 1
  ) SELECT EXISTS (SELECT 1 FROM updated);
$$;

REVOKE ALL ON FUNCTION onecite.claim_orchestrator_job(text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION onecite.heartbeat_orchestrator_job(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION onecite.finish_orchestrator_job(uuid, uuid, text, text, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION onecite.advance_orchestrator_job(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION onecite.claim_orchestrator_job(text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION onecite.heartbeat_orchestrator_job(uuid, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION onecite.finish_orchestrator_job(uuid, uuid, text, text, jsonb, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION onecite.advance_orchestrator_job(uuid, uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION onecite.approve_finding_to_task(_finding_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = onecite, public AS $$
DECLARE _finding onecite.findings%ROWTYPE; _task_id uuid;
BEGIN
  SELECT * INTO _finding FROM onecite.findings WHERE id = _finding_id FOR UPDATE;
  IF _finding.id IS NULL OR NOT EXISTS (
    SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = _finding.brand_id AND m.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'finding not found or access denied';
  END IF;
  SELECT id INTO _task_id FROM onecite.geo_tasks WHERE finding_id = _finding_id;
  IF _task_id IS NULL THEN
    INSERT INTO onecite.geo_tasks (brand_id, finding_id, title, description, priority, expected_outcome)
    VALUES (
      _finding.brand_id,
      _finding.id,
      _finding.title,
      concat_ws(E'\n\n', _finding.detection, _finding.recommendation),
      CASE WHEN COALESCE(_finding.impact, 0) >= 75 THEN 'high' WHEN COALESCE(_finding.impact, 0) >= 40 THEN 'medium' ELSE 'low' END,
      _finding.recommendation
    ) RETURNING id INTO _task_id;
  END IF;
  UPDATE onecite.findings SET status = 'approved', approved_task_id = _task_id, updated_at = now() WHERE id = _finding_id;
  RETURN _task_id;
END;
$$;
REVOKE ALL ON FUNCTION onecite.approve_finding_to_task(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION onecite.approve_finding_to_task(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION onecite.enqueue_orchestrator_run(
  _brand_id uuid,
  _kind text,
  _measurement_mode text,
  _trigger text,
  _idempotency_key text,
  _manifest jsonb,
  _created_by uuid DEFAULT NULL
) RETURNS TABLE(run_id uuid, job_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = onecite, public AS $$
DECLARE _run_id uuid; _job_id uuid;
BEGIN
  SELECT j.run_id, j.id INTO _run_id, _job_id
  FROM onecite.orchestrator_jobs j
  WHERE j.brand_id = _brand_id AND j.idempotency_key = _idempotency_key;
  IF _job_id IS NOT NULL THEN
    RETURN QUERY SELECT _run_id, _job_id;
    RETURN;
  END IF;
  INSERT INTO onecite.research_runs (brand_id, kind, trigger, measurement_mode, manifest, created_by)
  VALUES (_brand_id, _kind, _trigger, _measurement_mode, COALESCE(_manifest, '{}'::jsonb), _created_by)
  RETURNING id INTO _run_id;
  INSERT INTO onecite.orchestrator_jobs (brand_id, run_id, job_type, idempotency_key, trigger, payload)
  VALUES (
    _brand_id, _run_id, _kind, _idempotency_key, _trigger,
    COALESCE(_manifest, '{}'::jsonb) || jsonb_build_object('_measurement_mode', _measurement_mode)
  )
  RETURNING id INTO _job_id;
  RETURN QUERY SELECT _run_id, _job_id;
END;
$$;
REVOKE ALL ON FUNCTION onecite.enqueue_orchestrator_run(uuid, text, text, text, text, jsonb, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION onecite.enqueue_orchestrator_run(uuid, text, text, text, text, jsonb, uuid) TO service_role;

CREATE TRIGGER research_runs_updated_at BEFORE UPDATE ON onecite.research_runs FOR EACH ROW EXECUTE FUNCTION onecite.update_updated_at_column();
CREATE TRIGGER orchestrator_jobs_updated_at BEFORE UPDATE ON onecite.orchestrator_jobs FOR EACH ROW EXECUTE FUNCTION onecite.update_updated_at_column();
CREATE TRIGGER evidence_claims_updated_at BEFORE UPDATE ON onecite.evidence_claims FOR EACH ROW EXECUTE FUNCTION onecite.update_updated_at_column();
CREATE TRIGGER findings_updated_at BEFORE UPDATE ON onecite.findings FOR EACH ROW EXECUTE FUNCTION onecite.update_updated_at_column();
CREATE TRIGGER onboarding_runs_updated_at BEFORE UPDATE ON onecite.onboarding_runs FOR EACH ROW EXECUTE FUNCTION onecite.update_updated_at_column();
