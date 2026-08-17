-- 1) Fail-closed, explicit deny for secret/internal tables
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bing_webmaster_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_oauth_accounts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.ai_cache FROM anon, authenticated;
REVOKE ALL ON public.bing_webmaster_accounts FROM anon, authenticated;
REVOKE ALL ON public.google_oauth_accounts FROM anon, authenticated;
GRANT ALL ON public.ai_cache TO service_role;
GRANT ALL ON public.bing_webmaster_accounts TO service_role;
GRANT ALL ON public.google_oauth_accounts TO service_role;

DROP POLICY IF EXISTS ai_cache_no_client_access ON public.ai_cache;
CREATE POLICY ai_cache_no_client_access ON public.ai_cache
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS bing_webmaster_accounts_no_client_access ON public.bing_webmaster_accounts;
CREATE POLICY bing_webmaster_accounts_no_client_access ON public.bing_webmaster_accounts
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS google_oauth_accounts_no_client_access ON public.google_oauth_accounts;
CREATE POLICY google_oauth_accounts_no_client_access ON public.google_oauth_accounts
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

COMMENT ON TABLE public.ai_cache IS 'Server-only AI response cache. No client (anon/authenticated) access; service_role only.';
COMMENT ON TABLE public.bing_webmaster_accounts IS 'Stores Bing Webmaster API keys. Server-only; service_role access via server functions.';
COMMENT ON TABLE public.google_oauth_accounts IS 'Stores Google OAuth refresh/access tokens. Server-only; service_role access via server functions.';

-- 2) Public reports: remove blanket anon read, require the share token
DROP POLICY IF EXISTS reports_public_read ON public.reports;

CREATE OR REPLACE FUNCTION public.get_public_report(p_token text)
RETURNS TABLE (id uuid, title text, payload jsonb, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.title, r.payload::jsonb, r.created_at
  FROM public.reports r
  WHERE r.is_public = true
    AND p_token IS NOT NULL
    AND length(p_token) >= 16
    AND r.token = p_token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_report(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_report(text) TO anon, authenticated, service_role;