-- Task 1.1 (Finding C3): prompt_runs had no link back to the measurement_batches
-- round it belongs to. finishMeasurement's score was computed from ALL-time
-- prompt_runs instead of the round just completed, and listMeasurementRounds /
-- listRunCitations approximated round membership with a created_at time-window
-- (fragile: overlapping/resumed batches can straddle windows).

ALTER TABLE onecite.prompt_runs
  ADD COLUMN batch_id uuid REFERENCES onecite.measurement_batches(id) ON DELETE SET NULL;

CREATE INDEX idx_prompt_runs_batch ON onecite.prompt_runs(batch_id);

-- Backfill: for each existing run with no batch_id, attach it to the batch
-- (same brand) whose [created_at, finished_at] window contains the run's
-- created_at — the same window logic listMeasurementRounds/listRunCitations
-- use today. A run's timestamp can fall inside more than one batch's window
-- only if batches overlap (e.g. a resumed batch scenario); DISTINCT ON picks
-- the batch with the latest created_at at or before the run, which is the
-- innermost/most-specific match.
UPDATE onecite.prompt_runs pr
SET batch_id = matched.id
FROM (
  SELECT DISTINCT ON (pr2.id)
    pr2.id AS run_id,
    mb.id
  FROM onecite.prompt_runs pr2
  JOIN onecite.measurement_batches mb
    ON mb.brand_id = pr2.brand_id
   AND pr2.created_at >= mb.created_at
   AND pr2.created_at <= COALESCE(mb.finished_at, now())
  ORDER BY pr2.id, mb.created_at DESC
) matched
WHERE pr.id = matched.run_id
  AND pr.batch_id IS NULL;
