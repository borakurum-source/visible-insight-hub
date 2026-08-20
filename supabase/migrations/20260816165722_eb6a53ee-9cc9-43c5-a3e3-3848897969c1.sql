REVOKE EXECUTE ON FUNCTION onecite.has_role(uuid, app_role) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION onecite.is_brand_member(uuid, uuid) FROM authenticated, anon;