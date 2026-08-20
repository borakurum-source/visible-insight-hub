CREATE TABLE onecite.prompt_action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES onecite.brands(id) ON DELETE CASCADE,
  prompt_id uuid NOT NULL REFERENCES onecite.prompts(id) ON DELETE CASCADE,
  action_key text NOT NULL,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium',
  done boolean NOT NULL DEFAULT false,
  done_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prompt_id, action_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON onecite.prompt_action_items TO authenticated;
GRANT ALL ON onecite.prompt_action_items TO service_role;

ALTER TABLE onecite.prompt_action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prompt_action_items_all" ON onecite.prompt_action_items
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = prompt_action_items.brand_id AND m.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM onecite.brand_members m WHERE m.brand_id = prompt_action_items.brand_id AND m.user_id = auth.uid()));

CREATE INDEX prompt_action_items_prompt_idx ON onecite.prompt_action_items (prompt_id);

CREATE TRIGGER prompt_action_items_updated_at
BEFORE UPDATE ON onecite.prompt_action_items
FOR EACH ROW EXECUTE FUNCTION onecite.update_updated_at_column();