CREATE TABLE public.bing_webmaster_accounts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  api_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id)
);

GRANT ALL ON public.bing_webmaster_accounts TO service_role;

ALTER TABLE public.bing_webmaster_accounts ENABLE ROW LEVEL SECURITY;
-- Anahtar hicbir istemciye acilmaz; sadece sunucu tarafi (service_role) okur.