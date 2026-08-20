REVOKE EXECUTE ON FUNCTION onecite.has_active_subscription(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION onecite.has_active_subscription(uuid, text) TO service_role;