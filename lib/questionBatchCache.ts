/** Broad tag — only revalidate when subtopicId/topicId are unknown. */
export const QUESTION_BATCH_TAG = 'question-batch';

/** Server-side TTL fallback when manual invalidation is not triggered. */
export const QUESTION_BATCH_REVALIDATE_SECONDS = 86400;

export function questionBatchSubtopicTag(subtopicId: string): string {
  return `question-batch:subtopic:${subtopicId}`;
}

export function questionBatchTopicTag(topicId: string): string {
  return `question-batch:topic:${topicId}`;
}

export type QuestionBatchRevalidateInput = {
  subtopicId?: string | null;
  topicId?: string | null;
};
