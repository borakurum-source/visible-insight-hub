-- Prompt deduplication migration: add unique index on normalized prompt text (Finding A2)
-- Turkish normalization: İ/ı → i, trim whitespace, lowercase

-- Create normalization function for Turkish character handling
CREATE OR REPLACE FUNCTION onecite.normalize_prompt_text(text TEXT) RETURNS TEXT AS $$
  SELECT LOWER(BTRIM(REPLACE(REPLACE(text, 'İ', 'i'), 'ı', 'i')))
$$ LANGUAGE SQL IMMUTABLE;

-- Create unique index on (brand_id, normalized text) for approved prompts only
-- This allows candidates to be renamed/merged without constraint violations
CREATE UNIQUE INDEX idx_prompts_brand_text
  ON onecite.prompts(brand_id, onecite.normalize_prompt_text(text))
  WHERE status = 'approved';
