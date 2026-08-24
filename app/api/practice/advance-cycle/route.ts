import { getAuthUserFromCookies } from '@/lib/authCookies';
import { advanceSubtopicPracticeCycle } from '@/lib/practiceServer';
import { isUuid, privateNoStoreJsonResponse } from '@/lib/publicQuestionApiGuards';
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

  const selected = await getSelectedExamContext();
  if (selected.status === 'incomplete') return errorResponse('onboarding_incomplete', 409);
  if (selected.status === 'inactive') return errorResponse('selected_exam_inactive', 409);
  if (selected.status !== 'ready' || selected.userId !== user.id) return errorResponse('exam_scope_failed', 503);
  const allowed = await admin
    .from('questions')
    .select('id, question_exam_profile_mappings!inner(exam_profile_id, is_active)')
    .eq('subtopic_id', scopeId)
    .eq('is_active', true)
    .eq('is_verified', true)
    .eq('question_exam_profile_mappings.exam_profile_id', selected.examProfileId)
    .eq('question_exam_profile_mappings.is_active', true)
    .limit(1);
  if (allowed.error) return errorResponse('exam_scope_failed', 503);
  if (!allowed.data?.length) return errorResponse('not_in_selected_exam', 404);
  const examCode = selected.questionTag;

  const result = await advanceSubtopicPracticeCycle(admin, user.id, scopeId, examCode);
  if (!result.ok) {
    return errorResponse(result.error, result.error === 'mastery_migration_pending' ? 503 : 500);
  }

  return privateNoStoreJsonResponse(result.state);
}
