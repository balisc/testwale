import { NextResponse } from 'next/server';
import type { LocalizedText } from '@/types/polity';
import type { UserAttemptSummary } from '@/lib/practice';
import { practiceErrorResponse, requirePracticeUser } from '@/lib/practiceServer';

export const dynamic = 'force-dynamic';

type QuestionJoin = {
  correct_option: string;
  explanation: LocalizedText;
  attempt_count: number;
  correct_count: number;
};

type AttemptRow = {
  question_id: string;
  selected_option: string;
  is_correct: boolean;
  attempted_at: string;
  questions: QuestionJoin | QuestionJoin[] | null;
};

function unwrapQuestionJoin(value: QuestionJoin | QuestionJoin[] | null | undefined): QuestionJoin | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function POST(request: Request) {
  const { user, admin, error } = await requirePracticeUser();
  if (error === 'unauthorized') return practiceErrorResponse('unauthorized', 401);
  if (error === 'service_unavailable') return practiceErrorResponse('service_unavailable', 503);

  let questionIds: string[] = [];
  try {
    const body = (await request.json()) as { questionIds?: string[] };
    questionIds = Array.isArray(body.questionIds) ? body.questionIds.map(String) : [];
  } catch {
    return practiceErrorResponse('invalid_body', 400);
  }

  if (questionIds.length === 0) {
    return NextResponse.json({ attempts: [] as UserAttemptSummary[] });
  }

  const { data, error: dbError } = await admin!
    .from('user_attempts')
    .select(
      'question_id, selected_option, is_correct, attempted_at, questions:question_id (correct_option, explanation, attempt_count, correct_count)',
    )
    .eq('user_id', user!.id)
    .in('question_id', questionIds);

  if (dbError) {
    console.error('[practice/attempts]', dbError);
    return practiceErrorResponse('attempts_failed', 500);
  }

  const attempts = ((data ?? []) as AttemptRow[]).map((row) => {
    const question = unwrapQuestionJoin(row.questions);
    const attemptCount = Number(question?.attempt_count ?? 0);
    const correctCount = Number(question?.correct_count ?? 0);
    return {
      question_id: String(row.question_id),
      selected_option: String(row.selected_option),
      is_correct: Boolean(row.is_correct),
      attempted_at: String(row.attempted_at),
      correct_option: question?.correct_option,
      explanation: question?.explanation,
      attempt_count: attemptCount,
      correct_count: correctCount,
      correct_percentage:
        attemptCount > 0 ? Math.round((correctCount * 10000) / attemptCount) / 100 : null,
    } satisfies UserAttemptSummary;
  });

  return NextResponse.json({ attempts });
}
