/** Broad tag — only revalidate when subtopicId/topicId are unknown. */
export const QUESTION_BATCH_TAG = 'question-batch';

/**
 * Global key prefix. Bump after mass UUID replacements so every Data Cache
 * entry for public question batches is orphaned immediately.
 * Topic 3 / Subtopic 1 stale UUID fix → v3.
 * Include source_metadata on public batches → v4.
 * Drop attempt_count/correct_count from anon selects after column grants → v5.
 */
// v9: SSC CGL General Awareness is mapped to both Tier I and Tier II Paper I.
export const QUESTION_BATCH_CACHE_VERSION = 'v9';

/**
 * Server-side TTL fallback when tags are not revalidated.
 * Shorter than 24h so replaced banks self-heal even without admin revalidate.
 */
export const QUESTION_BATCH_REVALIDATE_SECONDS = 300;

export function questionBatchSubtopicTag(subtopicId: string): string {
  return `question-batch:subtopic:${QUESTION_BATCH_CACHE_VERSION}:${subtopicId}`;
}

export function questionBatchTopicTag(topicId: string): string {
  return `question-batch:topic:${QUESTION_BATCH_CACHE_VERSION}:${topicId}`;
}

export type QuestionBatchRevalidateInput = {
  subtopicId?: string | null;
  topicId?: string | null;
};

/** Stable STALE_QUESTION API code for clients. */
export const STALE_QUESTION_CODE = 'STALE_QUESTION' as const;
