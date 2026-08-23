-- Prompt Opportunities: Kalıcı Fırsat Defteri
-- Adayları DB'ye yazarak kalıcılık, durum makinesi ve ölçüm öncesi skoru sağlar.
-- ragsignalgeo'nun Prompt Discovery v3 fikirlerini OneCite talep motoruna adapte eder.

-- Tablo: prompt_opportunities
-- Unique key: (brand_id, text_normalized) — tekilleştirme DB'de üretilmiş kolon üzerinde
CREATE TABLE onecite.prompt_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES onecite.brands(id) ON DELETE CASCADE,
  batch_id uuid REFERENCES onecite.measurement_batches(id) ON DELETE SET NULL,
  text text NOT NULL,
  -- Tekilleştirme anahtarı: DB üretir, TS çekvermez. GENERATED ALWAYS ... STORED.
  text_normalized text GENERATED ALWAYS AS (onecite.normalize_prompt_text(text)) STORED,
  cluster text NOT NULL DEFAULT 'genel',
  intent text,                           -- from prompt-demand: informational|commercial|...
  shape text,                            -- from prompt-demand: keyword|question|...
  rationale text,                        -- LLM'in aday oluşturma sebebi
  evidence_gap_type text,                -- Canonical Türkçe: Karşılaştırma içeriği | Bağımsız kanıt | ...
  observed_demand numeric,               -- NULL = gözlenmedi. Uydurulmaz.
  demand_source text,                    -- measured | modeled | calibrated | estimated
  demand_origin text,                    -- gsc | onecite | model
  observed_visibility numeric,           -- 0-100 | NULL = henüz ölçülmedi
  observation_count integer NOT NULL DEFAULT 0,
  panel jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{model, brand_mentioned, position, sources[]}, ...]
  expected_value numeric,                -- NULL = yayımlanabilir değil
  confidence text,                       -- high | medium | low
  status text NOT NULL DEFAULT 'new',    -- new|measuring|actionable|deferred|tracked|rejected
  status_reason text,                    -- neyin eksik: "GSC bağlı değil" / "henüz ölçülmedi" / ...
  promoted_prompt_id uuid REFERENCES onecite.prompts(id) ON DELETE SET NULL,  -- "Promptlara ekle"
  geo_task_id uuid REFERENCES onecite.geo_tasks(id) ON DELETE SET NULL,      -- "Aksiyon oluştur"
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tekilleştirme index: brand_id + text_normalized
CREATE UNIQUE INDEX idx_prompt_opportunities_brand_text
  ON onecite.prompt_opportunities (brand_id, text_normalized);

-- Sorgu index: durum filtresi + sıralama
CREATE INDEX idx_prompt_opportunities_brand_status
  ON onecite.prompt_opportunities (brand_id, status, expected_value DESC NULLS LAST);

-- RLS: Kullanıcı-yazılabilir kademe (site_health/geo_tasks ile aynı)
-- Kullanıcı kendi reddet/onayla kararlarını yazıyor.
ALTER TABLE onecite.prompt_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY prompt_opportunities_member ON onecite.prompt_opportunities
  FOR ALL TO authenticated
  USING (onecite.is_brand_member(brand_id, auth.uid()))
  WITH CHECK (onecite.is_brand_member(brand_id, auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON onecite.prompt_opportunities TO authenticated;
GRANT ALL ON onecite.prompt_opportunities TO service_role;

-- Otomatik updated_at
CREATE TRIGGER set_prompt_opportunities_updated_at
  BEFORE UPDATE ON onecite.prompt_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION onecite.update_updated_at_column();
