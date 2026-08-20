-- Inline membership checks so RLS no longer depends on SECURITY DEFINER helpers
CREATE OR REPLACE FUNCTION onecite.__noop_placeholder() RETURNS void LANGUAGE sql AS $$ SELECT $$;
DROP FUNCTION onecite.__noop_placeholder();

-- brand_members: own rows only (team/admin views use privileged server access)
DROP POLICY IF EXISTS brand_members_select ON onecite.brand_members;
DROP POLICY IF EXISTS brand_members_insert ON onecite.brand_members;
DROP POLICY IF EXISTS brand_members_delete ON onecite.brand_members;
CREATE POLICY brand_members_select ON onecite.brand_members FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY brand_members_insert ON onecite.brand_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY brand_members_delete ON onecite.brand_members FOR DELETE TO authenticated USING (user_id = auth.uid());

-- brands
DROP POLICY IF EXISTS brands_select ON onecite.brands;
CREATE POLICY brands_select ON onecite.brands FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = brands.id AND m.user_id = auth.uid()));
DROP POLICY IF EXISTS brands_update ON onecite.brands;
CREATE POLICY brands_update ON onecite.brands FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = brands.id AND m.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = brands.id AND m.user_id = auth.uid()));

-- brand-scoped tables
DO $$
DECLARE t text; p text;
BEGIN
  FOREACH t IN ARRAY ARRAY['brand_domains','brand_intelligence','citations','claims','geo_tasks','knowledge_sources','measurement_batches','prompt_runs','prompts','reports'] LOOP
    SELECT polname INTO p FROM pg_policy WHERE polrelid = ('onecite.'||t)::regclass
      AND (pg_get_expr(polqual,polrelid) LIKE '%is_brand_member%' OR pg_get_expr(polwithcheck,polrelid) LIKE '%is_brand_member%') LIMIT 1;
    IF p IS NOT NULL THEN
      EXECUTE format('DROP POLICY %I ON onecite.%I', p, t);
      EXECUTE format(
        'CREATE POLICY %I ON onecite.%I FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = %I.brand_id AND m.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = %I.brand_id AND m.user_id = auth.uid()))',
        p, t, t, t);
    END IF;
  END LOOP;
END $$;

-- user_roles: users read only their own roles; admin-wide reads go through privileged server code
DROP POLICY IF EXISTS user_roles_select_admin ON onecite.user_roles;

-- Helper functions stay non-executable for API roles
REVOKE EXECUTE ON FUNCTION onecite.has_role(uuid, app_role) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION onecite.is_brand_member(uuid, uuid) FROM authenticated, anon, PUBLIC;