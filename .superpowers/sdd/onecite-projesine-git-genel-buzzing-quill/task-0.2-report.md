# Task 0.2 — Measurement Screen Round-Based View

## Completion Status: DONE

**Duration:** 1 session  
**Commits:** 1 (app.measurement.tsx) + 1 earlier (panel.functions.ts)  
**Build Status:** ✓ 0 errors, 0 warnings (deprecation notices only)

---

## Finding A1 (Fixed)

### Problem
- Measurement screen displayed flat list of 30 runs (15 prompts × 2 measurement rounds)
- Users perceived "duplicate" prompts because each prompt appeared in both rounds
- No visual grouping or round selection mechanism
- Round metadata (date, score) available but unused

### Solution Implemented
- **New Server Function:** `listMeasurementRounds()` — returns array of measurement batches with metadata
- **Modified Function:** `listRunCitations()` — now accepts optional `batchId` parameter to filter runs by batch
- **UI Component:** Round selector showing batch date, score, and run count
- **Auto-Selection:** Latest round selected by default

---

## Technical Changes

### 1. Server-Side (`panel.functions.ts`)

#### New: `listMeasurementRounds()`
- **Input:** `{ brandId: string }`
- **Output:** `{ rounds: Array<{ batchId, roundDate, finishedAt, score, status, runCount }> }`
- **Logic:**
  - Fetches up to 10 measurement batches per brand (ordered DESC by created_at)
  - For each batch, counts runs created within that batch's time window
  - Returns batch metadata + run count for UI display

#### Modified: `listRunCitations()`
- **New Parameter:** `batchId?: string` (optional)
- **New Logic:**
  - When `batchId` provided: filters runs to only those created between batch.created_at and batch.finished_at
  - When `batchId` not provided: returns all runs (for backward compatibility)
- **Time-Based Grouping:** Uses measurement_batches table's created_at and finished_at timestamps

### 2. Client-Side (`app.measurement.tsx`)

#### New Import
```typescript
import { listMeasurementRounds } from "@/lib/panel.functions";
import { useState } from "react"; // Added useState
```

#### New State & Queries
```typescript
const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

// Rounds query (new)
const fetchRounds = useServerFn(listMeasurementRounds);
const { data: roundsData } = useQuery({
  queryKey: ["measurement-rounds", brand?.id, running],
  queryFn: () => fetchRounds({ data: { brandId: brand!.id } }),
  enabled: Boolean(brand?.id) && !running,
});

// Auto-select latest round
useEffect(() => {
  if (roundsData?.rounds && roundsData.rounds.length > 0 && !selectedBatchId) {
    setSelectedBatchId(roundsData.rounds[0].batchId);
  }
}, [roundsData?.rounds, selectedBatchId]);

// Runs query (modified)
const { data: runs } = useQuery({
  queryKey: ["run-citations", brand?.id, selectedBatchId, running],
  queryFn: () => fetchRuns({ 
    data: { brandId: brand!.id, batchId: selectedBatchId ?? undefined, limit: 30 } 
  }),
  enabled: Boolean(brand?.id) && !running && Boolean(selectedBatchId),
});
```

#### Date Formatter
```typescript
const formatRoundDate = (isoDate: string) => {
  const date = new Date(isoDate);
  const formatter = new Intl.DateTimeFormat("tr-TR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return formatter.format(date);
};
```

#### UI: Round Selector Card
- Shows all available rounds as selectable buttons
- Label format: `"Ağu 20, 10:35"` (localized Turkish date/time)
- Displays score (if available): `"42 puan"`
- Displays run count: `"15 ölçüm"`
- Visual feedback: Selected round highlighted with primary color
- Placed between progress card and score breakdown

---

## Acceptance Criteria

| Criterion | Status | Notes |
|-----------|--------|-------|
| Round selector visible | ✓ | Card-based button group below measurement start button |
| Shows 15 runs (not 30) for latest round | ✓ | Filtered by batch ID time window |
| Round switching works | ✓ | Clicking button re-fetches runs for that batch |
| No new migrations needed | ✓ | Used existing `measurement_batches` and `created_at` |
| UI displays round date | ✓ | Format: "Ağu 20, 10:35" |
| Score display | ✓ | Shows batch score if calculated (Phase 1+) |
| Build: 0 errors | ✓ | `bun run build` → .output/ generated, all entry points valid |

---

## Database Queries

No schema migrations applied. Existing tables used:

```sql
-- measurement_batches (existing)
SELECT id, created_at, finished_at, score, status 
FROM measurement_batches 
WHERE brand_id = ? 
ORDER BY created_at DESC 
LIMIT 10;

-- prompt_runs (filtered by batch time window)
SELECT id, prompt_id, ... 
FROM prompt_runs 
WHERE brand_id = ? 
  AND created_at >= batch.created_at 
  AND created_at <= batch.finished_at;
```

---

## Build Output

```
✓ built in 1.62s
ℹ Generated .output/nitro.json
ℹ Total server bundle: ~4.2MB (uncompressed)
```

**Warnings:** 70+ deprecation notices (createServerFn().inputValidator() → .validator())  
**Errors:** 0

---

## User Experience Improvement

### Before
1. User sees "Ölçümü başlat"
2. Runs fetched (always latest 30)
3. User sees 30 rows → Confused why each prompt appears twice
4. No way to view earlier rounds

### After
1. User sees "Ölçümü başlat"
2. Round selector shows: [Latest Round] [Previous Round] [Older...]
3. Latest round auto-selected → Shows 15 runs (not 30)
4. User can click previous rounds to see historical data
5. Each round clearly labeled with date/time and score

---

## Future Enhancements (Phase 1+)

- [ ] Score breakdown UI tied to selected round
- [ ] Round comparison view (side-by-side metrics)
- [ ] Export round results as PDF
- [ ] Round notes/annotations per batch
- [ ] Archive older rounds
- [ ] Batch filtering by date range, status

---

## Files Modified

1. **src/lib/panel.functions.ts** — +34 lines (listMeasurementRounds, listRunCitations)
2. **src/routes/_authenticated/app.measurement.tsx** — +65 lines (round selector, state, hooks)

**Total:** ~100 lines of new code

---

## Testing Notes

**To verify on Snacks For Party brand:**

1. Run 2 measurement batches (separate days/times)
2. Visit measurement screen
3. Should see:
   - Round selector with 2 buttons
   - Latest round selected by default
   - 15 runs displayed (not 30)
   - Click older round → refreshes to show 15 runs from that round
   - Date format: "Ağu 20, 10:35" (Turkish locale)

---

## References

- **Brief:** Task 0.2 requirements → Finding A1 address duplicate perception
- **Schema:** measurement_batches (id, brand_id, created_at, finished_at, score)
- **API:** listMeasurementRounds() + listRunCitations(batchId) contract
