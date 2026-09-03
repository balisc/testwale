import { getAuthUserFromCookies } from '@/lib/authCookies';
import { submitMockTest, MockTestServerError } from '@/lib/mockTests/server';
import { mockErrorResponse, mockJson, rejectUnknownFields } from '@/lib/mockTests/http';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const user = await getAuthUserFromCookies();
    if (!user) throw new MockTestServerError('LOGIN_REQUIRED');
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    if (rejectUnknownFields(body, [])) throw new MockTestServerError('INVALID_REQUEST');
    const { testId } = await params;
    return mockJson({ ok: true, result: await submitMockTest(user.id, testId) });
  } catch (error) {
    return mockErrorResponse(error);
  }
}

