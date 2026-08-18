-- public_reports: server-only (service_role). Explicitly deny browser roles.
REVOKE ALL ON public.public_reports FROM anon, authenticated;
GRANT ALL ON public.public_reports TO service_role;
COMMENT ON TABLE public.public_reports IS 'Server-only. Token lookups go through server functions using service_role; no anon/authenticated grants or policies by design.';

-- reports: token-based sharing must stay server-side; keep member-only policy, deny anon.
REVOKE ALL ON public.reports FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
COMMENT ON COLUMN public.reports.token IS 'Shared-link token. Resolve only server-side with service_role; never add a public token policy.';

-- subscriptions: read-only for owner, writes only by payment webhook (service_role).
REVOKE ALL ON public.subscriptions FROM anon, authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

-- user_roles: read-only for the user, writes only by admin server code (service_role).
REVOKE ALL ON public.user_roles FROM anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
COMMENT ON TABLE public.user_roles IS 'Role assignments are write-protected: no client write grants or policies. Only service_role (admin server code) may insert/update/delete.';