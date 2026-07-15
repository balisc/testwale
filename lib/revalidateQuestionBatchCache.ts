import 'server-only';

import { revalidateTag } from 'next/cache';
import {
  QUESTION_BATCH_TAG,
  type QuestionBatchRevalidateInput,
  questionBatchSubtopicTag,
  questionBatchTopicTag,
} from '@/lib/questionBatchCache';

/**
 * Invalidates cached public question batches.
 * Prefer targeted subtopicId/topicId tags; falls back to QUESTION_BATCH_TAG only when both are missing.
 */
export function revalidateQuestionBatchCache(input: QuestionBatchRevalidateInput = {}): {
  revalidatedTags: string[];
} {
  const revalidatedTags: string[] = [];
  const subtopicId = input.subtopicId?.trim();
  const topicId = input.topicId?.trim();

  if (subtopicId) {
    const tag = questionBatchSubtopicTag(subtopicId);
    revalidateTag(tag, { expire: 0 });
    revalidatedTags.push(tag);
  }

  if (topicId) {
    const tag = questionBatchTopicTag(topicId);
    revalidateTag(tag, { expire: 0 });
    revalidatedTags.push(tag);
  }

  if (revalidatedTags.length === 0) {
    revalidateTag(QUESTION_BATCH_TAG, { expire: 0 });
    revalidatedTags.push(QUESTION_BATCH_TAG);
  }

  return { revalidatedTags };
}
