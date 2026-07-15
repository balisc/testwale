/**
 * QuestionWale — canonical public question counts
 *
 * Run once in Supabase SQL Editor after the catalog tables and public.questions
 * exist. Safe to re-run. Future question INSERT/UPDATE/DELETE statements refresh
 * subject/topic/subtopic counts automatically.
 *
 * Canonical public question:
 *   q.is_active = true AND q.is_verified = true
 *   AND its subtopic, topic and subject are active.
 *
 * Canonical ownership follows q.subtopic_id -> subtopics -> topics -> subjects.
 */

BEGIN;

CREATE OR REPLACE FUNCTION public.refresh_public_question_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  -- Subtopic totals.
  UPDATE public.subtopics AS st
  SET question_count = CASE
    WHEN st.is_active IS TRUE
     AND t.is_active IS TRUE
     AND s.is_active IS TRUE
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

  -- Topic totals use the canonical subtopic hierarchy, not redundant q.topic_id.
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

  -- Subject totals use the same canonical hierarchy and count each UUID once.
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

-- Trigger wrapper deliberately performs one refresh per SQL statement. Bulk
-- question files therefore cost one refresh, not one refresh per row.
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

-- Do not refresh catalog counts when only attempt_count/correct_count changes.
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

-- Initial repair of all existing aggregate columns.
SELECT public.refresh_public_question_counts();

COMMIT;

-- Verification result. Global total must equal the sum of subject totals.
WITH canonical AS (
  SELECT count(DISTINCT q.id)::bigint AS total_questions
  FROM public.questions AS q
  JOIN public.subtopics AS st ON st.id = q.subtopic_id AND st.is_active IS TRUE
  JOIN public.topics AS t ON t.id = st.topic_id AND t.is_active IS TRUE
  JOIN public.subjects AS s ON s.id = t.subject_id AND s.is_active IS TRUE
  WHERE q.is_active IS TRUE
    AND q.is_verified IS TRUE
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

-- Diagnostic only: redundant IDs should agree with canonical hierarchy.
SELECT count(*) AS inconsistent_question_relationships
FROM public.questions AS q
JOIN public.subtopics AS st ON st.id = q.subtopic_id
JOIN public.topics AS t ON t.id = st.topic_id
WHERE q.topic_id IS DISTINCT FROM st.topic_id
   OR q.subject_id IS DISTINCT FROM t.subject_id;
