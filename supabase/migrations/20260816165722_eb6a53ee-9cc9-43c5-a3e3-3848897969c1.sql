REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.is_brand_member(uuid, uuid) FROM authenticated, anon;