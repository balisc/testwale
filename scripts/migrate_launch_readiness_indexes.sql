-- Launch readiness — additive, idempotent indexes (staging / Supabase SQL Editor only).
-- Do NOT run automatically against production without review.
-- Complements scripts/migrate_performance_egress.sql (which already covers question batch indexes).

-- Subject slug resolution (homepage / subjects / [subject] routes)
create index if not exists idx_subjects_slug_active
  on public.subjects (slug, is_active);

-- Fast per-user first-attempt lookup (correct-question exclusion, idempotent submit checks)
create index if not exists idx_user_attempts_user_question
  on public.user_attempts (user_id, question_id);

-- Verification (run after applying in staging):
-- select indexname, indexdef from pg_indexes
-- where schemaname = 'public'
--   and indexname in ('idx_subjects_slug_active', 'idx_user_attempts_user_question');
