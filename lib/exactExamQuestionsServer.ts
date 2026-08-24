import 'server-only';

import { unstable_cache } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getReadyExamSelectorOption } from '@/lib/examCatalogueServer';
import { getActiveExamProfileIdentity } from '@/lib/examProfileIdentityServer';
import { QUESTIONS_PUBLIC_SELECT } from '@/lib/questionColumns';
import {
  QUESTION_BATCH_CACHE_VERSION,
  QUESTION_BATCH_REVALIDATE_SECONDS,
  QUESTION_BATCH_TAG,
  questionBatchSubtopicTag,
  questionBatchTopicTag,
} from '@/lib/questionBatchCache';
import { normalizePublicQuestion } from '@/lib/polity';
import { clampQuestionLimit } from '@/lib/supabaseQueryLimits';
import type { QuestionBatchPage } from '@/types/polity';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMPTY_BATCH: QuestionBatchPage = { questions: [], nextCursor: null, hasMore: false };

export async function resolveReadyExamProfileId(input: {
  examCode?: string | null;
  examProfileId?: string | null;
}): Promise<string | null> {
  if (input.examCode?.trim().toUpperCase() === 'SSC_CGL') {
    const identity = await getActiveExamProfileIdentity(input);
    return identity?.examProfileId ?? null;
  }
  const option = await getReadyExamSelectorOption(input);
  return option?.exam_profile_id ?? null;
}

async function fetchExactExamQuestionBatchBySubtopic(input: {
  examProfileId: string;
  contentSubtopicId: string;
  stageCodes?: string[];
  cursor?: string | null;
  batchSize: number;
}): Promise<QuestionBatchPage> {
  if (!UUID_PATTERN.test(input.examProfileId) || !UUID_PATTERN.test(input.contentSubtopicId)) {
    return EMPTY_BATCH;
  }
  const cursor = input.cursor?.trim() || null;
  if (cursor && !UUID_PATTERN.test(cursor)) return EMPTY_BATCH;
  const admin = getSupabaseAdmin();
  if (!admin) return EMPTY_BATCH;
  const batchSize = clampQuestionLimit(input.batchSize);

  let query = admin
    .from('questions')
    .select(`${QUESTIONS_PUBLIC_SELECT}, question_exam_profile_mappings!inner(exam_profile_id, stage_codes, is_active)`)
    .eq('subtopic_id', input.contentSubtopicId)
    .eq('is_active', true)
    .eq('is_verified', true)
    .eq('question_exam_profile_mappings.exam_profile_id', input.examProfileId)
    .eq('question_exam_profile_mappings.is_active', true);

  const stageCodes = [...new Set((input.stageCodes ?? []).map((value) => value.trim()).filter(Boolean))];
  if (stageCodes.length > 0) {
    query = query.overlaps('question_exam_profile_mappings.stage_codes', stageCodes);
  }
  if (cursor) query = query.lt('id', cursor);

  const result = await query.order('id', { ascending: false }).limit(batchSize + 1);
  if (result.error) {
    throw new Error(
      `exact_exam_question_batch_failed:${result.error.code ?? 'database_error'}:${result.error.message}`,
    );
  }

  const rows = (result.data ?? []) as Record<string, unknown>[];
  const hasMore = rows.length > batchSize;
  const questions = (hasMore ? rows.slice(0, batchSize) : rows).map(normalizePublicQuestion);
  return {
    questions,
    hasMore,
    nextCursor: hasMore && questions.length > 0 ? questions[questions.length - 1]!.id : null,
  };
}

export async function getExactExamQuestionBatchBySubtopic(input: {
  examProfileId: string;
  contentSubtopicId: string;
  stageCodes?: string[];
  cursor?: string | null;
  batchSize: number;
}): Promise<QuestionBatchPage> {
  const stageCodes = [...new Set((input.stageCodes ?? []).map((value) => value.trim()).filter(Boolean))]
    .sort();
  const cursor = input.cursor?.trim() || null;
  const batchSize = clampQuestionLimit(input.batchSize);
  return unstable_cache(
    () => fetchExactExamQuestionBatchBySubtopic({
      ...input,
      stageCodes,
      cursor,
      batchSize,
    }),
    [
      'exact-exam-question-batch-subtopic',
      QUESTION_BATCH_CACHE_VERSION,
      input.examProfileId,
      input.contentSubtopicId,
      stageCodes.join(','),
      cursor ?? 'first',
      String(batchSize),
    ],
    {
      revalidate: QUESTION_BATCH_REVALIDATE_SECONDS,
      tags: [QUESTION_BATCH_TAG, questionBatchSubtopicTag(input.contentSubtopicId)],
    },
  )();
}

/**
 * One uncached recovery read for a cached empty page. Normal requests continue
 * to use getExactExamQuestionBatchBySubtopic; this is called only when that
 * cached result unexpectedly contains no questions.
 */
export function getFreshExactExamQuestionBatchBySubtopic(input: {
  examProfileId: string;
  contentSubtopicId: string;
  stageCodes?: string[];
  cursor?: string | null;
  batchSize: number;
}): Promise<QuestionBatchPage> {
  return fetchExactExamQuestionBatchBySubtopic(input);
}

