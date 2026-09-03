# Exact-exam selector and preparation preference run guide

Run this on a disposable local Supabase database first, then on staging. Do not
run it directly on production. Use the same database project configured for the
staging Next.js deployment.

## 1. Backup and pre-migration snapshot

Take the normal staging database backup. Save the result of this read-only row
count query outside the SQL Editor session:

```sql
select 'users' as relation, count(*)::bigint as row_count from public.users
union all select 'questions', count(*)::bigint from public.questions
union all select 'user_attempts', count(*)::bigint from public.user_attempts
union all select 'user_question_attempts', count(*)::bigint from public.user_question_attempts
union all select 'exam_syllabus_nodes', count(*)::bigint from public.exam_syllabus_nodes
union all select 'question_exam_profile_mappings', count(*)::bigint from public.question_exam_profile_mappings
order by relation;

select to_regclass('public.user_exam_preferences') as preference_relation;
```

If `user_exam_preferences` exists, separately save its `count(*)`; otherwise
record it as `not present`. Also capture `pg_get_constraintdef` for
existing preference/profile constraints and `pg_get_functiondef` for existing
Tier RPCs before changing staging.

## 2. Run the exact selector migration

Run [migrate_exam_selector_content_readiness.sql](../scripts/migrate_exam_selector_content_readiness.sql).

This migration:

- preflights the exact-exam schema and mapping column types;
- validates the live SSC CGL current version and the 430/590/11/493/0/0 audit;
- requires every operational SSC CGL subtopic to reference an active global
  subtopic through `metadata.content_subtopic_id` or
  `metadata.catalog_subtopic_id`; it never falls back to title equality;
- replaces `exam_selector_options` with complete hierarchy/readiness checks;
- counts questions only through `question_exam_profile_mappings` joined to
  active verified `questions` on those explicitly linked operational subtopics;
- creates the read-only `ssc_cgl_tier_availability` view from exact
  `stage_codes` and matching current-version operational stage paths;
- never creates, seeds, reads for readiness, or drops
  `exam_syllabus_question_mappings`.

The migration deliberately aborts if SSC CGL is not currently ready. Other
profiles with zero or multiple current published syllabi remain diagnostic
selector rows with a non-ready reason.

## 3. Run the preference migration

Run [migrate_user_exam_preferences.sql](../scripts/migrate_user_exam_preferences.sql).

This migration preserves valid rows, backfills only inferable fields, aborts on
invalid/orphan/duplicate data, inspects existing constraint definitions, applies
server-only RLS/grants, reconciles `target_exam_profile_id`, and installs the two
four-argument service-role RPCs. Repository callers were audited to use the
four-argument onboarding RPC; the obsolete three-argument overload is removed
to prevent PostgREST ambiguity. No exam date or onboarding field is touched by
the Tier-change RPC.

## 4. Run the generic preparation-track migration

Run [migrate_generic_exam_preparation_preferences.sql](../scripts/migrate_generic_exam_preparation_preferences.sql).

This migration keeps the existing CGL preference contract compatible while it:

- creates the server-only `exam_preparation_track_options` view from ready
  selector profiles, current published syllabi, active node-stage mappings and
  exact active verified question mappings;
- uses `ssc_cgl_tier_availability` for CGL Tier eligibility and counts
  qualifying DEST/skill-test nodes separately from MCQs;
- adds `preparation_mode`, permits non-CGL preferences to use a null Tier, and
  preserves all existing preference/history rows;
- installs the generic atomic onboarding and change-preference RPCs;
- adds supporting indexes and requests a PostgREST schema reload.

The current repository has only the four-option MCQ question model, so this
view intentionally exposes `MCQ` tracks only. Written/Descriptive remains a
disabled Coming soon choice in the UI.

## 5. Confirm the relations before schema reload

Run:

```sql
select to_regclass('public.user_exam_preferences');
select to_regclass('public.exam_preparation_track_options');
```

Continue only when both results return their exact `public.*` relation names.

## 6. Reload PostgREST

After the successful relation check, run:

```sql
notify pgrst, 'reload schema';
```

Do not hide or special-case `PGRST205` in application code. If it remains,
confirm that staging app environment variables point to this same Supabase
project, repeat the relation query, then reload the schema cache once more.

## 7. Run read-only verification

Run [verify_exam_selector_and_preferences.sql](../scripts/verify_exam_selector_and_preferences.sql)
and save all result grids. Confirm:

- normal selector query contains only `can_select=true` rows;
- exact mapping and selector question counts match;
- Tier 1/Tier 2 availability agrees with exact stage-coded questions;
- generic preparation tracks contain only active MCQ stages with verified
  questions and the track view is inaccessible to browser roles;
- explicit operational subtopic link audit reports zero missing links;
- SSC CGL audit is 430 active nodes, 590 placements, 11 subject placements,
  493 subtopic paths, 0 broken mappings, and 0 inactive wrappers;
- browser roles have no preference table access;
- only the expected legacy and generic RPC signatures remain;
- invalid, duplicate, and orphan preference counts are zero;
- protected before/after row counts match.

Run all three migrations a second time on local/staging and rerun verification to
prove rerun safety before deployment.

## 8. Deploy compatible application code

Deploy the SQL-compatible server/frontend revision only after verification
passes. Confirm the deployed server uses a server-only service-role key and the
signed custom application cookie; inspect the browser bundles to ensure the
service-role key is absent.

## 9. End-to-end checks

Test guest and authenticated flows at mobile, tablet, and desktop widths:

- homepage/onboarding shows only ready exam cards;
- ready cards show bilingual names, conducting body and all four readiness counts;
- every selected exam opens only its available database-backed stages;
- guest SSC CGL selection shows available Tiers and performs no write;
- first authenticated SSC CGL selection saves once and opens Subjects;
- an existing preference skips the Tier page;
- Subjects, Topics, Subtopics, and Questions remain separate pages and carry
  the saved exact stage filter;
- profile shows Target Exam, Tier where applicable, Paper/stage and mode;
- Change preference reuses onboarding validation and does not change exam date
  or onboarding completion state;
- unavailable Tier cards are disabled;
- browser Back works and pages have no horizontal scrollbar.

Repository checks:

```text
npm run test:exam-onboarding
npm run test:ssc-cgl
npm run test:exam-learning
npm run typecheck
npm run lint
npm run build
```

## Unsafe legacy table cleanup

If `public.exam_syllabus_question_mappings` is absent, do nothing. If it exists,
the selector migration only emits a notice with row/dependency counts. Before a
future cleanup, export its rows, list `pg_depend` dependants, confirm no deployed
code reads it, choose a retention window, and prepare a separate reviewed
archive/drop migration. Do not delete or drop it as part of this rollout.
