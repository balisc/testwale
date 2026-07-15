# Subtopic Mastery Loop Migration

This document covers deploying the subtopic mastery-loop feature for QuestionWale. **Mixed-topic practice is unchanged.**

## Required migration order

Run these scripts in Supabase SQL Editor in order:

1. `scripts/migrate_user_question_attempts.sql` (if not already applied)
2. `scripts/migrate_performance_egress.sql` (if not already applied)
3. `scripts/migrate_subtopic_mastery_loop.sql` (**this migration**)

Optional but recommended after step 3:

4. `scripts/verify_subtopic_mastery_loop.sql` (read-only checks)
5. `scripts/test_subtopic_mastery_loop.sql` (staging smoke test with `ROLLBACK`)

## How to run the migration

1. Open Supabase Dashboard → SQL Editor.
2. Paste the full contents of `scripts/migrate_subtopic_mastery_loop.sql`.
3. Run once. The script is idempotent (`IF NOT EXISTS`, `CREATE OR REPLACE`) and wrapped in `BEGIN` / `COMMIT`.
4. Run `scripts/verify_subtopic_mastery_loop.sql` and confirm all checks show `PASS`.
5. Deploy the application code that calls the new RPCs (`question-state`, `advance-cycle`).

**Do not** run the migration from the Next.js app automatically.

## How to run verification SQL

1. Paste `scripts/verify_subtopic_mastery_loop.sql` into SQL Editor.
2. Execute. Review result grids — all `check_name` rows should be `PASS` or `REVIEW` with expected deny-all policies.
3. Confirm `submit_question_answer` shows `EXECUTE` only for `service_role`.

## How to test in Vercel Preview

1. Ensure Preview environment has `SUPABASE_SERVICE_ROLE_KEY` set (server-only).
2. Deploy the branch with mastery-loop UI changes.
3. Sign in on the Preview URL.
4. Open a subtopic practice page: `/subjects/[subject]/[topicSlug]/[subtopicSlug]/practice`
5. Verify:
   - Phase label updates (New Questions → Revision Round N → Subtopic Mastered)
   - Submit saves retries and reveals explanation
   - Empty subtopic shows **“No questions are available in this subtopic yet.”** (not mastered)
   - API errors show retry UI, never “Subtopic Mastered”
6. Check Network tab:
   - `POST /api/practice/question-state` → `Cache-Control: private, no-store`
   - `POST /api/practice/advance-cycle` → `Cache-Control: private, no-store`
   - `GET /api/practice/question-batch` → may be cached (24h public catalog — unchanged)

## Database objects added or replaced

### Table

| Object | Purpose |
|--------|---------|
| `public.user_practice_scope_state` | Persisted phase + revision round per user/subtopic/exam |

### Functions (created/replaced)

| Function | Access |
|----------|--------|
| `normalize_practice_exam_code(text)` | Internal helper |
| `question_matches_practice_exam(text[], text)` | Internal helper |
| `is_question_mastered_for_user(uuid, uuid)` | Internal helper |
| `is_question_unresolved_for_user(uuid, uuid)` | Internal helper |
| `is_question_unseen_for_user(uuid, uuid)` | Internal helper |
| `was_question_attempted_in_round(uuid, uuid, timestamptz)` | Internal helper |
| `count_subtopic_catalog_questions(uuid, text)` | Internal helper |
| `count_subtopic_unseen_questions(uuid, uuid, text)` | Internal helper |
| `count_subtopic_unresolved_questions(uuid, uuid, text)` | Internal helper |
| `count_subtopic_revision_round_eligible(uuid, uuid, text, timestamptz)` | Internal helper |
| `reopen_subtopic_scope_from_completed(...)` | Internal helper |
| `get_or_init_subtopic_practice_scope(uuid, uuid, text)` | **service_role RPC** |
| `get_subtopic_batch_question_state(uuid, uuid, text, uuid[])` | **service_role RPC** |
| `advance_subtopic_practice_cycle(uuid, uuid, text)` | **service_role RPC** |
| `reset_subtopic_practice_progress(uuid, uuid, text)` | **service_role RPC** |
| `submit_question_answer(uuid, uuid, text, integer)` | **Replaced** — service_role only |

### Indexes

- `idx_upss_user_scope`, `idx_upss_user_phase`
- `idx_uqa_user_question_correct` (partial, `WHERE is_correct`)
- `idx_uqa_user_question_attempted_at`

### RLS

`user_practice_scope_state` has deny-all policies (no direct client access).

## Disable mastery APIs if deployment fails

Without rolling back SQL, you can disable the new UI path by reverting the application deploy to the previous Vercel deployment. Legacy paths remain:

- `POST /api/practice/correct-ids`
- `POST /api/practice/subtopic-state`
- Guest / non-mastery logged-in batch mode (first-attempt hiding)

The new routes (`question-state`, `advance-cycle`) return `503 mastery_migration_pending` if RPCs are missing — safe to leave migration unapplied while old code runs.

To hard-disable at runtime without redeploying old code, remove `SUPABASE_SERVICE_ROLE_KEY` from the environment — personalized APIs return `503 service_unavailable` (not recommended for production).

## Roll back application code

1. In Vercel → Deployments → promote the last known-good deployment.
2. Or `git revert` the mastery-loop commits and redeploy.

No database rollback is required for app-only rollback. `user_attempts` and `user_question_attempts` data is preserved.

## Restore previous `submit_question_answer` function

The pre-mastery version lives in `scripts/migrate_performance_egress.sql` (section `submit_question_answer`). To restore behavior **without deleting attempt history**:

1. Re-run only the `create or replace function public.submit_question_answer(...)` block from `migrate_performance_egress.sql`.
2. Re-run its permission grants:

```sql
revoke all on function public.submit_question_answer(uuid, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.submit_question_answer(uuid, uuid, text, integer) to service_role;
```

**Note:** The egress version logs retries differently (no `user_question_attempts` on every retry). Restoring it changes submit semantics — only do this if you must hotfix submit while keeping mastery tables in place.

### Full SQL rollback (schema only — keeps all attempt data)

`user_practice_scope_state` can be left in place (unused) or dropped when no longer needed:

```sql
-- Optional: stop using mastery state (does NOT delete attempts)
drop function if exists public.get_subtopic_batch_question_state(uuid, uuid, text, uuid[]);
drop function if exists public.advance_subtopic_practice_cycle(uuid, uuid, text);
drop function if exists public.get_or_init_subtopic_practice_scope(uuid, uuid, text);
drop function if exists public.reset_subtopic_practice_progress(uuid, uuid, text);
-- drop table only if you are certain:
-- drop table if exists public.user_practice_scope_state;
```

**Never** run scripts that delete `user_attempts` or `user_question_attempts` for rollback.

## Statistics semantics (unchanged)

| Counter | Meaning |
|---------|---------|
| `questions.attempt_count` / `correct_count` | First attempt only (`user_attempts` insert) |
| `user_question_attempts` | Every submit including retries |
| Mastery | Any `is_correct = true` in `user_question_attempts` |

## Reset semantics

`reset_subtopic_practice_progress(user, subtopic, exam_code)` accepts `exam_code` for API compatibility but reset is **subtopic-global**: all scope rows for that user+subtopic are deleted regardless of exam filter.
