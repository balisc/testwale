import { getAuthUserFromCookies } from '@/lib/authCookies';
import { getSubtopicBatchQuestionState } from '@/lib/practiceServer';
import {
  isTextBodyTooLarge,
  isUuid,
  parseBatchQuestionIdsPayload,
  privateNoStoreJsonResponse,
} from '@/lib/publicQuestionApiGuards';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSelectedExamContext } from '@/lib/examLearningServer';

export const dynamic = 'force-dynamic';

function errorResponse(error: string, status: number) {
  return privateNoStoreJsonResponse({ error }, status);
}

export async function POST(request: Request) {
  const user = await getAuthUserFromCookies();
  if (!user) {
    return errorResponse('unauthorized', 401);
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return errorResponse('service_unavailable', 503);
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return errorResponse('invalid_body', 400);
  }

  if (isTextBodyTooLarge(rawBody)) {
    return errorResponse('payload_too_large', 400);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return errorResponse('invalid_body', 400);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return errorResponse('invalid_body', 400);
  }

  const row = body as {
    scope?: unknown;
    scopeId?: unknown;
    examCode?: unknown;
    questionIds?: unknown;
  };

  if (row.scope !== 'subtopic') {
    return errorResponse('invalid_scope', 400);
  }

  const scopeId = typeof row.scopeId === 'string' ? row.scopeId.trim() : '';
  if (!isUuid(scopeId)) {
    return errorResponse('missing_scope_id', 400);
  }

  const parsedIds = parseBatchQuestionIdsPayload({ questionIds: row.questionIds });
  if (!parsedIds.ok) {
    return errorResponse(parsedIds.error, 400);
  }

  const selected = await getSelectedExamContext();
  if (selected.status === 'incomplete') return errorResponse('onboarding_incomplete', 409);
  if (selected.status === 'inactive') return errorResponse('selected_exam_inactive', 409);
  if (selected.status !== 'ready' || selected.userId !== user.id) return errorResponse('exam_scope_failed', 503);
  let allowedQuery = admin
    .from('questions')
    .select('id, question_exam_profile_mappings!inner(exam_profile_id, is_active)')
    .eq('subtopic_id', scopeId)
    .eq('is_active', true)
    .eq('is_verified', true)
    .eq('question_exam_profile_mappings.exam_profile_id', selected.examProfileId)
    .eq('question_exam_profile_mappings.is_active', true);
  if (parsedIds.questionIds.length > 0) {
    allowedQuery = allowedQuery.in('id', parsedIds.questionIds);
  } else {
    allowedQuery = allowedQuery.limit(1);
  }
  // Exact exam validation and private mastery lookup are independent reads.
  // Run them together, then expose state only for the validated IDs.
  const [allowed, stateResult] = await Promise.all([
    allowedQuery,
    getSubtopicBatchQuestionState(
      admin,
      user.id,
      scopeId,
      selected.questionTag,
      parsedIds.questionIds,
    ),
  ]);
  if (allowed.error) return errorResponse('exam_scope_failed', 503);
  if (!allowed.data?.length) return errorResponse('not_in_selected_exam', 404);
  const allowedQuestionIds = new Set(
    allowed.data.map((candidate: { id: string }) => String(candidate.id)),
  );
  const scopedQuestionIds = parsedIds.questionIds.filter((id) => allowedQuestionIds.has(id));

  if (!stateResult.ok) {
    return privateNoStoreJsonResponse({
      phase: 'unseen',
      revisionRound: 0,
      roundStartedAt: null,
      catalogQuestionCount: null,
      eligibleQuestionIds: scopedQuestionIds,
      masteredQuestionIds: [],
      unresolvedQuestionIds: [],
      attemptedThisRoundQuestionIds: [],
    });
  }

  const onlyAllowed = (ids: string[]) => ids.filter((id) => allowedQuestionIds.has(id));
  return privateNoStoreJsonResponse({
    ...stateResult.state,
    eligibleQuestionIds: onlyAllowed(stateResult.state.eligibleQuestionIds),
    masteredQuestionIds: onlyAllowed(stateResult.state.masteredQuestionIds),
    unresolvedQuestionIds: onlyAllowed(stateResult.state.unresolvedQuestionIds),
    attemptedThisRoundQuestionIds: onlyAllowed(
      stateResult.state.attemptedThisRoundQuestionIds,
    ),
  });
}
