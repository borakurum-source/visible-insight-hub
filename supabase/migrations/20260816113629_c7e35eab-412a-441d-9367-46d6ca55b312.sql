-- ============ helpers ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

-- ============ profiles ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ roles ============
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "user_roles_select_admin" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- new user -> profile + role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  IF lower(NEW.email) = 'bora@1cite.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- backfill existing users
INSERT INTO public.profiles (id, email, full_name, avatar_url)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'), u.raw_user_meta_data->>'avatar_url'
FROM auth.users u ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, CASE WHEN lower(u.email) = 'bora@1cite.com' THEN 'admin'::public.app_role ELSE 'member'::public.app_role END
FROM auth.users u ON CONFLICT DO NOTHING;

-- ============ brands ============
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  created_by UUID NOT NULL,
  onboarding_step SMALLINT NOT NULL DEFAULT 1,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands TO authenticated;
GRANT ALL ON public.brands TO service_role;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.brand_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (brand_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_members TO authenticated;
GRANT ALL ON public.brand_members TO service_role;
ALTER TABLE public.brand_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_brand_member(_brand_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.brand_members WHERE brand_id = _brand_id AND user_id = _user_id);
$$;

CREATE POLICY "brands_select" ON public.brands FOR SELECT TO authenticated
  USING (public.is_brand_member(id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "brands_insert" ON public.brands FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "brands_update" ON public.brands FOR UPDATE TO authenticated
  USING (public.is_brand_member(id, auth.uid())) WITH CHECK (public.is_brand_member(id, auth.uid()));
CREATE POLICY "brands_delete" ON public.brands FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "brand_members_select" ON public.brand_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_brand_member(brand_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "brand_members_insert" ON public.brand_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_brand_member(brand_id, auth.uid()));
CREATE POLICY "brand_members_delete" ON public.brand_members FOR DELETE TO authenticated
  USING (public.is_brand_member(brand_id, auth.uid()));

CREATE TRIGGER brands_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- creator becomes owner
CREATE OR REPLACE FUNCTION public.handle_new_brand()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.brand_members (brand_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_brand_created AFTER INSERT ON public.brands FOR EACH ROW EXECUTE FUNCTION public.handle_new_brand();

-- ============ brand domains ============
CREATE TABLE public.brand_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  target_markets TEXT[] NOT NULL DEFAULT '{}',
  primary_language TEXT NOT NULL DEFAULT 'tr',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_domains TO authenticated;
GRANT ALL ON public.brand_domains TO service_role;
ALTER TABLE public.brand_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brand_domains_all" ON public.brand_domains FOR ALL TO authenticated
  USING (public.is_brand_member(brand_id, auth.uid())) WITH CHECK (public.is_brand_member(brand_id, auth.uid()));
CREATE TRIGGER brand_domains_updated_at BEFORE UPDATE ON public.brand_domains FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ brand intelligence ============
CREATE TABLE public.brand_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL UNIQUE REFERENCES public.brands(id) ON DELETE CASCADE,
  summary TEXT,
  positioning TEXT,
  tone TEXT,
  products JSONB NOT NULL DEFAULT '[]'::jsonb,
  audiences JSONB NOT NULL DEFAULT '[]'::jsonb,
  competitors JSONB NOT NULL DEFAULT '[]'::jsonb,
  keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_intelligence TO authenticated;
GRANT ALL ON public.brand_intelligence TO service_role;
ALTER TABLE public.brand_intelligence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brand_intelligence_all" ON public.brand_intelligence FOR ALL TO authenticated
  USING (public.is_brand_member(brand_id, auth.uid())) WITH CHECK (public.is_brand_member(brand_id, auth.uid()));
CREATE TRIGGER brand_intelligence_updated_at BEFORE UPDATE ON public.brand_intelligence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ knowledge sources ============
CREATE TABLE public.knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  content TEXT,
  source_type TEXT NOT NULL DEFAULT 'url',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_sources TO authenticated;
GRANT ALL ON public.knowledge_sources TO service_role;
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "knowledge_sources_all" ON public.knowledge_sources FOR ALL TO authenticated
  USING (public.is_brand_member(brand_id, auth.uid())) WITH CHECK (public.is_brand_member(brand_id, auth.uid()));
CREATE TRIGGER knowledge_sources_updated_at BEFORE UPDATE ON public.knowledge_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ prompts ============
CREATE TABLE public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'genel',
  intent TEXT,
  status TEXT NOT NULL DEFAULT 'candidate',
  origin TEXT NOT NULL DEFAULT 'ai',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompts TO authenticated;
GRANT ALL ON public.prompts TO service_role;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prompts_all" ON public.prompts FOR ALL TO authenticated
  USING (public.is_brand_member(brand_id, auth.uid())) WITH CHECK (public.is_brand_member(brand_id, auth.uid()));
CREATE TRIGGER prompts_updated_at BEFORE UPDATE ON public.prompts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ prompt runs ============
CREATE TABLE public.prompt_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  engine TEXT NOT NULL DEFAULT 'gemini',
  brand_mentioned BOOLEAN NOT NULL DEFAULT false,
  position SMALLINT,
  answer_summary TEXT,
  raw_answer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_runs TO authenticated;
GRANT ALL ON public.prompt_runs TO service_role;
ALTER TABLE public.prompt_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prompt_runs_all" ON public.prompt_runs FOR ALL TO authenticated
  USING (public.is_brand_member(brand_id, auth.uid())) WITH CHECK (public.is_brand_member(brand_id, auth.uid()));

-- ============ citations ============
CREATE TABLE public.citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  run_id UUID REFERENCES public.prompt_runs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  is_own_domain BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.citations TO authenticated;
GRANT ALL ON public.citations TO service_role;
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "citations_all" ON public.citations FOR ALL TO authenticated
  USING (public.is_brand_member(brand_id, auth.uid())) WITH CHECK (public.is_brand_member(brand_id, auth.uid()));

-- ============ claims ============
CREATE TABLE public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  statement TEXT NOT NULL,
  evidence_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.claims TO authenticated;
GRANT ALL ON public.claims TO service_role;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "claims_all" ON public.claims FOR ALL TO authenticated
  USING (public.is_brand_member(brand_id, auth.uid())) WITH CHECK (public.is_brand_member(brand_id, auth.uid()));
CREATE TRIGGER claims_updated_at BEFORE UPDATE ON public.claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ geo tasks ============
CREATE TABLE public.geo_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'todo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.geo_tasks TO authenticated;
GRANT ALL ON public.geo_tasks TO service_role;
ALTER TABLE public.geo_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "geo_tasks_all" ON public.geo_tasks FOR ALL TO authenticated
  USING (public.is_brand_member(brand_id, auth.uid())) WITH CHECK (public.is_brand_member(brand_id, auth.uid()));
CREATE TRIGGER geo_tasks_updated_at BEFORE UPDATE ON public.geo_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ reports ============
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT SELECT ON public.reports TO anon;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_members" ON public.reports FOR ALL TO authenticated
  USING (public.is_brand_member(brand_id, auth.uid())) WITH CHECK (public.is_brand_member(brand_id, auth.uid()));
CREATE POLICY "reports_public_read" ON public.reports FOR SELECT TO anon USING (is_public = true);
CREATE TRIGGER reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ indexes ============
CREATE INDEX idx_brand_members_user ON public.brand_members(user_id);
CREATE INDEX idx_brand_domains_brand ON public.brand_domains(brand_id);
CREATE INDEX idx_knowledge_sources_brand ON public.knowledge_sources(brand_id);
CREATE INDEX idx_prompts_brand ON public.prompts(brand_id);
CREATE INDEX idx_prompt_runs_brand ON public.prompt_runs(brand_id);
CREATE INDEX idx_citations_brand ON public.citations(brand_id);
CREATE INDEX idx_claims_brand ON public.claims(brand_id);
CREATE INDEX idx_geo_tasks_brand ON public.geo_tasks(brand_id);
CREATE INDEX idx_reports_token ON public.reports(token);