ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS funnel_stage text NOT NULL DEFAULT 'middle';
ALTER TABLE public.brand_intelligence
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS detailed_description text,
  ADD COLUMN IF NOT EXISTS key_features jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS engines text[] NOT NULL DEFAULT ARRAY['perplexity','deepseek']::text[];