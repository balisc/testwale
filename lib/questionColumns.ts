/**
 * Column allowlists for public.questions after column-level SELECT grants.
 *
 * Anon/authenticated MAY select only:
 *   id, subject_id, topic_id, subtopic_id, question_text, options, difficulty,
 *   source, year, pyq_exam_name, exam_tags, is_verified, is_active, updated_at,
 *   source_metadata
 *
 * MUST NEVER appear on anon/browser/public queries:
 *   correct_option, explanation, attempt_count, correct_count, report_count
 *
 * Answer columns are read only via SUPABASE_SERVICE_ROLE_KEY or SECURITY DEFINER RPCs.
 */

/** Exact PostgREST select list matching live column privileges for anon/authenticated. */
export const QUESTIONS_PUBLIC_SELECT =
  'id, subject_id, topic_id, subtopic_id, question_text, options, difficulty, source, source_metadata, year, pyq_exam_name, exam_tags, is_verified, is_active, updated_at';

/** @deprecated Prefer QUESTIONS_PUBLIC_SELECT — kept alias for catalog list APIs. */
export const CATALOG_PRE_SUBMIT_COLUMNS = QUESTIONS_PUBLIC_SELECT;

/** Legacy subject tables — safe fields before answer submit (no correct_answer / explanation). */
export const LEGACY_PRE_SUBMIT_COLUMNS = 'id,subject,topic,question,options,created_at';
export const HISTORY_PRE_SUBMIT_COLUMNS = `${LEGACY_PRE_SUBMIT_COLUMNS},sub_category`;

/** Server-side reveal after submit (legacy tables). */
export const LEGACY_ANSWER_COLUMNS = 'correct_answer,explanation';

/** @deprecated Use LEGACY_PRE_SUBMIT_COLUMNS for public fetches. */
export const BASE_QUESTION_COLUMNS = `${LEGACY_PRE_SUBMIT_COLUMNS},correct_answer,explanation`;
/** @deprecated Use HISTORY_PRE_SUBMIT_COLUMNS for public fetches. */
export const HISTORY_QUESTION_COLUMNS = `${BASE_QUESTION_COLUMNS},sub_category`;

/** Public legacy question list/detail before submit. */
export const PUBLIC_QUESTION_COLUMNS = LEGACY_PRE_SUBMIT_COLUMNS;

export function legacyColumnsForTable(tableName: string): string {
  return tableName === 'history_questions' ? HISTORY_PRE_SUBMIT_COLUMNS : LEGACY_PRE_SUBMIT_COLUMNS;
}
