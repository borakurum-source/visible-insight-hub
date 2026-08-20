# Task 0.2 — Measurement Screen Round-Based View

## Requirement (Finding A1)

OneCite measurement screen currently shows a flat list of runs, creating duplicate perception when multiple rounds exist.

**Current problem:**
- Snacks For Party has 15 approved prompts
- Last 2 measurement rounds each ran 15 prompts = 30 total runs
- `listRunCitations` returns all 30 as flat list (line 51: `limit: 30`)
- UI shows 30 rows → user sees each prompt twice
- `createdAt` IS available (returned at line 425) but NOT displayed on screen

**Fix:** Group runs by measurement round, show each round as a selectable view, default to latest round.

## Changes Required

### 1. New Server Function: `listMeasurementRounds()`

Create or modify `listRunCitations` flow to return:
- Array of "rounds" (measurement batches), each containing:
  - `batchId`: identifier (for now, use latest created_at timestamp of runs in that round)
  - `roundDate`: earliest `created_at` in this batch
  - `score`: placeholder null (will be implemented in Phase 1)
  - `runs`: array of run objects with promptText, brandMentioned, position, sources (same as current listRunCitations)

**Grouping logic (Phase 0 interim):**
- Fetch all runs for brand from `measurement_batches` join, ordered by batch `created_at` DESC
- Return latest 3-5 batches with their runs
- Batch boundary: use `measurement_batches.id` if available; if not, group runs by time proximity (runs within same 1-minute window = same batch)

### 2. UI Changes: `app.measurement.tsx`

**Add round selector:**
- Below the "Ölçümü başlat" button, add a tabs or radio-group selector showing recent rounds:
  - Label: `{formatDate(round.roundDate)} — {round.score ?? "Hesaplanıyor"} puan`
  - Default: latest (first) round selected
  
**Display round info in run list:**
- Each run row should show `createdAt` (currently hidden) OR round indicator
- Optional: show "Round 3 • 5 min ago" above the Accordion

**Fix duplicate perception:**
- With round selector, user sees only runs from ONE round
- Snacks For Party: selecting latest round shows 15 rows (not 30)

### 3. Server-Side Grouping (Preferred)

Modify `listRunCitations` (line 385–428) to accept `batchId?: string` parameter:
- If `batchId` provided: return runs only from that batch
- If not provided: return list of batches (metadata only), client chooses one, then calls again with batchId
- Alternatively: return both in one call (rounds array + default round's runs)

**Path (simpler):** 
- Keep `listRunCitations` as is
- Create new `listMeasurementRounds()` that returns `{ rounds: Array<{batchId, roundDate, runCount}> }`
- Modify UI to call `listMeasurementRounds()` first, then `listRunCitations({ batchId: selected })`

## Acceptance Criteria

✅ Round selector visible on measurement screen
✅ Snacks For Party shows 15 runs (not 30) when latest round selected
✅ Selecting a different round re-fetches/displays only that round's runs
✅ No new migrations needed (use existing `measurement_batches` and run `created_at`)
✅ UI displays round date in selector: "Aug 20, 10:35 am — 42 puan"
✅ Build: `bun run build` → 0 errors

## Global Constraints

- No new tables or migrations in Phase 0
- Use existing `measurement_batches.created_at` and run `created_at` for grouping
- Error message "Marka bulunamadı" pattern (already established)
- No changes to run data structure; only grouping/filtering logic
- Round selection should be intuitive for multi-batch scenarios (Snacks For Party has 2+, others will too)
