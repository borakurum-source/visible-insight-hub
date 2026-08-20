CREATE TABLE IF NOT EXISTS onecite.google_oauth_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES onecite.brands(id) ON DELETE CASCADE,
  google_email TEXT,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  access_token_expires_at TIMESTAMPTZ,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (brand_id)
);

GRANT ALL ON onecite.google_oauth_accounts TO service_role;
ALTER TABLE onecite.google_oauth_accounts ENABLE ROW LEVEL SECURITY;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('onecite-sync-analytics') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'onecite-sync-analytics');

SELECT cron.schedule(
  'onecite-sync-analytics',
  '17 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://1cite.com/api/public/cron/sync-analytics',
    headers := jsonb_build_object('Content-Type', 'application/json') || CASE
      WHEN NULLIF(current_setting('app.settings.anon_key', true), '') IS NULL THEN '{}'::jsonb
      ELSE jsonb_build_object('apikey', current_setting('app.settings.anon_key', true))
    END,
    body := '{"source":"pg_cron"}'::jsonb
  );
  $$
);
