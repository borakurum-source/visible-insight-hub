CREATE TABLE onecite.public_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  domain text NOT NULL,
  email text,
  score integer NOT NULL DEFAULT 0,
  category_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  citation jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON onecite.public_reports TO service_role;

ALTER TABLE onecite.public_reports ENABLE ROW LEVEL SECURITY;

CREATE INDEX public_reports_domain_idx ON onecite.public_reports (domain, created_at DESC);

CREATE TRIGGER public_reports_updated_at
BEFORE UPDATE ON onecite.public_reports
FOR EACH ROW EXECUTE FUNCTION onecite.update_updated_at_column();