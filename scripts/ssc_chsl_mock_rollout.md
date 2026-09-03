# SSC CHSL Tier 1 mock rollout checklist

The launch state is **blocked**. Keep `QW_SSC_CHSL_MOCKS_ENABLED=false` and `QW_SSC_CHSL_MOCKS_LIMITED_MODE=false`.

1. Back up the intended Supabase project. Run `migrate_ssc_cgl_tier1_mock_tests.sql` first to install/upgrade the shared mock engine, then run `migrate_ssc_chsl_tier1_mock_tests.sql` and `migrate_egress_optimization_v2.sql`. All are transactional; the CHSL blueprint stays production-disabled. The egress migration makes syllabus counts and mock-generation preference lookup return compact server-side results.
2. Run `verify_ssc_cgl_tier1_mock_tests.sql`, `verify_ssc_chsl_tier1_mock_tests.sql`, and `verify_egress_optimization_v2.sql` read-only. Every boolean in the egress verification row must be `true`; archive the readiness rows and `EXPLAIN` plans with the deployment record.
3. Install `migrate_strict_mock_content_verification.sql`, then run `npm.cmd run audit:ssc-chsl-mock-strict`. Review the generated dry-run report. The verifier checks exact mapping, taxonomy, bilingual structure, unique options/text, answer-rationale consistency, originality, difficulty, provenance, media and stale timestamps; it selects only the current bucket deficits. A fully ready inventory short-circuits after the 40-row readiness check and does not download the question bank again.
4. Apply a reviewed deterministic plan with `npm.cmd run audit:ssc-chsl-mock-strict -- --apply --confirm=ssc-chsl-tier1-2025-v1`. Apply is service-role-only, transactional, idempotent by plan hash and fully audited. It never changes the production-ready or application feature flags. See `docs/SSC_CHSL_STRICT_AUTOMATED_VERIFICATION.md`.
5. Source-grounded items remain held unless all referenced keys resolve through a separately reviewed source registry. Current events additionally require explicit `event_date` values in the frozen 2024-01-01 through 2025-08-31 window. A question creation or preparation date is not an event date.
6. Create and review at least eight complete five-item English cloze/comprehension groups. Verify passage ownership, group order 1–5, explanations, source metadata, and all items; the strict verifier fails closed on unverified or incomplete groups.
7. Re-run the readiness RPC until every one of the 40 bucket thresholds and the complete-group threshold passes. Set `is_production_ready=true` only in a separately reviewed data migration.
8. Replace the zero-classified-shift bootstrap prior with a reviewed evidence corpus/config migration before claiming ten-year or all-shift calibration. Limited mode requires explicit written product/content approval and must remain visibly labelled.
9. In staging, execute authenticated idempotency, rollback-on-deficit, state transitions, RLS/IDOR, pre-submit answer-key isolation, cross-section autosave, stale versions, exact deadline boundaries, repeat finalization, snapshot immutability, and progress-table isolation tests.
10. Configure a trusted scheduler to call `GET /api/cron/mock-tests/finalize` every minute with `Authorization: Bearer $MOCK_TEST_CRON_SECRET`, and alert on failures or auto-submit lag.
11. Run production-like generation/autosave load tests, save query plans, and confirm measured p95 targets. Then test signed-out return, deferred start, standard/scribe modes, unrestricted section switching, offline retry, reopen/expiry, result review, profile history, 320 px mobile, and keyboard-only use.
12. Enable `QW_SSC_CHSL_MOCKS_ENABLED=true` only after all prior gates pass. Keep limited mode false for the normal launch.

Emergency deactivation is non-destructive:

```sql
update public.mock_test_blueprints
set is_active = false, is_production_ready = false, updated_at = now()
where code = 'ssc-chsl-tier1-2025-v1';
```

Also set `QW_SSC_CHSL_MOCKS_ENABLED=false`. Do not delete the blueprint, tests, snapshots, responses, or results; old attempts must remain reviewable.
