ALTER TABLE onecite.prompt_runs
  ADD COLUMN IF NOT EXISTS mentioned_brands jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS run_index integer,
  ADD COLUMN IF NOT EXISTS visibility numeric;

CREATE TABLE IF NOT EXISTS onecite.competitor_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES onecite.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  domain text,
  first_seen_run_id uuid REFERENCES onecite.prompt_runs(id) ON DELETE SET NULL,
  first_seen_prompt_id uuid REFERENCES onecite.prompts(id) ON DELETE SET NULL,
  prompt_count integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, name)
);

CREATE INDEX IF NOT EXISTS competitor_candidates_brand_idx ON onecite.competitor_candidates (brand_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON onecite.competitor_candidates TO authenticated;
GRANT ALL ON onecite.competitor_candidates TO service_role;

ALTER TABLE onecite.competitor_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY competitor_candidates_all ON onecite.competitor_candidates
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = competitor_candidates.brand_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = competitor_candidates.brand_id AND m.user_id = auth.uid()));