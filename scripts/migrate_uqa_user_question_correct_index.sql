-- QuestionWale: partial index for correct-ids batch lookups (run once in Supabase SQL Editor)
-- Safe to run multiple times (CREATE INDEX IF NOT EXISTS only).
-- Requires: public.user_question_attempts (scripts/migrate_user_question_attempts.sql)
--
-- Supports analytics/history queries that filter user_id + is_correct = true.
-- Practice correct-ids API uses user_attempts (first stored attempt); this index
-- optimizes user_question_attempts paths used by profile/dashboard RPCs.

create index if not exists idx_uqa_user_question_correct
  on public.user_question_attempts (user_id, question_id)
  where is_correct = true;
