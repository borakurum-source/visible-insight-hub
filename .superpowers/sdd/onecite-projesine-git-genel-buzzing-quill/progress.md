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
Task 0.3: fix round 1/5 (3 addressed, 0 open — normalizePromptText order bug, migration never applied to live DB, data cleanup never executed + 1 undocumented Filmfolk duplicate found; commits ca64849..64a5f00) — controller-executed, not subagent (Agent dispatch blocked by auto-mode classifier for live-DB delete+migration; human chose direct execution)
Task 0.3: complete (commits e1b6345..64a5f00, fix round 1 self-verified: unique index live-tested against duplicate insert, build 0 errors)
Task 0.4: complete (data cleanup: ABS Kör Kalıp batch running→failed)
Task 1.1: complete (commit c4aded7, controller-executed — live-DB migration+backfill, same classifier-block reason as Task 0.3; 73/73 rows backfilled, regression-checked against real data; not yet deployed to running PM2 process)
Task 1.2: complete (commit f3be738, subagent-dispatched — pure code fix, not classifier-blocked; review clean/Approved; minor deferred: use-measurement-run.ts:23-28 progress stays 0/0 during the new finalize-on-resume branch, cosmetic only)
