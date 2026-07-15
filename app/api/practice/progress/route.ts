import { NextResponse } from 'next/server';
import { getPracticeProgressForUser, practiceErrorResponse, requirePracticeUser } from '@/lib/practiceServer';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { user, error } = await requirePracticeUser();
  if (error === 'unauthorized') return practiceErrorResponse('unauthorized', 401);

  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subjectId');
  const topicId = searchParams.get('topicId');
  const subtopicId = searchParams.get('subtopicId');

  const progress = await getPracticeProgressForUser(user!.id, {
    subjectId,
    topicId,
    subtopicId,
  });

  if (!progress) {
    return practiceErrorResponse('progress_failed', 500);
  }

  return NextResponse.json(progress);
}
