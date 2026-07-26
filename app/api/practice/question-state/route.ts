import { getAuthUserFromCookies } from '@/lib/authCookies';
import { getSubtopicBatchQuestionState } from '@/lib/practiceServer';
import { resolvePracticeExamQuestionTag } from '@/lib/polity/practiceExamFilter';
import {
  isTextBodyTooLarge,
  parseBatchQuestionIdsPayload,
  privateNoStoreJsonResponse,
} from '@/lib/publicQuestionApiGuards';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

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
  if (!scopeId) {
    return errorResponse('missing_scope_id', 400);
  }

  const parsedIds = parseBatchQuestionIdsPayload({ questionIds: row.questionIds });
  if (!parsedIds.ok) {
    return errorResponse(parsedIds.error, 400);
  }

  const rawExamCode =
    typeof row.examCode === 'string' && row.examCode.trim() ? row.examCode.trim() : null;
  const examCode = rawExamCode ? (await resolvePracticeExamQuestionTag(rawExamCode)) ?? null : null;

  const stateResult = await getSubtopicBatchQuestionState(
    admin,
    user.id,
    scopeId,
    examCode,
    parsedIds.questionIds,
  );

  if (!stateResult.ok) {
    return errorResponse(stateResult.error, stateResult.error === 'mastery_migration_pending' ? 503 : 500);
  }

  return privateNoStoreJsonResponse(stateResult.state);
}
