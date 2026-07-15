import { NextResponse } from 'next/server';
import { practiceErrorResponse, requirePracticeUser, resetSubtopicProgress } from '@/lib/practiceServer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { user, admin, error } = await requirePracticeUser();
  if (error === 'unauthorized') return practiceErrorResponse('unauthorized', 401);
  if (!admin) return practiceErrorResponse('service_unavailable', 503);

  let body: { subtopicId?: string };
  try {
    body = (await request.json()) as { subtopicId?: string };
  } catch {
    return practiceErrorResponse('invalid_body', 400);
  }

  const subtopicId = String(body.subtopicId ?? '').trim();
  if (!subtopicId) {
    return practiceErrorResponse('invalid_payload', 400);
  }

  const ok = await resetSubtopicProgress(admin, user!.id, subtopicId);
  if (!ok) {
    return practiceErrorResponse('reset_failed', 500);
  }

  return NextResponse.json({ success: true });
}
