# Task 0.4 — Clean Stalled Batch (ABS Kör Kalıp)

## Requirement

OneCite has a batch stuck in `running` state since 2026-08-16, blocking proper visibility metrics for ABS Kör Kalıp brand.

**Current state:**
- Brand: ABS Kör Kalıp
- Batch status: `running`
- Batch created: 2026-08-16 (4+ days ago)
- Progress: 3/10 prompts completed
- Impact: Measurement page shows batch in perpetual progress; user cannot start new round; score calculation uses incomplete data

**Root cause (from findings C4):**
- Measurement loop runs in browser (`use-measurement-run.ts:18-42`)
- If user closes tab/browser before `finishMeasurement` is called, batch stays `running` forever
- No server-side timeout or cleanup job exists

## Change Required

**One-time cleanup (this task):**
- Update ABS Kör Kalıp's stalled batch to status `failed`
- Mark batch `finished_at` with current timestamp
- Rationale: batch is 4+ days old, clearly abandoned; manual reset safer than auto-retry

**Permanent solution (Faz 1, Task 1.6):**
- Add pg_cron job to mark batches `failed` if `status='running'` for >60 minutes
- This task does the manual version only

## Steps

1. **Identify batch ID:**
   ```sql
   SELECT id, brand_id, status, created_at, completed_prompts, total_prompts 
   FROM onecite.measurement_batches 
   WHERE brand_id = (SELECT id FROM brands WHERE name = 'ABS Kör Kalıp')
   AND status = 'running'
   ORDER BY created_at DESC;
   ```

2. **Verify batch data:**
   - Confirm `completed_prompts = 3, total_prompts = 10`
   - Confirm `created_at` is from 2026-08-16
   - If multiple batches match: select oldest one

3. **Update batch status:**
   ```sql
   UPDATE onecite.measurement_batches 
   SET status = 'failed', finished_at = NOW() 
   WHERE id = [batch_id];
   ```

4. **Verify update:**
   ```sql
   SELECT id, status, finished_at FROM onecite.measurement_batches 
   WHERE id = [batch_id];
   ```
   Should show: `status='failed'`, `finished_at=[current timestamp]`

## Acceptance Criteria

✅ Batch identified and verified (3/10 progress, created 2026-08-16)
✅ Batch status changed from `running` → `failed`
✅ `finished_at` timestamp populated with current time
✅ Verify query confirms update took effect
✅ ABS Kör Kalıp measurement page no longer shows "Ölçülüyor…" on page load
✅ New measurement rounds can be started for ABS Kör Kalıp

## Global Constraints

- Supabase self-hosted `onecite` schema, `onecite` role
- No cascading deletes (keep batch record for audit trail)
- No changes to code (this is data cleanup only)
- Changes made via direct SQL (or Supabase CLI if preferred)

## Testing

After cleanup:
1. Log in as ABS Kör Kalıp user
2. Navigate to /app/measurement
3. Verify: no "Ölçülüyor…" loading state
4. Verify: "Ölçümü başlat" button is enabled (not grayed out)
5. Optionally: start a new measurement round to confirm button works

## Deliverable

Report should include:
- SQL commands executed
- Before/after batch state (SELECT result)
- Timestamp of update
- Verification that measurement page no longer shows stalled state

This is a small data cleanup task; no code changes or migrations.
