/** Legacy subject tables — safe fields before answer submit (no correct_answer / explanation). */
export const LEGACY_PRE_SUBMIT_COLUMNS = 'id,subject,topic,question,options,created_at';
export const HISTORY_PRE_SUBMIT_COLUMNS = `${LEGACY_PRE_SUBMIT_COLUMNS},sub_category`;

/** Unified catalog `questions` table — public fields only. */
export const CATALOG_PRE_SUBMIT_COLUMNS =
  'id,question_text,options,difficulty,source,year,pyq_exam_name,exam_tags,subject_id,topic_id,subtopic_id';

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
