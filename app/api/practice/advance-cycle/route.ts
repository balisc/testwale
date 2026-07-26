import { getAuthUserFromCookies } from '@/lib/authCookies';
import { advanceSubtopicPracticeCycle } from '@/lib/practiceServer';
import { resolvePracticeExamQuestionTag } from '@/lib/polity/practiceExamFilter';
import { isUuid, privateNoStoreJsonResponse } from '@/lib/publicQuestionApiGuards';
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

  let body: unknown;
  try {
    body = (await request.json()) as unknown;
  } catch {
    return errorResponse('invalid_body', 400);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return errorResponse('invalid_body', 400);
  }

  const row = body as { scope?: unknown; scopeId?: unknown; examCode?: unknown };

  if (row.scope !== 'subtopic') {
    return errorResponse('invalid_scope', 400);
  }

  const scopeId = typeof row.scopeId === 'string' ? row.scopeId.trim() : '';
  if (!scopeId || !isUuid(scopeId)) {
    return errorResponse('invalid_scope_id', 400);
  }

  const rawExamCode =
    typeof row.examCode === 'string' && row.examCode.trim() ? row.examCode.trim() : null;
  const examCode = rawExamCode ? (await resolvePracticeExamQuestionTag(rawExamCode)) ?? null : null;

  const result = await advanceSubtopicPracticeCycle(admin, user.id, scopeId, examCode);
  if (!result.ok) {
    return errorResponse(result.error, result.error === 'mastery_migration_pending' ? 503 : 500);
  }

  return privateNoStoreJsonResponse(result.state);
}
