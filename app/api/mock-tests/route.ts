import { getAuthUserFromCookies } from '@/lib/authCookies';
import { listUserMockTests, MockTestServerError } from '@/lib/mockTests/server';
import { mockErrorResponse, mockJson } from '@/lib/mockTests/http';

export const dynamic = 'force-dynamic';

function parseInteger(value: string | null, fallback: number) {
  if (!value) return fallback;
  if (!/^\d+$/.test(value)) throw new MockTestServerError('INVALID_REQUEST');
  return Number.parseInt(value, 10);
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUserFromCookies();
    if (!user) throw new MockTestServerError('LOGIN_REQUIRED');
    const url = new URL(request.url);
    const result = await listUserMockTests(user.id, parseInteger(url.searchParams.get('page'), 1), parseInteger(url.searchParams.get('pageSize'), 10));
    return mockJson({ ok: true, ...result });
  } catch (error) {
    return mockErrorResponse(error);
  }
}

