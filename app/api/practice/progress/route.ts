import { NextResponse } from 'next/server';
import { practiceErrorResponse, requirePracticeUser } from '@/lib/practiceServer';
import { getSelectedExamLearning } from '@/lib/examLearningServer';
import { snapshotToPracticeProgress } from '@/lib/examLearning';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { user, error } = await requirePracticeUser();
  if (error === 'unauthorized') return practiceErrorResponse('unauthorized', 401);

  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subjectId');
  const topicId = searchParams.get('topicId');
  const subtopicId = searchParams.get('subtopicId');

  const selected = await getSelectedExamLearning();
  if (selected.status === 'incomplete') return practiceErrorResponse('onboarding_incomplete', 409);
  if (selected.status === 'inactive') return practiceErrorResponse('selected_exam_inactive', 409);
  if (selected.status !== 'ready' || selected.userId !== user!.id) return practiceErrorResponse('progress_failed', 503);

  const progress = snapshotToPracticeProgress(selected.snapshot, {
    subjectId,
    topicId,
    subtopicId,
  });

  if (!progress) {
    return practiceErrorResponse('not_in_selected_exam', 404);
  }

  return NextResponse.json(progress, { headers: { 'Cache-Control': 'private, no-store' } });
}
