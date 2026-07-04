import { NextResponse } from 'next/server';
import { REPORT_REASONS, type ReportQuestionResponse } from '@/lib/practice';
import { practiceErrorResponse, reportQuestion, requirePracticeUser } from '@/lib/practiceServer';

export const dynamic = 'force-dynamic';

type ReportBody = {
  questionId?: string;
  reason?: string;
  details?: string | null;
};

export async function POST(request: Request) {
  const { user, admin, error } = await requirePracticeUser();
  if (error === 'unauthorized') return practiceErrorResponse('unauthorized', 401);
  if (error === 'service_unavailable') return practiceErrorResponse('service_unavailable', 503);

  let body: ReportBody;
  try {
    body = (await request.json()) as ReportBody;
  } catch {
    return practiceErrorResponse('invalid_body', 400);
  }

  const questionId = String(body.questionId ?? '').trim();
  const reason = String(body.reason ?? '').trim();

  if (!questionId || !REPORT_REASONS.includes(reason as (typeof REPORT_REASONS)[number])) {
    return practiceErrorResponse('invalid_payload', 400);
  }

  const result = await reportQuestion(
    admin!,
    user!.id,
    questionId,
    reason,
    body.details ?? null,
  );

  if (!result) {
    return practiceErrorResponse('report_failed', 500);
  }

  return NextResponse.json(result as ReportQuestionResponse);
}
