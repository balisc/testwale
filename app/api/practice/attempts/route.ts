import type { LocalizedText } from '@/types/polity';
import type { PracticeAttemptRestoreRow } from '@/lib/practice';
import { requirePracticeUser } from '@/lib/practiceServer';
import {
  isTextBodyTooLarge,
  parseBatchQuestionIdsPayload,
  privateNoStoreJsonResponse,
} from '@/lib/publicQuestionApiGuards';
import { getSelectedExamContext } from '@/lib/examLearningServer';

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
  questions: QuestionJoin | QuestionJoin[] | null;
};

function unwrapQuestionJoin(value: QuestionJoin | QuestionJoin[] | null | undefined): QuestionJoin | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function privateErrorResponse(error: string, status: number) {
  return privateNoStoreJsonResponse({ error }, status);
}

export async function POST(request: Request) {
  const { user, admin, error } = await requirePracticeUser();
  if (error === 'unauthorized') return privateErrorResponse('unauthorized', 401);
  if (!admin) return privateErrorResponse('service_unavailable', 503);

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return privateErrorResponse('invalid_body', 400);
  }

  if (isTextBodyTooLarge(rawBody)) {
    return privateErrorResponse('payload_too_large', 400);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return privateErrorResponse('invalid_body', 400);
  }

  const parsed = parseBatchQuestionIdsPayload(body);
  if (!parsed.ok) {
    return privateErrorResponse(parsed.error, 400);
  }

  const { questionIds } = parsed;
  if (questionIds.length === 0) {
    return privateNoStoreJsonResponse({ attempts: [] as PracticeAttemptRestoreRow[] });
  }

  const selected = await getSelectedExamContext();
  if (selected.status === 'incomplete') return privateErrorResponse('onboarding_incomplete', 409);
  if (selected.status === 'inactive') return privateErrorResponse('selected_exam_inactive', 409);
  if (selected.status !== 'ready' || selected.userId !== user!.id) return privateErrorResponse('exam_scope_failed', 503);

  // Only restore attempts for IDs that still exist as public practice questions.
  const liveQuery = admin
    .from('questions')
    .select('id, question_exam_profile_mappings!inner(exam_profile_id, is_active)')
    .in('id', questionIds)
    .eq('is_active', true)
    .eq('is_verified', true)
    .eq('question_exam_profile_mappings.exam_profile_id', selected.examProfileId)
    .eq('question_exam_profile_mappings.is_active', true);
  const { data: liveRows, error: liveError } = await liveQuery;

  if (liveError) {
    console.error('[practice/attempts] live filter', liveError.message);
    return privateErrorResponse('attempts_failed', 500);
  }

  const liveQuestionIds = (liveRows ?? []).map((row: { id: string }) => String(row.id));
  if (liveQuestionIds.length === 0) {
    return privateNoStoreJsonResponse({
      attempts: [] as PracticeAttemptRestoreRow[],
      droppedStaleQuestionIds: questionIds,
    });
  }

  const liveSet = new Set(liveQuestionIds);
  const droppedStaleQuestionIds = questionIds.filter((id) => !liveSet.has(id));

  const { data, error: dbError } = await admin
    .from('user_attempts')
    .select(
      'question_id, selected_option, is_correct, questions:question_id (correct_option, explanation, attempt_count, correct_count)',
    )
    .eq('user_id', user!.id)
    .in('question_id', liveQuestionIds);

  if (dbError) {
    console.error('[practice/attempts]', dbError.message);
    return privateErrorResponse('attempts_failed', 500);
  }

  const attempts = ((data ?? []) as AttemptRow[])
    .filter((row) => liveSet.has(String(row.question_id)) && unwrapQuestionJoin(row.questions))
    .map((row) => {
      const question = unwrapQuestionJoin(row.questions)!;
      const attemptCount = Number(question?.attempt_count ?? 0);
      const correctCount = Number(question?.correct_count ?? 0);
      return {
        question_id: String(row.question_id),
        selected_option: String(row.selected_option),
        is_correct: Boolean(row.is_correct),
        correct_option: String(question?.correct_option ?? ''),
        explanation: (question?.explanation ?? {}) as LocalizedText,
        attempt_count: attemptCount,
        correct_count: correctCount,
        correct_percentage:
          attemptCount > 0 ? Math.round((correctCount * 10000) / attemptCount) / 100 : null,
      } satisfies PracticeAttemptRestoreRow;
    });

  return privateNoStoreJsonResponse({ attempts, droppedStaleQuestionIds });
}
