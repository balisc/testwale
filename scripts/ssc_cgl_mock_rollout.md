# SSC CGL Tier 1 mock rollout checklist

The production launch state is currently **blocked**. Do not enable either feature flag from this repository state.

1. Take a database backup and run `migrate_ssc_cgl_tier1_mock_tests.sql`, followed by `migrate_egress_optimization_v2.sql`, in the intended Supabase project. Both scripts are transactional and leave the seeded blueprint production-disabled. The second migration keeps large count and user-preference joins inside Postgres to reduce egress.
2. Run `verify_ssc_cgl_tier1_mock_tests.sql` and `verify_egress_optimization_v2.sql` read-only. Every boolean in the egress verification row must be `true`; save the readiness rows and both `EXPLAIN` plans with the deployment record.
3. Review the provisional `question_mock_facets` against the versioned blueprint. Populate explicit current-event dates, normalized English passage/cloze groups, question types, difficulty bands, and media verification. Mark only individually reviewed rows/groups `verified`.
4. Fill every hard raw inventory gap listed in `research/ssc-cgl/tier1/inventory-readiness-2026-09-01.csv`. Re-run the readiness RPC until every bucket and complete-group threshold passes.
5. Replace the zero-coverage bootstrap research prior with a separately reviewed corpus/config migration before making any exam-realism claim. A limited beta must remain explicitly labelled and must have written product approval.
6. In a staging environment, execute ownership/IDOR, pre-submit answer-key, idempotency, state-transition, stale-autosave, boundary timing, repeat-finalization, snapshot immutability, and existing-progress isolation integration tests against the migrated schema.
7. Configure a trusted scheduler to call `GET /api/cron/mock-tests/finalize` every minute with `Authorization: Bearer $MOCK_TEST_CRON_SECRET`. Alert on non-2xx responses and auto-submit lag.
8. Run production-like generation/autosave load tests and confirm the saved query plans and measured p95 meet the documented targets.
9. Set `QW_SSC_CGL_MOCKS_ENABLED=true` only after setting `mock_test_blueprints.is_production_ready=true` in a separately reviewed data migration. Keep `QW_SSC_CGL_MOCKS_LIMITED_MODE=false` for production.
10. Smoke-test signed-out return, generation, deferred start, both timing modes, autosave/reopen, expiry, final review pagination, and profile history on mobile and keyboard-only flows.

Emergency deactivation is non-destructive:

```sql
update public.mock_test_blueprints
set is_active = false, is_production_ready = false, updated_at = now()
where code = 'ssc-cgl-tier1-2026-v1';
```

Also set `QW_SSC_CGL_MOCKS_ENABLED=false`. Do not drop snapshot tables or delete generated tests; existing history/result pages must remain readable.
