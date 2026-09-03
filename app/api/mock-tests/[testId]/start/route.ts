import { getAuthUserFromCookies } from '@/lib/authCookies';
import { startMockTest, MockTestServerError } from '@/lib/mockTests/server';
import { mockErrorResponse, mockJson, rejectUnknownFields } from '@/lib/mockTests/http';
import type { MockMode } from '@/lib/mockTests/blueprintTypes';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const user = await getAuthUserFromCookies();
    if (!user) throw new MockTestServerError('LOGIN_REQUIRED');
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || rejectUnknownFields(body, ['timingMode']) || (body.timingMode !== 'standard' && body.timingMode !== 'scribe_simulation')) {
      throw new MockTestServerError('INVALID_REQUEST');
    }
    const { testId } = await params;
    return mockJson({ ok: true, test: await startMockTest(user.id, testId, body.timingMode as MockMode) });
  } catch (error) {
    return mockErrorResponse(error);
  }
}
