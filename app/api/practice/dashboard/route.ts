import { NextResponse } from 'next/server';
import { practiceErrorResponse, requirePracticeUser } from '@/lib/practiceServer';
import { getSelectedExamLearning } from '@/lib/examLearningServer';
import { snapshotToProgressDashboard } from '@/lib/examLearning';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { user, error } = await requirePracticeUser();
  if (error === 'unauthorized') return practiceErrorResponse('unauthorized', 401);

  const selected = await getSelectedExamLearning();
  if (selected.status === 'incomplete') return practiceErrorResponse('onboarding_incomplete', 409);
  if (selected.status === 'inactive') return practiceErrorResponse('selected_exam_inactive', 409);
  if (selected.status !== 'ready' || selected.userId !== user!.id) {
    return practiceErrorResponse('dashboard_failed', 503);
  }
  return NextResponse.json(snapshotToProgressDashboard(selected.snapshot), {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
