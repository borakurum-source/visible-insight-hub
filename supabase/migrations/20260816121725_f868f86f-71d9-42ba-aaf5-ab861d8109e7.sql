CREATE TABLE public.measurement_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running',
  engine TEXT NOT NULL DEFAULT 'onecite',
  total_prompts INTEGER NOT NULL DEFAULT 0,
  completed_prompts INTEGER NOT NULL DEFAULT 0,
  score NUMERIC,
  components JSONB NOT NULL DEFAULT '[]'::jsonb,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX measurement_batches_brand_created_idx ON public.measurement_batches (brand_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.measurement_batches TO authenticated;
GRANT ALL ON public.measurement_batches TO service_role;

ALTER TABLE public.measurement_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "measurement_batches_all" ON public.measurement_batches FOR ALL TO authenticated
  USING (public.is_brand_member(brand_id, auth.uid()))
  WITH CHECK (public.is_brand_member(brand_id, auth.uid()));