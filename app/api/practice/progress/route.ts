import { NextResponse } from 'next/server';
import type { PracticeProgress } from '@/lib/practice';
import { practiceErrorResponse, requirePracticeUser } from '@/lib/practiceServer';

export const dynamic = 'force-dynamic';

function buildProgress(rows: Array<{ subject_id: string | null; topic_id: string | null; is_correct: boolean }>): PracticeProgress {
  const attempted = rows.length;
  const correct = rows.filter((row) => row.is_correct).length;
  const wrong = attempted - correct;
  const accuracy = attempted > 0 ? Math.round((correct * 1000) / attempted) / 10 : 0;

  const subjectMap = new Map<string, { attempted: number; correct: number }>();
  const topicMap = new Map<string, { attempted: number; correct: number }>();

  for (const row of rows) {
    const subjectKey = row.subject_id ?? 'unknown';
    const topicKey = row.topic_id ?? 'unknown';
    const subjectEntry = subjectMap.get(subjectKey) ?? { attempted: 0, correct: 0 };
    subjectEntry.attempted += 1;
    if (row.is_correct) subjectEntry.correct += 1;
    subjectMap.set(subjectKey, subjectEntry);

    const topicEntry = topicMap.get(topicKey) ?? { attempted: 0, correct: 0 };
    topicEntry.attempted += 1;
    if (row.is_correct) topicEntry.correct += 1;
    topicMap.set(topicKey, topicEntry);
  }

  return {
    attempted,
    correct,
    wrong,
    accuracy,
    bySubject: Array.from(subjectMap.entries()).map(([subject_id, stats]) => ({
      subject_id: subject_id === 'unknown' ? null : subject_id,
      attempted: stats.attempted,
      correct: stats.correct,
      accuracy: stats.attempted > 0 ? Math.round((stats.correct * 1000) / stats.attempted) / 10 : 0,
    })),
    byTopic: Array.from(topicMap.entries()).map(([topic_id, stats]) => ({
      topic_id: topic_id === 'unknown' ? null : topic_id,
      attempted: stats.attempted,
      correct: stats.correct,
      accuracy: stats.attempted > 0 ? Math.round((stats.correct * 1000) / stats.attempted) / 10 : 0,
    })),
  };
}

export async function GET(request: Request) {
  const { user, admin, error } = await requirePracticeUser();
  if (error === 'unauthorized') return practiceErrorResponse('unauthorized', 401);
  if (error === 'service_unavailable') return practiceErrorResponse('service_unavailable', 503);

  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subjectId');
  const topicId = searchParams.get('topicId');
  const subtopicId = searchParams.get('subtopicId');

  let query = admin!
    .from('user_attempts')
    .select('subject_id, topic_id, is_correct')
    .eq('user_id', user!.id);

  if (subjectId) query = query.eq('subject_id', subjectId);
  if (topicId) query = query.eq('topic_id', topicId);
  if (subtopicId) query = query.eq('subtopic_id', subtopicId);

  const { data, error: dbError } = await query;

  if (dbError) {
    console.error('[practice/progress]', dbError);
    return practiceErrorResponse('progress_failed', 500);
  }

  return NextResponse.json(buildProgress(data ?? []));
}
