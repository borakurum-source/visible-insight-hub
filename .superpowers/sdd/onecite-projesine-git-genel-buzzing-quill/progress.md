# SDD ledger — plan: /root/.claude/plans/onecite-projesine-git-genel-buzzing-quill.md

**Baseline**: commit e1b6345 (Evidence Bridge Faz 3, panel.functions.ts +179 lines)

**Tasks**:
- Task 0.1: Cross-tenant security fixes (B1, B2)
- Task 0.2: Measurement screen → round-based view (A1, B1 duplicate perception)
- Task 0.3: Prompt deduplication + unique index (A2)
- Task 0.4: Clean stalled batch
- Task 1.1: Add prompt_runs.batch_id column + backfill
- Task 1.2-1.10: Measurement engine hardening (C1-C11 fixes)
- Task 2.1: Fix brand switching (critical)
- Task 2.2-2.6: Panel hierarchy, single-prompt measure, query key factory, drill-down, dead code removal
- Task 3.1-3.5: Visualization layer (chart theme, new charts)
- Task 4.1: MCP repair

---

Task 0.1: complete (commits e1b6345..ee26d37, review clean)
Task 0.2: complete (commits ee26d37..f4cfb5e, review clean; minor: N+1 query deferred to Phase 1)
