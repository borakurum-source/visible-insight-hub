REVOKE EXECUTE ON FUNCTION onecite.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION onecite.onecite_handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION onecite.onecite_handle_new_brand() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION onecite.has_role(uuid, onecite.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION onecite.is_brand_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION onecite.has_role(uuid, onecite.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION onecite.is_brand_member(uuid, uuid) TO authenticated, service_role;