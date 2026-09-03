import { getAuthUserFromCookies } from '@/lib/authCookies';
import { getMockTestResult, MockTestServerError } from '@/lib/mockTests/server';
import { mockErrorResponse, mockJson } from '@/lib/mockTests/http';
import type { MockReviewFilter } from '@/lib/mockTests/types';

export const dynamic = 'force-dynamic';

function positiveInteger(value: string | null, fallback: number) {
  if (!value) return fallback;
  if (!/^\d+$/.test(value)) throw new MockTestServerError('INVALID_REQUEST');
  return Number.parseInt(value, 10);
}

export async function GET(request: Request, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const user = await getAuthUserFromCookies();
    if (!user) throw new MockTestServerError('LOGIN_REQUIRED');
    const { testId } = await params;
    const url = new URL(request.url);
    const filter = (url.searchParams.get('filter') ?? 'all') as MockReviewFilter;
    if (!['all', 'correct', 'wrong', 'unanswered', 'marked'].includes(filter)) throw new MockTestServerError('INVALID_REQUEST');
    return mockJson({ ok: true, result: await getMockTestResult(user.id, testId, {
      page: positiveInteger(url.searchParams.get('page'), 1),
      pageSize: positiveInteger(url.searchParams.get('pageSize'), 10),
      filter,
    }) });
  } catch (error) {
    return mockErrorResponse(error);
  }
}
