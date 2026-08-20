-- Add cited_reasons column to capture AI's explanation for mentioning each brand
ALTER TABLE onecite.prompt_runs
ADD COLUMN cited_reasons JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN onecite.prompt_runs.cited_reasons IS 'Array of {name, reason} objects explaining why each mentioned brand was cited by the AI. Populated during measurement.';
