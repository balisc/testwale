import { createHash } from 'crypto';
import { unstable_cache } from 'next/cache';
import supabase from '@/lib/supabase';
import {
  QUESTION_BATCH_REVALIDATE_SECONDS,
  QUESTION_BATCH_TAG,
  questionBatchSubtopicTag,
  questionBatchTopicTag,
} from '@/lib/questionBatchCache';

const BANK_VERSION_ID_CAP = 5000;

/**
 * Fingerprint of active+verified question UUIDs for a practice scope.
 * Changes whenever questions are inserted, deleted, or replaced — used as a
 * cache/session identity segment so stale UUID lists stop being served.
 */
export async function getQuestionBankVersion(
  scope: 'subtopic' | 'topic',
  scopeId: string,
): Promise<string> {
  const id = String(scopeId ?? '').trim();
  if (!id) return 'empty';

  const column = scope === 'subtopic' ? 'subtopic_id' : 'topic_id';
  const { data, error } = await supabase
    .from('questions')
    .select('id')
    .eq(column, id)
    .eq('is_active', true)
    .eq('is_verified', true)
    .order('id', { ascending: true })
    .limit(BANK_VERSION_ID_CAP);

  if (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[questionBankVersion]', {
        scope,
        scopeId: id,
        code: error.code ?? null,
        message: error.message ?? null,
      });
    }
    // Fail closed: unique per request so we don't reuse a poisoned cache entry.
    return `err:${Date.now()}`;
  }

  const ids = (data ?? []).map((row: { id: string }) => String(row.id));
  const digest = createHash('sha1').update(ids.join(',')).digest('hex').slice(0, 16);
  return `${ids.length}:${digest}`;
}

/**
 * Cached bank fingerprint — avoids a Supabase id-list query on every practice request
 * while still participating in question-batch tag invalidation.
 */
export async function getQuestionBankVersionCached(
  scope: 'subtopic' | 'topic',
  scopeId: string,
): Promise<string> {
  const id = String(scopeId ?? '').trim();
  if (!id) return 'empty';

  const tags =
    scope === 'subtopic'
      ? [QUESTION_BATCH_TAG, questionBatchSubtopicTag(id)]
      : [QUESTION_BATCH_TAG, questionBatchTopicTag(id)];

  return unstable_cache(
    async () => getQuestionBankVersion(scope, id),
    ['question-bank-version', scope, id],
    { revalidate: QUESTION_BATCH_REVALIDATE_SECONDS, tags },
  )();
}

/** Keep only IDs that still exist as public practice questions. */
export async function filterLivePublicQuestionIds(questionIds: string[]): Promise<string[]> {
  const unique = Array.from(
    new Set(questionIds.map((id) => String(id ?? '').trim()).filter(Boolean)),
  );
  if (unique.length === 0) return [];

  const { data, error } = await supabase
    .from('questions')
    .select('id')
    .in('id', unique)
    .eq('is_active', true)
    .eq('is_verified', true);

  if (error || !data) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[filterLivePublicQuestionIds]', {
        code: error?.code ?? null,
        message: error?.message ?? null,
        requested: unique.length,
      });
    }
    return [];
  }

  return data.map((row: { id: string }) => String(row.id));
}
