-- Hata kayitlari
CREATE TABLE onecite.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL DEFAULT 'error',
  source text NOT NULL DEFAULT 'server',
  message text NOT NULL,
  stack text,
  path text,
  user_id uuid,
  brand_id uuid,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  fingerprint text,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON onecite.error_logs TO service_role;
ALTER TABLE onecite.error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "error_logs_service_only" ON onecite.error_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX error_logs_created_at_idx ON onecite.error_logs (created_at DESC);
CREATE INDEX error_logs_resolved_idx ON onecite.error_logs (resolved, created_at DESC);

-- API kullanim kayitlari
CREATE TABLE onecite.api_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  operation text NOT NULL,
  model text,
  user_id uuid,
  brand_id uuid,
  duration_ms integer NOT NULL DEFAULT 0,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  cost_usd numeric NOT NULL DEFAULT 0,
  cached boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'ok',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON onecite.api_usage_log TO service_role;
ALTER TABLE onecite.api_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_usage_log_service_only" ON onecite.api_usage_log FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX api_usage_log_created_at_idx ON onecite.api_usage_log (created_at DESC);
CREATE INDEX api_usage_log_provider_idx ON onecite.api_usage_log (provider, created_at DESC);

-- E-posta gonderim kayitlari
CREATE TABLE onecite.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  subject text NOT NULL,
  template_key text,
  status text NOT NULL DEFAULT 'sent',
  error text,
  user_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON onecite.email_logs TO service_role;
ALTER TABLE onecite.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_logs_service_only" ON onecite.email_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX email_logs_created_at_idx ON onecite.email_logs (created_at DESC);

-- E-posta sablonlari
CREATE TABLE onecite.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  title text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON onecite.email_templates TO service_role;
ALTER TABLE onecite.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_templates_service_only" ON onecite.email_templates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER email_templates_updated_at BEFORE UPDATE ON onecite.email_templates
  FOR EACH ROW EXECUTE FUNCTION onecite.update_updated_at_column();

-- Yonetici islem gecmisi
CREATE TABLE onecite.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  admin_email text,
  action text NOT NULL,
  target_type text,
  target_id text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON onecite.admin_audit_log TO service_role;
ALTER TABLE onecite.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_audit_log_service_only" ON onecite.admin_audit_log FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX admin_audit_log_created_at_idx ON onecite.admin_audit_log (created_at DESC);

-- Musteri notlari
CREATE TABLE onecite.admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  admin_id uuid NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON onecite.admin_notes TO service_role;
ALTER TABLE onecite.admin_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_notes_service_only" ON onecite.admin_notes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX admin_notes_user_idx ON onecite.admin_notes (user_id, created_at DESC);

-- Hesap alanlari
ALTER TABLE onecite.profiles
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan_source text NOT NULL DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_note text;