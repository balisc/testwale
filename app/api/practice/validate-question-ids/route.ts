import { filterLivePublicQuestionIds } from '@/lib/questionBankVersion';
import {
  isTextBodyTooLarge,
  parseBatchQuestionIdsPayload,
  privateNoStoreJsonResponse,
} from '@/lib/publicQuestionApiGuards';
import { serializeError, logPracticeDebug } from '@/lib/practiceDebugLog';

export const dynamic = 'force-dynamic';

/**
 * Validates candidate practice question UUIDs against public.questions
 * (is_active + is_verified). Used before restoring sessions / SSR lists.
 */
export async function POST(request: Request) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return privateNoStoreJsonResponse({ error: 'INVALID_REQUEST', code: 'INVALID_REQUEST' }, 400);
  }

  if (isTextBodyTooLarge(rawBody)) {
    return privateNoStoreJsonResponse({ error: 'INVALID_REQUEST', code: 'INVALID_REQUEST' }, 400);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return privateNoStoreJsonResponse({ error: 'INVALID_REQUEST', code: 'INVALID_REQUEST' }, 400);
  }

  const parsed = parseBatchQuestionIdsPayload(body);
  if (!parsed.ok) {
    return privateNoStoreJsonResponse({ error: parsed.error, code: 'INVALID_REQUEST' }, 400);
  }

  if (parsed.questionIds.length === 0) {
    return privateNoStoreJsonResponse({
      status: 'empty',
      requestedCount: 0,
      validCount: 0,
      missingCount: 0,
      requestedIds: [],
      validIds: [],
      missingIds: [],
      liveQuestionIds: [],
      staleQuestionIds: [],
      allLive: true,
    });
  }

  try {
    const validIds = await filterLivePublicQuestionIds(parsed.questionIds);
    const liveSet = new Set(validIds);
    const missingIds = parsed.questionIds.filter((id) => !liveSet.has(id));

    const result = {
      status: missingIds.length === 0 ? ('ok' as const) : ('stale' as const),
      requestedCount: parsed.questionIds.length,
      validCount: validIds.length,
      missingCount: missingIds.length,
      requestedIds: parsed.questionIds,
      validIds,
      missingIds,
      liveQuestionIds: validIds,
      staleQuestionIds: missingIds,
      allLive: missingIds.length === 0,
    };

    logPracticeDebug('[practice/validate-question-ids]', {
      requestedCount: result.requestedCount,
      validCount: result.validCount,
      missingCount: result.missingCount,
      missingIds: result.missingIds.slice(0, 5),
    });

    return privateNoStoreJsonResponse(result);
  } catch (error) {
    const supabaseError = serializeError(error);
    logPracticeDebug('[practice/validate-question-ids] failed', { supabaseError });
    return privateNoStoreJsonResponse(
      {
        status: 'error',
        requestedCount: parsed.questionIds.length,
        validCount: 0,
        missingCount: parsed.questionIds.length,
        requestedIds: parsed.questionIds,
        validIds: [],
        missingIds: parsed.questionIds,
        liveQuestionIds: [],
        staleQuestionIds: parsed.questionIds,
        allLive: false,
        supabaseError,
        error: 'INTERNAL_ERROR',
        code: 'INTERNAL_ERROR',
      },
      500,
    );
  }
}
