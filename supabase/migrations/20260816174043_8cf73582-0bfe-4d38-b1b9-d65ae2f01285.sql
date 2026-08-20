ALTER TABLE onecite.citations
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS prompt_id uuid REFERENCES onecite.prompts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS citation_type text NOT NULL DEFAULT 'neutral';

CREATE INDEX IF NOT EXISTS citations_prompt_id_idx ON onecite.citations(prompt_id);

CREATE TABLE onecite.system_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  stage text NOT NULL DEFAULT 'other',
  model text NOT NULL DEFAULT 'deepseek',
  content text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON onecite.system_prompts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON onecite.system_prompts TO authenticated;
GRANT ALL ON onecite.system_prompts TO service_role;
ALTER TABLE onecite.system_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_prompts_read" ON onecite.system_prompts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "system_prompts_admin_write" ON onecite.system_prompts
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM onecite.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM onecite.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TRIGGER update_system_prompts_updated_at
  BEFORE UPDATE ON onecite.system_prompts
  FOR EACH ROW EXECUTE FUNCTION onecite.update_updated_at_column();

CREATE TABLE onecite.integration_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES onecite.brands(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'disconnected',
  property_id text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, provider)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON onecite.integration_connections TO authenticated;
GRANT ALL ON onecite.integration_connections TO service_role;
ALTER TABLE onecite.integration_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integration_connections_members" ON onecite.integration_connections
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM onecite.brand_members bm WHERE bm.brand_id = integration_connections.brand_id AND bm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM onecite.brand_members bm WHERE bm.brand_id = integration_connections.brand_id AND bm.user_id = auth.uid()));

CREATE TRIGGER update_integration_connections_updated_at
  BEFORE UPDATE ON onecite.integration_connections
  FOR EACH ROW EXECUTE FUNCTION onecite.update_updated_at_column();

CREATE TABLE onecite.analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES onecite.brands(id) ON DELETE CASCADE,
  provider text NOT NULL,
  snapshot_date date NOT NULL DEFAULT current_date,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, provider, snapshot_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON onecite.analytics_snapshots TO authenticated;
GRANT ALL ON onecite.analytics_snapshots TO service_role;
ALTER TABLE onecite.analytics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_snapshots_members" ON onecite.analytics_snapshots
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM onecite.brand_members bm WHERE bm.brand_id = analytics_snapshots.brand_id AND bm.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM onecite.brand_members bm WHERE bm.brand_id = analytics_snapshots.brand_id AND bm.user_id = auth.uid()));

CREATE TRIGGER update_analytics_snapshots_updated_at
  BEFORE UPDATE ON onecite.analytics_snapshots
  FOR EACH ROW EXECUTE FUNCTION onecite.update_updated_at_column();

CREATE INDEX IF NOT EXISTS analytics_snapshots_brand_provider_idx ON onecite.analytics_snapshots(brand_id, provider, snapshot_date DESC);