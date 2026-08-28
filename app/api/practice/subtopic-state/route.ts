import { getSubtopicAttemptState, practiceErrorResponse, requirePracticeUser } from '@/lib/practiceServer';
import { getSelectedExamContext } from '@/lib/examLearningServer';
import { isUuid, privateNoStoreJsonResponse } from '@/lib/publicQuestionApiGuards';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { user, admin, error } = await requirePracticeUser();
  if (error === 'unauthorized') return practiceErrorResponse('unauthorized', 401);
  if (!admin) return practiceErrorResponse('service_unavailable', 503);

  const { searchParams } = new URL(request.url);
  const subtopicId = searchParams.get('subtopicId')?.trim() ?? '';
  const questionIds = [...new Set(searchParams.getAll('questionId').map((value) => value.trim()).filter(Boolean))];

  if (!isUuid(subtopicId) || questionIds.length > 50 || questionIds.some((id) => !isUuid(id))) {
    return practiceErrorResponse('invalid_payload', 400);
  }

  const selected = await getSelectedExamContext();
  if (selected.status === 'incomplete') return practiceErrorResponse('onboarding_incomplete', 409);
  if (selected.status === 'inactive') return practiceErrorResponse('selected_exam_inactive', 409);
  if (selected.status !== 'ready' || selected.userId !== user!.id) return practiceErrorResponse('subtopic_state_failed', 503);
  let allowedQuery = admin.from('questions')
    .select('id, question_exam_profile_mappings!inner(exam_profile_id, is_active)')
    .eq('subtopic_id', subtopicId)
    .eq('is_active', true)
    .eq('is_verified', true)
    .eq('question_exam_profile_mappings.exam_profile_id', selected.examProfileId)
    .eq('question_exam_profile_mappings.is_active', true);
  if (questionIds.length > 0) allowedQuery = allowedQuery.in('id', questionIds);
  const allowedQuestions = await allowedQuery;
  if (allowedQuestions.error) return practiceErrorResponse('subtopic_state_failed', 500);
  const allowedIds = (allowedQuestions.data ?? []).map((row: { id: string }) => String(row.id));
  if (allowedIds.length === 0) return privateNoStoreJsonResponse({ correctQuestionIds: [], attempts: [] });

  const state = await getSubtopicAttemptState(
    admin,
    user!.id,
    subtopicId,
    allowedIds,
  );

  if (!state) {
    return practiceErrorResponse('subtopic_state_failed', 500);
  }

  return privateNoStoreJsonResponse(state);
}
