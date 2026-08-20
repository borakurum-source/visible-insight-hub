# Task 0.3 — Prompt Deduplication + Unique Index

## Requirement (Finding A2)

OneCite database allows identical prompt text to be stored twice, causing duplicate measurements and wasted API costs.

**Current problem:**
```
f6125493… | "Online sipariş verilebilen catering şirketleri listele" | 10:35:36.98
fae2f3c1… | "Online sipariş verilebilen catering şirketleri listele" | 10:35:41.41
```

Both approved, both measured each round:
- Snacks For Party: duplicate prompt measured twice per measurement run
- API cost: same prompt to Perplexity 2× per round (20+30 = 50 extra citations)
- Score impact: denominator inflated, visibility metrics skewed

**Root cause:** 
- `prompts` table has NO `(brand_id, text)` unique index
- Write paths (`createPrompt`, `addDiscoveredPrompts`, `setPromptStatus`) have NO dedup check
- UI ("İlk 10 promptu izlemeye al" button) can be clicked twice, creating duplicate prompt texts

## Changes Required

### 1. Database: Add Unique Index

Create migration adding normalized unique constraint:

```sql
-- Türkçe normalizasyon: İ/ı → i/I, trim whitespace, lowercase
CREATE OR REPLACE FUNCTION normalize_prompt_text(text TEXT) RETURNS TEXT AS $$
  SELECT LOWER(BTRIM(REPLACE(REPLACE(text, 'İ', 'i'), 'ı', 'i')))
$$ LANGUAGE SQL IMMUTABLE;

CREATE UNIQUE INDEX idx_prompts_brand_text 
  ON onecite.prompts(brand_id, normalize_prompt_text(text))
  WHERE status = 'approved';
```

**Note:** Constraint applies only to `approved` prompts to allow in-flight candidates to be renamed/merged.

### 2. TypeScript: Normalization Helper

Create `src/lib/prompt-normalize.ts`:
```typescript
export function normalizePromptText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[İi]/g, 'i') // Turkish İ/ı → lowercase i
    .replace(/[Ş]/g, 'ş')   // Turkish Ş edge cases
    .trim();
}
```

Use in both DB and TS to ensure consistency.

### 3. Write Paths: Add Dedup Check

**`createPrompt` (line 527-538):**
- Before inserting, normalize `data.text`
- Check if brand already has prompt with normalized text: `SELECT id FROM prompts WHERE brand_id = $brandId AND normalize_prompt_text(text) = $normalized AND status = 'approved'`
- If exists: throw new Error(`Marka zaten bu soruyu izliyor: "${existing.text}"`) OR return existing prompt ID
- If not: proceed with insert

**`addDiscoveredPrompts` (line 325-344):**
- Same dedup check for each discovered prompt before `.upsert()`
- Use `ignoreDuplicates: true` in upsert to catch unique constraint violations gracefully
- Notify user which prompts were skipped (already being tracked)

**`setPromptStatus` (line 506-525):**
- When approving a candidate, check if approved version already exists
- If yes: skip or merge (deactivate candidate, return existing prompt)
- If no: proceed with status change

### 4. UI: Show Existing Prompts

**`app.prompt-demand.tsx` (line 307, 464):**
- When "İlk 10 promptu izlemeye al" is clicked, filter out prompts already in `listPrompts()` result
- Use normalized text comparison to hide duplicates before user sees them
- Show "(Zaten izleniyor)" label on discovered prompts that match existing ones

## Data Cleanup

**Before applying changes:**
1. List duplicates: 
   ```sql
   SELECT brand_id, text, COUNT(*) FROM onecite.prompts 
   GROUP BY brand_id, text HAVING COUNT(*) > 1;
   ```
2. For Snacks For Party: verify the `fae2f3c1…` duplicate exists
3. Record row counts: prompts before cleanup

**Cleanup steps (after code deployed, during transaction):**
- Delete duplicate prompts with older `created_at` (keep newer one)
- Cascade deletes: citations and prompt_runs automatically deleted (FK ON DELETE CASCADE)
- Verify: run duplicate query again → should return 0 rows

**After cleanup verification:**
- Redeploy with unique index constraint in place

## Acceptance Criteria

✅ Migration creates `normalize_prompt_text()` function
✅ Migration creates `idx_prompts_brand_text` unique index (approved prompts only)
✅ `normalizePromptText()` TypeScript function handles Turkish characters (İ/ı → i)
✅ All three write paths (`createPrompt`, `addDiscoveredPrompts`, `setPromptStatus`) check for duplicates before write
✅ Attempting to add duplicate prompt returns informative error or skips silently with toast message
✅ `app.prompt-demand.tsx` filters discovered prompts (hides already-tracked ones in UI)
✅ Duplicate prompt deletion prepared (SQL provided, data verified)
✅ Build: `bun run build` → 0 errors
✅ Test: Add same prompt text twice → second attempt raises error or shows toast "Zaten izleniyor"

## Global Constraints

- TypeScript + Supabase RLS (no new dependencies)
- Normalization must match DB function exactly (shared normalization)
- Approved prompts: enforce unique, candidate prompts: allow rename/merge flexibility
- Error message: established pattern ("Marka zaten bu soruyu izliyor")
- No breaking changes to prompt API

## Migration File Path

`supabase/migrations/YYYYMMDDHHMMSS_prompt_deduplication.sql`

Use timestamp of current time when creating.
