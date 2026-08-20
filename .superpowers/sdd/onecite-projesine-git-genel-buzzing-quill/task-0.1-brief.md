# Task 0.1 — Cross-Tenant Security Fixes

## Requirement

OneCite platform has two critical authorization bypasses where `supabaseAdmin` (service-role, RLS-bypassing) is called with unsanitized `brandId` from the client without verifying the user owns that brand.

**Finding B1 (Critical):** `listGa4PropertyOptions` (src/lib/integrations.functions.ts:159-165)
- **Current:** Line 162 takes `{ data }` only; does NOT destructure `context`.
- **Path:** data.brandId → listGa4Properties(data.brandId) → ga4.server.ts:15 → google-oauth.server.ts:151 getBrandAccessToken
- **Risk:** getBrandAccessToken calls supabaseAdmin to read google_oauth_accounts, then returns user's OAuth token to Google API
- **Attack:** Any authenticated user can pass a random brandId to learn another customer's GA4 properties, account names, property IDs

**Finding B2 (High):** `connectBingSite` (src/lib/integrations.functions.ts:610-618)
- **Current:** Line 616 directly calls getBrandBingKey(supabaseAdmin, data.brandId) with NO membership check
- **Risk:** User's Bing API key is used for external request; error/success difference reveals whether target site is verified in that account
- **Attack:** Enumerate other customers' verified Bing sites

## Fix Pattern (Already in codebase)

Correct pattern is at lines 601-603 (connectGscProperty, which works correctly) and lines 67-69 (listGscProperties):

```typescript
const { data: brand } = await context.supabase
  .from("brands").select("id").eq("id", data.brandId).single();
if (!brand) throw new Error("Marka bulunamadı");
```

This SELECT with the user's authenticated context (not supabaseAdmin) enforces RLS—only returns brand if user is a member.

## Changes Required

1. **listGa4PropertyOptions (lines 159-165):**
   - Add `context` to line 162's destructuring
   - Add brand-ownership check (3 lines, as per pattern above)
   - Only call listGa4Properties if ownership check passes

2. **connectBingSite (lines 610-618):**
   - Add brand-ownership check BEFORE line 616's getBrandBingKey call
   - Use same 3-line pattern: query "brands" table with user's context, verify brand exists
   - Throw "Marka bulunamadı" if not owned

## Acceptance Criteria

- Ownership check in place: SELECT "id" FROM brands WHERE id = $brandId (user's context, NOT supabaseAdmin)
- Both functions throw "Marka bulunamadı" when user owns a different brand's brandId
- No new supabaseAdmin calls without ownership check
- Builds: `bun run build` → 0 errors
- Test: login as second user, call both endpoints with first user's brandId → both return "Marka bulunamadı"

## Global Constraints

- TypeScript + TanStack Start (no Python, no FastAPI)
- RLS pattern: always query "brands" with user's context before trusting brandId
- Error message "Marka bulunamadı" is the established pattern in this codebase (lines 69, etc.)
- No new dependencies
