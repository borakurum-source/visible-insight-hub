# Task 1.4 — Atomic counters for completed_prompts / run_index / competitor_candidates (Findings C5, C6, C7)

## Requirement

Three read-then-write races in `runMeasurementChunk` (`src/lib/panel.functions.ts`):

- **C5** — `measurement_batches.completed_prompts` is read, incremented in JS, then written back
  once per chunk call, after the per-prompt loop. Concurrent chunk calls (e.g. two browser tabs
  measuring the same brand) can lose an update.
- **C6** — `prompt_runs.run_index` is computed via a `count(*)` query on `prompt_runs` before each
  insert. Two concurrent runs for the same prompt can both read the same count and both insert the
  same `run_index`.
- **C7** — `competitor_candidates` is select-then-insert-or-update. A `(brand_id, name)` unique
  index already exists on this table (`competitor_candidates_brand_id_name_key` — verify this is
  still true when you start; the plan text assumed it was missing, it isn't), so a race no longer
  creates a duplicate row, but the losing insert throws a unique-violation the current code never
  checks, silently dropping that competitor mention.

## Changes Required

1. **Migration**: three Postgres functions in schema `onecite`, callable via
   `context.supabase.rpc(...)` (this Supabase client is already configured for the `onecite`
   schema elsewhere in the codebase):
   - `increment_completed_prompts(p_batch_id uuid, p_delta integer) returns void` — single
     `UPDATE ... SET completed_prompts = completed_prompts + p_delta WHERE id = p_batch_id`.
   - `next_run_index(p_prompt_id uuid) returns integer` — must be genuinely atomic under
     concurrency, not just "one fewer round trip": lock the `prompts` row for `p_prompt_id`
     (`SELECT 1 FROM onecite.prompts WHERE id = p_prompt_id FOR UPDATE`) before computing
     `COALESCE(MAX(run_index), 0) + 1` from `prompt_runs`, so concurrent calls for the same prompt
     serialize instead of racing.
   - `upsert_competitor_candidate(p_brand_id uuid, p_name text, p_run_id uuid, p_prompt_id uuid)
     returns void` — `INSERT ... ON CONFLICT (brand_id, name) DO UPDATE SET prompt_count =
     competitor_candidates.prompt_count + 1, updated_at = now()`.
   - Verify each function is actually reachable through PostgREST after applying (not just that it
     exists in `\df` — PostgREST schema cache / grants can lag) before wiring it into application
     code. A direct `curl` against the RPC endpoint with the service-role key is a fast way to
     confirm.
2. **`runMeasurementChunk`**:
   - Replace the `count(*)`-then-insert `run_index` computation with
     `context.supabase.rpc("next_run_index", { p_prompt_id: prompt.id })`.
   - Replace the select+insert/update `competitor_candidates` block with a single
     `context.supabase.rpc("upsert_competitor_candidate", { p_brand_id, p_name, p_run_id, p_prompt_id })`
     call per mentioned brand.
   - Replace the post-loop select+compute+update for `completed_prompts` with
     `context.supabase.rpc("increment_completed_prompts", { p_batch_id, p_delta })`, then a
     read-only `SELECT completed_prompts, total_prompts` to build the function's return value (the
     RPC itself returns `void`; the read-back is safe, not a write-race, since it's not used to
     compute the next write).

## Acceptance Criteria

- All three RPC functions exist, are callable through PostgREST, and were verified against real
  data (in a rolled-back transaction, not live-mutated) before the migration was applied for real:
  `next_run_index` on a prompt with existing runs returns `max(run_index)+1`;
  `increment_completed_prompts` correctly adds the delta to a real batch's counter;
  `upsert_competitor_candidate` inserts with `prompt_count=1` on first call and increments to `2`
  on a conflicting second call.
- `runMeasurementChunk`'s three call sites use the RPCs instead of the old read-then-write pattern.
- `bun run build` → 0 errors.
- Task 1.3's try/catch scope and empty-`promptIds` handling (Task 1.2) are untouched — this task
  only changes the three specific read-then-write patterns above.

## Global Constraints

- TypeScript + Supabase RLS (no new dependencies).
- Live production database — dry-run every migration statement and every new function's behavior
  against real data (in a rolled-back transaction) before applying for real, matching Tasks 0.3 and
  1.1's precedent.
- Do not touch `finishMeasurement`, `startMeasurement`, or the client hook — only
  `runMeasurementChunk`'s three race-prone spots.
- Repo hygiene: `panel.functions.ts` has pre-existing unrelated uncommitted hunks (a `domain` field
  on `getPromptInsight`, a new `getEvidenceBridgeResult` function) that must not be touched or
  committed — stage only this task's own hunks via a scoped patch, never `git add -A`/`git add .`.
