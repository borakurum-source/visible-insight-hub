-- Task 1.4 (Findings C5, C6, C7): three read-then-write races in the measurement loop.
-- All three become single atomic SQL statements instead of a JS select+insert/update pair.

-- C5: measurement_batches.completed_prompts was read, incremented in JS, then written back
-- (panel.functions.ts, after the runMeasurementChunk loop) — a lost update under concurrent chunks.
CREATE OR REPLACE FUNCTION onecite.increment_completed_prompts(p_batch_id uuid, p_delta integer)
RETURNS void AS $$
  UPDATE onecite.measurement_batches
  SET completed_prompts = completed_prompts + p_delta
  WHERE id = p_batch_id;
$$ LANGUAGE sql;

-- C6: prompt_runs.run_index was computed via a separate count(*) query before the insert — two
-- concurrent runs for the same prompt could both count N and both insert run_index N+1. Locks the
-- prompt row (onecite.prompts) for the duration of the function so concurrent calls for the same
-- prompt_id serialize instead of racing; unrelated prompts are unaffected.
CREATE OR REPLACE FUNCTION onecite.next_run_index(p_prompt_id uuid)
RETURNS integer AS $$
DECLARE
  v_index integer;
BEGIN
  PERFORM 1 FROM onecite.prompts WHERE id = p_prompt_id FOR UPDATE;
  SELECT COALESCE(MAX(run_index), 0) + 1 INTO v_index FROM onecite.prompt_runs WHERE prompt_id = p_prompt_id;
  RETURN v_index;
END;
$$ LANGUAGE plpgsql;

-- C7: competitor_candidates was select-then-insert/update from JS. onecite.competitor_candidates
-- already has a (brand_id, name) unique constraint (competitor_candidates_brand_id_name_key), so a
-- genuine race no longer creates a duplicate row — but it does throw a unique-violation on the
-- losing insert, which the calling code doesn't check, silently dropping that mention. Replaces
-- select+insert/update with one atomic upsert.
CREATE OR REPLACE FUNCTION onecite.upsert_competitor_candidate(
  p_brand_id uuid, p_name text, p_run_id uuid, p_prompt_id uuid
) RETURNS void AS $$
  INSERT INTO onecite.competitor_candidates (brand_id, name, first_seen_run_id, first_seen_prompt_id, prompt_count, status)
  VALUES (p_brand_id, p_name, p_run_id, p_prompt_id, 1, 'new')
  ON CONFLICT (brand_id, name) DO UPDATE
    SET prompt_count = onecite.competitor_candidates.prompt_count + 1,
        updated_at = now();
$$ LANGUAGE sql;
