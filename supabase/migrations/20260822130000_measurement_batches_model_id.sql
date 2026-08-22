-- Toplu ölçüm turunda seçilen model (NULL = otomatik, Perplexity'nin kendi seçimi).
ALTER TABLE onecite.measurement_batches
  ADD COLUMN IF NOT EXISTS model_id text;