async function fetchExactExamQuestionBatchByTopic(input: {
  examProfileId: string;
  contentTopicId: string;
  stageCodes?: string[];
  cursor?: string | null;
  batchSize: number;
}): Promise<QuestionBatchPage> {
  if (!UUID_PATTERN.test(input.examProfileId) || !UUID_PATTERN.test(input.contentTopicId)) {
    return EMPTY_BATCH;
  }
  const cursor = input.cursor?.trim() || null;
  if (cursor && !UUID_PATTERN.test(cursor)) return EMPTY_BATCH;
  const admin = getSupabaseAdmin();
  if (!admin) return EMPTY_BATCH;
  const batchSize = clampQuestionLimit(input.batchSize);

  let query = admin
    .from('questions')
    .select(`${QUESTIONS_PUBLIC_SELECT}, question_exam_profile_mappings!inner(exam_profile_id, stage_codes, is_active)`)
    .eq('topic_id', input.contentTopicId)
    .eq('is_active', true)
    .eq('is_verified', true)
    .eq('question_exam_profile_mappings.exam_profile_id', input.examProfileId)
    .eq('question_exam_profile_mappings.is_active', true);

  const stageCodes = [...new Set((input.stageCodes ?? []).map((value) => value.trim()).filter(Boolean))];
  if (stageCodes.length > 0) {
    query = query.overlaps('question_exam_profile_mappings.stage_codes', stageCodes);
  }
  if (cursor) query = query.lt('id', cursor);

  const result = await query.order('id', { ascending: false }).limit(batchSize + 1);
  if (result.error) {
    throw new Error(
      `exact_exam_topic_question_batch_failed:${result.error.code ?? 'database_error'}:${result.error.message}`,
    );
  }

  const rows = (result.data ?? []) as Record<string, unknown>[];
  const hasMore = rows.length > batchSize;
  const questions = (hasMore ? rows.slice(0, batchSize) : rows).map(normalizePublicQuestion);
  return {
    questions,
    hasMore,
    nextCursor: hasMore && questions.length > 0 ? questions[questions.length - 1]!.id : null,
  };
}

export async function getExactExamQuestionBatchByTopic(input: {
  examProfileId: string;
  contentTopicId: string;
  stageCodes?: string[];
  cursor?: string | null;
  batchSize: number;
}): Promise<QuestionBatchPage> {
  const stageCodes = [...new Set((input.stageCodes ?? []).map((value) => value.trim()).filter(Boolean))]
    .sort();
  const cursor = input.cursor?.trim() || null;
  const batchSize = clampQuestionLimit(input.batchSize);
  return unstable_cache(
    () => fetchExactExamQuestionBatchByTopic({
      ...input,
      stageCodes,
      cursor,
      batchSize,
    }),
    [
      'exact-exam-question-batch-topic',
      QUESTION_BATCH_CACHE_VERSION,
      input.examProfileId,
      input.contentTopicId,
      stageCodes.join(','),
      cursor ?? 'first',
      String(batchSize),
    ],
    {
      revalidate: QUESTION_BATCH_REVALIDATE_SECONDS,
      tags: [QUESTION_BATCH_TAG, questionBatchTopicTag(input.contentTopicId)],
    },
  )();
}

export async function getExactExamQuestionCounts(input: {
  examProfileId: string;
  contentSubtopicIds: string[];
  stageCodes?: string[];
}): Promise<Record<string, number>> {
  const admin = getSupabaseAdmin();
  if (!admin || !UUID_PATTERN.test(input.examProfileId)) return {};
  const ids = [...new Set(input.contentSubtopicIds.filter((id) => UUID_PATTERN.test(id)))];
  const stageCodes = [...new Set((input.stageCodes ?? []).map((value) => value.trim()).filter(Boolean))];
  const counts: Record<string, number> = {};
  const pageSize = 1000;

  for (let offset = 0; offset < ids.length; offset += 50) {
    const chunk = ids.slice(offset, offset + 50);
    for (let from = 0; ; from += pageSize) {
      let query = admin
        .from('questions')
        .select('id, subtopic_id, question_exam_profile_mappings!inner(exam_profile_id, stage_codes, is_active)')
        .in('subtopic_id', chunk)
        .eq('is_active', true)
        .eq('is_verified', true)
        .eq('question_exam_profile_mappings.exam_profile_id', input.examProfileId)
        .eq('question_exam_profile_mappings.is_active', true);
      if (stageCodes.length > 0) {
        query = query.overlaps('question_exam_profile_mappings.stage_codes', stageCodes);
      }
      const result = await query.order('id', { ascending: true }).range(from, from + pageSize - 1);
      if (result.error) {
        throw new Error(
          `exact_exam_question_counts_failed:${result.error.code ?? 'database_error'}:${result.error.message}`,
        );
      }
      const rows = (result.data ?? []) as Array<{ subtopic_id?: unknown }>;
      for (const row of rows) {
        if (typeof row.subtopic_id !== 'string') continue;
        counts[row.subtopic_id] = (counts[row.subtopic_id] ?? 0) + 1;
      }
      if (rows.length < pageSize) break;
    }
  }
  return counts;
}
