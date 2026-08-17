ALTER TABLE public.knowledge_sources
  ADD COLUMN IF NOT EXISTS etag text,
  ADD COLUMN IF NOT EXISTS last_modified text,
  ADD COLUMN IF NOT EXISTS extract_method text,
  ADD COLUMN IF NOT EXISTS last_checked_at timestamptz;