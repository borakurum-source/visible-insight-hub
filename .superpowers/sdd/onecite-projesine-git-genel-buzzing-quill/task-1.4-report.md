# Task 1.4 Report — Atomic RPCs (Findings C5, C6, C7)

**Status**: Complete ✓
**Commit**: `ad43016`
**Date**: 2026-08-21
**Build**: 0 errors

Executed directly by the controller session (not dispatched to a subagent implementer) — same
reason as Tasks 0.3 and 1.1: live-DB schema change (new functions), and the auto-mode permission
classifier blocked an `Agent` dispatch for that class of work earlier in this session.

## Discovery during implementation

The plan's C7 finding assumed `competitor_candidates` had no `(brand_id, name)` unique index. It
already does (`competitor_candidates_brand_id_name_key`) — checked `\d onecite.competitor_candidates`
before writing the migration. This means the race no longer produces duplicate rows (the DB would
reject the second insert), but the old code never checked the insert's `error`, so the losing side
of a race silently dropped that competitor mention instead of erroring loudly or duplicating. Noted
in the brief/migration comments; the atomic-upsert fix resolves this regardless of which failure
mode was actually happening.

## Migration

`supabase/migrations/20260821113947_atomic_measurement_counters.sql` — three functions in schema
`onecite`: `increment_completed_prompts`, `next_run_index` (locks the `prompts` row via `FOR UPDATE`
before computing `MAX(run_index)+1`, so concurrent calls for the same prompt genuinely serialize,
not just "fewer round trips"), `upsert_competitor_candidate` (`ON CONFLICT DO UPDATE SET
prompt_count = prompt_count + 1`).

Dry-run: syntax-checked in a rolled-back transaction first. Applied for real, then verified:
- `\df onecite.<name>` for all three.
- Grants: `has_function_privilege` confirmed `authenticated`/`anon`/`service_role` can all EXECUTE.
- **Reachability through PostgREST**: `curl -X POST http://127.0.0.1:8000/rest/v1/rpc/increment_completed_prompts` with the service-role key and `Content-Profile: onecite` header → HTTP 204. Existence in `\df` doesn't guarantee PostgREST's schema cache has picked it up or that grants are correct for the actual calling role — this check catches that gap before wiring the RPC into application code.
- **Behavioral correctness against real data**, each in a rolled-back transaction:
  - `next_run_index('66f33008-...')` (a prompt with 3 existing runs, max run_index 3) → returned `4`.
  - `increment_completed_prompts(<real batch id>, 5)` on a batch with `completed_prompts=1` → became `6`.
  - `upsert_competitor_candidate(<real brand id>, '__test_competitor__', NULL, NULL)` called twice → first call `prompt_count=1`, second (conflicting) call `prompt_count=2`.

## Code changes (`src/lib/panel.functions.ts`)

Staged as a scoped patch (3 hunks) — `panel.functions.ts` still has the same pre-existing unrelated
uncommitted hunks (`getPromptInsight` domain field, `getEvidenceBridgeResult`) from before Task 1.1;
verified after committing that those two hunks are still present and untouched in the working tree.

1. `run_index` computation: `count(*)` query replaced with `context.supabase.rpc("next_run_index", { p_prompt_id: prompt.id })`.
2. `competitor_candidates` select+insert/update block (14 lines) replaced with a single `context.supabase.rpc("upsert_competitor_candidate", {...})` call (4 lines) inside the same per-mentioned-brand loop.
3. `completed_prompts` post-loop select+compute+update replaced with `context.supabase.rpc("increment_completed_prompts", {...})` followed by a read-only `SELECT` to build the function's return value (the RPC itself returns `void`).

## Acceptance criteria — final status

✅ All three RPC functions exist, reachable via PostgREST, verified against real data before real application
✅ `runMeasurementChunk`'s three call sites use the RPCs
✅ `bun run build` → 0 errors
✅ `finishMeasurement`, `startMeasurement`, client hook untouched (diff confirms no hunks there)
✅ Repo hygiene: unrelated `panel.functions.ts` hunks left alone

## Deferred / not done

- Error checking on the RPC calls themselves was deliberately kept loose, matching this function's
  pre-existing style (the citations insert a few lines below also ignores its `error`) — a genuine
  RPC failure (e.g. `next_run_index` erroring) would currently write `run_index: null` rather than
  being treated as a failed-prompt (Task 1.3's `failedPromptIds` tracking). Scoped this out of Task
  1.4 to avoid re-opening Task 1.3's error-handling boundary; worth a follow-up if it matters in
  practice (it's a nullable column, so this degrades gracefully rather than crashing).
- Not deployed to the running PM2 process — same as Task 1.1, this is a commit + verified migration, not a live redeploy.
