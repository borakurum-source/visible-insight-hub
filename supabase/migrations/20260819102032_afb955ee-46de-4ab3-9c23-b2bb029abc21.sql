CREATE TABLE public.prompt_demand_match_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  topic text NOT NULL,
  candidate_text text NOT NULL,
  gsc_query text,
  jaccard_score numeric NOT NULL DEFAULT 0,
  cosine_score numeric,
  method text NOT NULL DEFAULT 'jaccard',
  accepted boolean NOT NULL DEFAULT false,
  borderline boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.prompt_demand_match_log TO authenticated;
GRANT ALL ON public.prompt_demand_match_log TO service_role;
ALTER TABLE public.prompt_demand_match_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brand members read match log"
  ON public.prompt_demand_match_log FOR SELECT TO authenticated
  USING (public.is_brand_member(brand_id, auth.uid()));

CREATE INDEX prompt_demand_match_log_brand_idx ON public.prompt_demand_match_log (brand_id, created_at DESC);

CREATE TABLE public.prompt_demand_calibration_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  topic text NOT NULL,
  ratio numeric,
  matched_sample_size integer NOT NULL DEFAULT 0,
  applied boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.prompt_demand_calibration_log TO authenticated;
GRANT ALL ON public.prompt_demand_calibration_log TO service_role;
ALTER TABLE public.prompt_demand_calibration_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brand members read calibration log"
  ON public.prompt_demand_calibration_log FOR SELECT TO authenticated
  USING (public.is_brand_member(brand_id, auth.uid()));

CREATE INDEX prompt_demand_calibration_log_brand_idx ON public.prompt_demand_calibration_log (brand_id, created_at DESC);