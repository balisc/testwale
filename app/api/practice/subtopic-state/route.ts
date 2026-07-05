import { NextResponse } from 'next/server';
import { getSubtopicAttemptState, practiceErrorResponse, requirePracticeUser } from '@/lib/practiceServer';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { user, admin, error } = await requirePracticeUser();
  if (error === 'unauthorized') return practiceErrorResponse('unauthorized', 401);
  if (!admin) return practiceErrorResponse('service_unavailable', 503);

  const { searchParams } = new URL(request.url);
  const subtopicId = searchParams.get('subtopicId')?.trim() ?? '';
  const questionIds = searchParams.getAll('questionId').map(String).filter(Boolean);

  if (!subtopicId) {
    return practiceErrorResponse('invalid_payload', 400);
  }

  const state = await getSubtopicAttemptState(
    admin,
    user!.id,
    subtopicId,
    questionIds.length > 0 ? questionIds : undefined,
  );

  if (!state) {
    return practiceErrorResponse('subtopic_state_failed', 500);
  }

  return NextResponse.json(state);
}
