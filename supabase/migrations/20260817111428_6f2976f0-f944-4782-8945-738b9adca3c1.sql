-- Hata kayitlari
CREATE TABLE public.error_logs (
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
GRANT ALL ON public.error_logs TO service_role;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "error_logs_service_only" ON public.error_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX error_logs_created_at_idx ON public.error_logs (created_at DESC);
CREATE INDEX error_logs_resolved_idx ON public.error_logs (resolved, created_at DESC);

-- API kullanim kayitlari
CREATE TABLE public.api_usage_log (
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
GRANT ALL ON public.api_usage_log TO service_role;
ALTER TABLE public.api_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_usage_log_service_only" ON public.api_usage_log FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX api_usage_log_created_at_idx ON public.api_usage_log (created_at DESC);
CREATE INDEX api_usage_log_provider_idx ON public.api_usage_log (provider, created_at DESC);

-- E-posta gonderim kayitlari
CREATE TABLE public.email_logs (
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
GRANT ALL ON public.email_logs TO service_role;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_logs_service_only" ON public.email_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX email_logs_created_at_idx ON public.email_logs (created_at DESC);

-- E-posta sablonlari
CREATE TABLE public.email_templates (
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
GRANT ALL ON public.email_templates TO service_role;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_templates_service_only" ON public.email_templates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER email_templates_updated_at BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Yonetici islem gecmisi
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  admin_email text,
  action text NOT NULL,
  target_type text,
  target_id text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_audit_log_service_only" ON public.admin_audit_log FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX admin_audit_log_created_at_idx ON public.admin_audit_log (created_at DESC);

-- Musteri notlari
CREATE TABLE public.admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  admin_id uuid NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_notes TO service_role;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_notes_service_only" ON public.admin_notes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX admin_notes_user_idx ON public.admin_notes (user_id, created_at DESC);

-- Hesap alanlari
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan_source text NOT NULL DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_note text;