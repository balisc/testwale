import { NextResponse } from 'next/server';
import { practiceErrorResponse, requirePracticeUser, resetSubtopicProgress } from '@/lib/practiceServer';
import { getSelectedExamContext } from '@/lib/examLearningServer';
import { isUuid, privateNoStoreJsonResponse } from '@/lib/publicQuestionApiGuards';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { user, admin, error } = await requirePracticeUser();
  if (error === 'unauthorized') return practiceErrorResponse('unauthorized', 401);
  if (!admin) return practiceErrorResponse('service_unavailable', 503);

  let body: { subtopicId?: string };
  try {
    body = (await request.json()) as { subtopicId?: string };
  } catch {
    return practiceErrorResponse('invalid_body', 400);
  }

  const subtopicId = String(body.subtopicId ?? '').trim();
  if (!isUuid(subtopicId)) {
    return practiceErrorResponse('invalid_payload', 400);
  }

  const selected = await getSelectedExamContext();
  if (selected.status === 'incomplete') return practiceErrorResponse('onboarding_incomplete', 409);
  if (selected.status === 'inactive') return practiceErrorResponse('selected_exam_inactive', 409);
  if (selected.status !== 'ready' || selected.userId !== user!.id) {
    return practiceErrorResponse('exam_scope_failed', 503);
  }

  const allowed = await admin
    .from('questions')
    .select('id, question_exam_profile_mappings!inner(exam_profile_id, is_active)')
    .eq('subtopic_id', subtopicId)
    .eq('is_active', true)
    .eq('is_verified', true)
    .eq('question_exam_profile_mappings.exam_profile_id', selected.examProfileId)
    .eq('question_exam_profile_mappings.is_active', true)
    .limit(1);
  if (allowed.error) return practiceErrorResponse('exam_scope_failed', 503);
  if (!allowed.data?.length) return practiceErrorResponse('not_in_selected_exam', 404);

  const ok = await resetSubtopicProgress(admin, user!.id, subtopicId, selected.questionTag);
  if (!ok) {
    return practiceErrorResponse('reset_failed', 500);
  }

  return privateNoStoreJsonResponse({ success: true });
}
