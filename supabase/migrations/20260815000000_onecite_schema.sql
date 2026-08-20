-- Self-hosted deployment boundary for the OneCite tenant schema.
-- Idempotent on a fresh or previously prepared database.
CREATE SCHEMA IF NOT EXISTS onecite;
GRANT USAGE ON SCHEMA onecite TO anon, authenticated, service_role;
