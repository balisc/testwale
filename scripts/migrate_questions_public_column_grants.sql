/**
 * Documented column grants matching production (applied manually).
 *
 * Anon / authenticated SELECT allowed:
 *   id, subject_id, topic_id, subtopic_id, question_text, options, difficulty,
 *   source, year, pyq_exam_name, exam_tags, is_verified, is_active, updated_at,
 *   source_metadata
 *
 * NOT granted:
 *   correct_option, explanation, attempt_count, correct_count, report_count
 *
 * App code must use QUESTIONS_PUBLIC_SELECT (lib/questionColumns.ts) for all
 * anon/authenticated reads. Answer reveal uses service_role or SECURITY DEFINER RPCs.
 *
 * This file is documentation + optional re-apply; do not auto-run from CI.
 */

BEGIN;

-- PUBLIC grants are inherited by anon/authenticated. Revoke at every level or
-- a broad historical table grant will silently defeat column restrictions.
REVOKE SELECT ON TABLE public.questions FROM PUBLIC, anon, authenticated;

REVOKE SELECT (
  correct_option,
  explanation,
  attempt_count,
  correct_count,
  report_count
) ON public.questions FROM PUBLIC, anon, authenticated;

GRANT SELECT (
  id,
  subject_id,
  topic_id,
  subtopic_id,
  question_text,
  options,
  difficulty,
  source,
  year,
  pyq_exam_name,
  exam_tags,
  is_verified,
  is_active,
  updated_at,
  source_metadata
) ON TABLE public.questions TO anon, authenticated;

-- Trusted server-side answer verification retains full read access.
GRANT SELECT ON TABLE public.questions TO service_role;

COMMIT;

-- Expected after migration:
-- anon/authenticated: full table=false, public fields=true, answer fields=false
-- service_role: full table=true
SELECT
  role_name,
  has_table_privilege(role_name, 'public.questions', 'select') AS full_table_select,
  has_column_privilege(role_name, 'public.questions', 'question_text', 'select') AS can_read_question,
  has_column_privilege(role_name, 'public.questions', 'correct_option', 'select') AS can_read_answer,
  has_column_privilege(role_name, 'public.questions', 'explanation', 'select') AS can_read_explanation
FROM (VALUES ('anon'), ('authenticated'), ('service_role')) AS roles(role_name)
ORDER BY role_name;
