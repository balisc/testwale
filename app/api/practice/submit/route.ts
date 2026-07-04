import { NextResponse } from 'next/server';
import { getAuthUserFromCookies } from '@/lib/authCookies';
import {
  checkAnswerOnServer,
  getPracticeAdmin,
  practiceErrorResponse,
  submitQuestionAnswer,
} from '@/lib/practiceServer';

export const dynamic = 'force-dynamic';

type SubmitBody = {
  questionId?: string;
  selectedOption?: string;
  timeTakenSeconds?: number | null;
};

export async function POST(request: Request) {
  const user = await getAuthUserFromCookies();
  const { admin } = await getPracticeAdmin();

  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return practiceErrorResponse('invalid_body', 400);
  }

  const questionId = String(body.questionId ?? '').trim();
  const selectedOption = String(body.selectedOption ?? '').trim().toUpperCase();

  if (!questionId || !['A', 'B', 'C', 'D'].includes(selectedOption)) {
    return practiceErrorResponse('invalid_payload', 400);
  }

  const timeTakenSeconds =
    typeof body.timeTakenSeconds === 'number' && body.timeTakenSeconds >= 0
      ? Math.round(body.timeTakenSeconds)
      : null;

  if (user) {
    if (!admin) {
      console.error('[practice/submit] logged-in user but SUPABASE_SERVICE_ROLE_KEY is missing');
      return practiceErrorResponse('service_unavailable', 503);
    }

    const result = await submitQuestionAnswer(
      admin,
      user.id,
      questionId,
      selectedOption,
      timeTakenSeconds,
    );

    if (!result) {
      return practiceErrorResponse('submit_failed', 500);
    }

    return NextResponse.json(result);
  }

  const fallback = await checkAnswerOnServer(questionId, selectedOption);
  if (!fallback) {
    return practiceErrorResponse('submit_failed', 500);
  }

  return NextResponse.json(fallback);
}
