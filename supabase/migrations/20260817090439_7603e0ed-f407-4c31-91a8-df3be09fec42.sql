ALTER TABLE public.prompt_runs
  ADD COLUMN IF NOT EXISTS mentioned_brands jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS run_index integer,
  ADD COLUMN IF NOT EXISTS visibility numeric;

CREATE TABLE IF NOT EXISTS public.competitor_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  domain text,
  first_seen_run_id uuid REFERENCES public.prompt_runs(id) ON DELETE SET NULL,
  first_seen_prompt_id uuid REFERENCES public.prompts(id) ON DELETE SET NULL,
  prompt_count integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, name)
);

CREATE INDEX IF NOT EXISTS competitor_candidates_brand_idx ON public.competitor_candidates (brand_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.competitor_candidates TO authenticated;
GRANT ALL ON public.competitor_candidates TO service_role;

ALTER TABLE public.competitor_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY competitor_candidates_all ON public.competitor_candidates
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.brand_members m WHERE m.brand_id = competitor_candidates.brand_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.brand_members m WHERE m.brand_id = competitor_candidates.brand_id AND m.user_id = auth.uid()));