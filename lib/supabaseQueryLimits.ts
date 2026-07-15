/** Default rows returned for practice / quiz question loads. */
export const DEFAULT_QUESTION_LIMIT = 25;

/** Default page size for cursor-paginated public question batches. */
export const QUESTION_BATCH_PAGE_SIZE = 10;

/** Hard cap for any public question API or page fetch. */
export const MAX_QUESTION_LIMIT = 50;

/** Max rows scanned when aggregating legacy topic lists (fallback only). */
export const MAX_LEGACY_TOPIC_SCAN = 500;

/** Max rows for topic-filtered quiz candidate queries. */
export const MAX_QUIZ_CANDIDATE_ROWS = 50;

export function clampQuestionLimit(raw: string | number | null | undefined, fallback = DEFAULT_QUESTION_LIMIT) {
  const parsed = typeof raw === 'number' ? raw : Number.parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_QUESTION_LIMIT);
}
