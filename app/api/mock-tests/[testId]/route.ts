import { getAuthUserFromCookies } from '@/lib/authCookies';
import { getMockTestShell, MockTestServerError } from '@/lib/mockTests/server';
import { mockErrorResponse, mockJson } from '@/lib/mockTests/http';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const user = await getAuthUserFromCookies();
    if (!user) throw new MockTestServerError('LOGIN_REQUIRED');
    const { testId } = await params;
    return mockJson({ ok: true, test: await getMockTestShell(user.id, testId) });
  } catch (error) {
    return mockErrorResponse(error);
  }
}

