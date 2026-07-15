/**
 * QuestionWale final production migration
 * Run ONCE in Supabase SQL Editor before deployment. Safe to re-run.
 *
 * 1. Prevents public clients from downloading answers/explanations.
 * 2. Keeps all public question counts correct after future uploads.
 */

BEGIN;

-- ---------------------------------------------------------------------------
-- Public question column security
-- ---------------------------------------------------------------------------

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

GRANT SELECT ON TABLE public.questions TO service_role;

-- ---------------------------------------------------------------------------
-- Canonical public question counts
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.refresh_public_question_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  UPDATE public.subtopics AS st
  SET question_count = CASE
    WHEN st.is_active IS TRUE AND t.is_active IS TRUE AND s.is_active IS TRUE
    THEN (
      SELECT count(DISTINCT q.id)::integer
      FROM public.questions AS q
      WHERE q.subtopic_id = st.id
        AND q.is_active IS TRUE
        AND q.is_verified IS TRUE
    )
    ELSE 0
  END
  FROM public.topics AS t
  JOIN public.subjects AS s ON s.id = t.subject_id
  WHERE t.id = st.topic_id;

  UPDATE public.topics AS t
  SET
    question_count = CASE
      WHEN t.is_active IS TRUE AND s.is_active IS TRUE
      THEN (
        SELECT count(DISTINCT q.id)::integer
        FROM public.subtopics AS st
        JOIN public.questions AS q ON q.subtopic_id = st.id
        WHERE st.topic_id = t.id
          AND st.is_active IS TRUE
          AND q.is_active IS TRUE
          AND q.is_verified IS TRUE
      )
      ELSE 0
    END,
    subtopic_count = CASE
      WHEN t.is_active IS TRUE AND s.is_active IS TRUE
      THEN (
        SELECT count(*)::integer
        FROM public.subtopics AS st
        WHERE st.topic_id = t.id
          AND st.is_active IS TRUE
      )
      ELSE 0
    END
  FROM public.subjects AS s
  WHERE s.id = t.subject_id;

  UPDATE public.subjects AS s
  SET
    question_count = CASE
      WHEN s.is_active IS TRUE
      THEN (
        SELECT count(DISTINCT q.id)::integer
        FROM public.topics AS t
        JOIN public.subtopics AS st ON st.topic_id = t.id
        JOIN public.questions AS q ON q.subtopic_id = st.id
        WHERE t.subject_id = s.id
          AND t.is_active IS TRUE
          AND st.is_active IS TRUE
          AND q.is_active IS TRUE
          AND q.is_verified IS TRUE
      )
      ELSE 0
    END,
    topic_count = CASE
      WHEN s.is_active IS TRUE
      THEN (
        SELECT count(*)::integer
        FROM public.topics AS t
        WHERE t.subject_id = s.id
          AND t.is_active IS TRUE
      )
      ELSE 0
    END;
END;
$function$;

REVOKE ALL ON FUNCTION public.refresh_public_question_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_public_question_counts() TO service_role;

CREATE OR REPLACE FUNCTION public.trigger_refresh_public_question_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  PERFORM public.refresh_public_question_counts();
  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.trigger_refresh_public_question_counts() FROM PUBLIC;

DROP TRIGGER IF EXISTS questions_refresh_public_counts ON public.questions;
DROP TRIGGER IF EXISTS questions_refresh_public_counts_on_write ON public.questions;
DROP TRIGGER IF EXISTS questions_refresh_public_counts_on_scope_update ON public.questions;

CREATE TRIGGER questions_refresh_public_counts_on_write
AFTER INSERT OR DELETE OR TRUNCATE ON public.questions
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_refresh_public_question_counts();

CREATE TRIGGER questions_refresh_public_counts_on_scope_update
AFTER UPDATE OF is_active, is_verified, subtopic_id, topic_id, subject_id ON public.questions
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_refresh_public_question_counts();

DROP TRIGGER IF EXISTS subtopics_refresh_public_counts ON public.subtopics;
CREATE TRIGGER subtopics_refresh_public_counts
AFTER UPDATE OF is_active ON public.subtopics
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_refresh_public_question_counts();

DROP TRIGGER IF EXISTS topics_refresh_public_counts ON public.topics;
CREATE TRIGGER topics_refresh_public_counts
AFTER UPDATE OF is_active ON public.topics
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_refresh_public_question_counts();

DROP TRIGGER IF EXISTS subjects_refresh_public_counts ON public.subjects;
CREATE TRIGGER subjects_refresh_public_counts
AFTER UPDATE OF is_active ON public.subjects
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_refresh_public_question_counts();

SELECT public.refresh_public_question_counts();

COMMIT;

-- ---------------------------------------------------------------------------
-- Verification output
-- ---------------------------------------------------------------------------

SELECT
  role_name,
  has_table_privilege(role_name, 'public.questions', 'select') AS full_table_select,
  has_column_privilege(role_name, 'public.questions', 'question_text', 'select') AS can_read_question,
  has_column_privilege(role_name, 'public.questions', 'correct_option', 'select') AS can_read_answer,
  has_column_privilege(role_name, 'public.questions', 'explanation', 'select') AS can_read_explanation
FROM (VALUES ('anon'), ('authenticated'), ('service_role')) AS roles(role_name)
ORDER BY role_name;

WITH canonical AS (
  SELECT count(DISTINCT q.id)::bigint AS total_questions
  FROM public.questions AS q
  JOIN public.subtopics AS st ON st.id = q.subtopic_id AND st.is_active IS TRUE
  JOIN public.topics AS t ON t.id = st.topic_id AND t.is_active IS TRUE
  JOIN public.subjects AS s ON s.id = t.subject_id AND s.is_active IS TRUE
  WHERE q.is_active IS TRUE AND q.is_verified IS TRUE
), catalog AS (
  SELECT coalesce(sum(s.question_count), 0)::bigint AS total_questions
  FROM public.subjects AS s
  WHERE s.is_active IS TRUE
)
SELECT
  canonical.total_questions AS canonical_total,
  catalog.total_questions AS catalog_total,
  canonical.total_questions = catalog.total_questions AS totals_match
FROM canonical, catalog;

SELECT count(*) AS inconsistent_question_relationships
FROM public.questions AS q
JOIN public.subtopics AS st ON st.id = q.subtopic_id
JOIN public.topics AS t ON t.id = st.topic_id
WHERE q.topic_id IS DISTINCT FROM st.topic_id
   OR q.subject_id IS DISTINCT FROM t.subject_id;

-- Expected:
-- anon/authenticated: full_table_select=false, question=true, answer=false,
-- explanation=false. service_role: all true. totals_match=true.
-- inconsistent_question_relationships=0.
