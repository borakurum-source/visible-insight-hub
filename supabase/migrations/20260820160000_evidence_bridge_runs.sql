-- Evidence Bridge: brand-competitor kanıt analiz sonuçları
-- Faz 1: AI yanıtı + brand nedenleri
-- Faz 2: Firecrawl extract (kanıt çıkarımı)
-- Faz 3: Sentez (içerik öncelikleri)

CREATE TABLE onecite.evidence_bridge_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES onecite.brands(id) ON DELETE CASCADE,
  prompt_id uuid REFERENCES onecite.prompts(id) ON DELETE SET NULL,
  competitor_domain text NOT NULL,

  -- Faz 1: AI ölçümü
  ai_response_raw text,
  ai_response_parsed jsonb,

  -- Faz 2: Firecrawl kanıt çıkarımı
  firecrawl_brand jsonb,
  firecrawl_competitor jsonb,

  -- Faz 3: Sentez (DeepSeek)
  content_priorities jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Batch izleme (measurement_batches deseni)
  batch_id uuid REFERENCES onecite.measurement_batches(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  error text,

  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE INDEX evidence_bridge_brand_idx ON onecite.evidence_bridge_runs (brand_id, created_at DESC);
CREATE INDEX evidence_bridge_batch_idx ON onecite.evidence_bridge_runs (batch_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON onecite.evidence_bridge_runs TO authenticated;
GRANT ALL ON onecite.evidence_bridge_runs TO service_role;

ALTER TABLE onecite.evidence_bridge_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evidence_bridge_all" ON onecite.evidence_bridge_runs FOR ALL TO authenticated
  USING (onecite.is_brand_member(brand_id, auth.uid()))
  WITH CHECK (onecite.is_brand_member(brand_id, auth.uid()));

COMMENT ON TABLE onecite.evidence_bridge_runs IS 'Kanıt Köprüsü çalıştırmaları: marka vs rakip kanıt analizi ve içerik önerilerine dönüştürülmesi.';
COMMENT ON COLUMN onecite.evidence_bridge_runs.content_priorities IS 'Aşama 3 sentez çıktısı: gap, linked_reason, suggested_format, page_type, priority içeren dizi.';
