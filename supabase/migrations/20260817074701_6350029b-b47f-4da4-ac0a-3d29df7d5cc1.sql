ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
UPDATE public.profiles SET plan = 'trial' WHERE plan IS NULL OR plan NOT IN ('trial','expired','starter','growth','agency');
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('trial','expired','starter','growth','agency'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz NOT NULL DEFAULT (now() + interval '7 days');
ALTER TABLE public.profiles ALTER COLUMN plan SET DEFAULT 'trial';