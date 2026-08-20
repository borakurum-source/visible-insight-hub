ALTER TABLE onecite.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
UPDATE onecite.profiles SET plan = 'trial' WHERE plan IS NULL OR plan NOT IN ('trial','expired','starter','growth','agency');
ALTER TABLE onecite.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('trial','expired','starter','growth','agency'));
ALTER TABLE onecite.profiles ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz NOT NULL DEFAULT (now() + interval '7 days');
ALTER TABLE onecite.profiles ALTER COLUMN plan SET DEFAULT 'trial';