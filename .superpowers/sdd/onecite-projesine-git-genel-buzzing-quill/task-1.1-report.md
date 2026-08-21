# Task 1.1 Report — prompt_runs.batch_id (Finding C3)

**Status**: Complete ✓
**Commits**: `c4aded7`
**Date**: 2026-08-21
**Build**: 0 errors

Executed directly by the controller session (not dispatched to a subagent implementer) — the same reason as Task 0.3's fix round: this task requires a live-DB schema change + backfill, and the auto-mode permission classifier blocked an `Agent` dispatch for that class of work earlier in this session. The human partner had already approved direct execution for DB-touching work in this plan.

## Migration

`supabase/migrations/20260821111732_prompt_runs_batch_id.sql`:
- `ALTER TABLE onecite.prompt_runs ADD COLUMN batch_id uuid REFERENCES onecite.measurement_batches(id) ON DELETE SET NULL`
- `CREATE INDEX idx_prompt_runs_batch ON onecite.prompt_runs(batch_id)`
- Backfill UPDATE matching each run to the batch (same brand) whose `[created_at, finished_at ?? now()]` window contains the run, using `DISTINCT ON (run_id) ... ORDER BY batch.created_at DESC` to pick the innermost match if windows ever overlap.

**Dry run first**: wrapped the whole migration in `BEGIN; ... ROLLBACK;` against the live DB and checked `count(*) vs count(batch_id)` on `prompt_runs` before applying for real — 73/73 matched, 0 unmatched, 0 ambiguity.

**Applied for real**: same result, 73/73 backfilled. Verified `\d onecite.prompt_runs` shows the column, index, and FK.

**Regression check against real data**: for every existing `measurement_batches` row, compared `count(prompt_runs where batch_id = X)` against the old time-window query (`brand_id` + `created_at` between batch start/finish) — identical counts for all 9 batches checked (0, 1, 2, 5, 10, 13, 14, 14, 14 runs).

## Code changes (`src/lib/panel.functions.ts`)

Staged as a scoped patch (5 hunks only) rather than a wholesale `git add`, because the working tree had pre-existing unrelated uncommitted changes in this same file (a `domain` field addition to `getPromptInsight` and a new `getEvidenceBridgeResult` function — neither related to this task, left untouched and still uncommitted).

1. `runMeasurementChunk`: `batch_id: data.batchId` added to the `prompt_runs` insert.
2. `finishMeasurement`: the `runs` query for `computeVisibilityScore` now filters `.eq("batch_id", data.batchId)` in addition to `brand_id`. Citations/knowledge_sources/claims queries unchanged (stay brand-wide/cumulative — see brief's rationale).
3. `listMeasurementRounds`: per-round `runCount` now `.eq("batch_id", batch.id)` instead of the `created_at` window.
4. `listRunCitations`: `batchId` filter now `.eq("batch_id", data.batchId)` instead of fetching the batch row and computing a window — this also removes an extra DB round-trip per call.
5. `startMeasurement`'s open-batch resume check ("which prompts were already measured in the batch I'm continuing") switched from `gte(created_at, openBatch.created_at)` to `.eq("batch_id", openBatch.id)` — not explicitly listed in the brief but the same class of fix (this code was doing the exact same time-window guess the brief calls out for the other two functions), fixed for consistency.

## Acceptance criteria — final status

✅ Migration applies cleanly, backfill 73/73 matched
✅ `bun run build` → 0 errors
✅ Spot-check against real data: batch_id counts match old time-window counts for all 9 existing batches
✅ `finishMeasurement`'s score-relevant `runs` query is batch-scoped
✅ No public API/return-shape changes to `listMeasurementRounds`, `listRunCitations`, `finishMeasurement`

## Not done / deferred

- The running PM2 process (`onecite`, id 15) was **not restarted** — this commit is in git and builds cleanly locally, but is not yet deployed to the live `1cite.com` traffic. Deploy was out of scope for this task (same as Tasks 0.1-0.4, which also landed as commits without an explicit redeploy step) — flag to the human partner before ending this session if a deploy is wanted.
- Did not add a separate "cumulative score" field to `measurement_batches` even though the plan text says one "may" exist (`kümülatif skor ayrı bir alan olarak kalabilir`) — checked all consumers of `measurement_batches.score` (`listMeasurementRounds`, `getVisibilityAnalytics` trend) and both want the per-round meaning; `getMeasurementState` (the dashboard's "current score" tile) computes its own live score independently and never reads `batch.score`, so nothing depends on the old cumulative meaning. Judged the extra field unnecessary; can revisit if a future task needs it.
