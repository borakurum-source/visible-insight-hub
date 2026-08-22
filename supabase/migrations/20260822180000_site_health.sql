-- Site Health: per-page technical/AEO audit results, plus findings columns and
-- resolve/reopen RPCs for the "Mark Fixed" / "Reopen" actions in the UI.

CREATE TABLE onecite.site_health_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES onecite.brands(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  technical_score INTEGER NOT NULL DEFAULT 0,
  aeo_score INTEGER NOT NULL DEFAULT 0,
  issue_count INTEGER NOT NULL DEFAULT 0,
  last_audited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (brand_id, url)
);

ALTER TABLE onecite.site_health_pages ENABLE ROW LEVEL SECURITY;

-- Read: brand members. Write: service_role only (audit results are system-written,
-- same posture as onecite.findings, not the fully user-writable geo_tasks pattern).
CREATE POLICY site_health_pages_select ON onecite.site_health_pages
  FOR SELECT TO authenticated
  USING (onecite.is_brand_member(brand_id, auth.uid()));

GRANT SELECT ON onecite.site_health_pages TO authenticated;
GRANT ALL ON onecite.site_health_pages TO service_role;

ALTER TABLE onecite.findings
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS severity text,
  ADD COLUMN IF NOT EXISTS rule_id text;

-- resolve/reopen: same SECURITY DEFINER pattern as onecite.approve_finding_to_task —
-- membership is checked inside the function, then EXECUTE is granted to authenticated.
CREATE OR REPLACE FUNCTION onecite.resolve_site_health_finding(_finding_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = onecite, public
AS $$
DECLARE _finding onecite.findings%ROWTYPE;
BEGIN
  SELECT * INTO _finding FROM onecite.findings WHERE id = _finding_id FOR UPDATE;
  IF _finding.id IS NULL OR NOT EXISTS (
    SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = _finding.brand_id AND m.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'finding not found or access denied';
  END IF;
  UPDATE onecite.findings SET status = 'resolved', updated_at = now() WHERE id = _finding_id;
END;
$$;

CREATE OR REPLACE FUNCTION onecite.reopen_site_health_finding(_finding_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = onecite, public
AS $$
DECLARE _finding onecite.findings%ROWTYPE;
BEGIN
  SELECT * INTO _finding FROM onecite.findings WHERE id = _finding_id FOR UPDATE;
  IF _finding.id IS NULL OR NOT EXISTS (
    SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = _finding.brand_id AND m.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'finding not found or access denied';
  END IF;
  UPDATE onecite.findings SET status = 'open', updated_at = now() WHERE id = _finding_id;
END;
$$;

REVOKE ALL ON FUNCTION onecite.resolve_site_health_finding(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION onecite.reopen_site_health_finding(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION onecite.resolve_site_health_finding(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION onecite.reopen_site_health_finding(uuid) TO authenticated;
