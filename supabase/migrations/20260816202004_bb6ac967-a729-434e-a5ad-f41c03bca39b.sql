CREATE TABLE IF NOT EXISTS public.google_oauth_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
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

GRANT ALL ON public.google_oauth_accounts TO service_role;
ALTER TABLE public.google_oauth_accounts ENABLE ROW LEVEL SECURITY;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('onecite-sync-analytics') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'onecite-sync-analytics');

SELECT cron.schedule(
  'onecite-sync-analytics',
  '17 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--8e50bc36-64ac-4cc1-9948-3f4fac9d3f33.lovable.app/api/public/cron/sync-analytics',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_4A2n5FDKqehhxp3nAbhpDA_cg24Ww5Z"}'::jsonb,
    body := '{"source":"pg_cron"}'::jsonb
  );
  $$
);