# Task 1.1 — prompt_runs.batch_id (Finding C3)

## Requirement

`prompt_runs` has no column linking a run back to the `measurement_batches` round
it was measured in. Two consequences:

1. `finishMeasurement` computes the round's score from **all-time** runs for the
   brand, not just the round that just finished. `getVisibilityAnalytics`'s trend
   chart reads `measurement_batches.score` per batch, so with an all-time score
   written into every batch, the trend is flat/misleading instead of showing real
   round-to-round movement.
2. `listMeasurementRounds` and `listRunCitations` approximate "which runs belong to
   this round" with a `created_at` time-window (`gte(batch.created_at)`,
   `lte(batch.finished_at ?? now())`). This breaks if batches ever overlap (e.g. a
   resumed batch scenario in `startMeasurement`, or clock skew).

## Changes Required

1. **Migration**: `ALTER TABLE onecite.prompt_runs ADD COLUMN batch_id uuid
   REFERENCES onecite.measurement_batches(id) ON DELETE SET NULL` + index.
   **Backfill** existing rows: for each run, find the batch (same brand) whose
   `[created_at, finished_at ?? now()]` window contains the run's `created_at` —
   this mirrors the exact heuristic the code used before, so it should reproduce
   today's (correct-enough) round membership for historical data. Guard against a
   run matching more than one batch (overlapping/resumed batches) by picking the
   batch with the latest `created_at` at or before the run.
2. **`runMeasurementChunk`**: set `batch_id: data.batchId` when inserting each new
   `prompt_runs` row.
3. **`finishMeasurement`**: the `runs` query (used for `brand_mentioned`/`position`
   in `computeVisibilityScore`) should filter by `batch_id = data.batchId`, not just
   `brand_id`. The other score inputs (citations, knowledge_sources, claims) stay
   brand-wide/cumulative — they describe the brand's current state, not a
   per-round measurement.
4. **`listMeasurementRounds`**: per-round `runCount` should query
   `.eq("batch_id", batch.id)` instead of the time-window.
5. **`listRunCitations`**: when `batchId` is passed, filter runs with
   `.eq("batch_id", data.batchId)` instead of fetching the batch row and computing
   a time window.
6. **`startMeasurement`**'s open-batch resume path (finding "already-done" prompt
   ids to skip when continuing a fresh `running` batch) should also switch from
   `gte(created_at, openBatch.created_at)` to `.eq("batch_id", openBatch.id)`.

## Acceptance Criteria

- Migration applies cleanly; every existing `prompt_runs` row that has a matching
  batch window gets a non-null `batch_id` (verify: `count(*) = count(batch_id)`
  for rows created within some batch's window).
- `bun run build` → 0 errors.
- Spot-check: for several existing batches, `count(prompt_runs where batch_id =
  X)` matches what the old time-window query would have returned (regression
  check against real data, not just schema correctness).
- `finishMeasurement`'s score-relevant `runs` query is scoped to the batch, not
  brand-wide.

## Global Constraints

- TypeScript + Supabase RLS (no new dependencies).
- Do not change the public shape/contract of `listMeasurementRounds`,
  `listRunCitations`, or `finishMeasurement`'s return value — only the underlying
  query logic changes.
- Live production database (`1cite.com` self-hosted Supabase) — migration and
  backfill must be verified (dry-run in a rolled-back transaction) against real
  data before being applied for real.
