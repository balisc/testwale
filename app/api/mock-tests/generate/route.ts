import { getAuthUserFromCookies } from '@/lib/authCookies';
import { parseMockExamKey } from '@/lib/mockTests/blueprints';
import { generateMockTest, MockTestServerError } from '@/lib/mockTests/server';
import { mockErrorResponse, mockJson, rejectUnknownFields } from '@/lib/mockTests/http';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const user = await getAuthUserFromCookies();
    if (!user) throw new MockTestServerError('LOGIN_REQUIRED');
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || rejectUnknownFields(body, ['idempotencyKey', 'examKey']) || typeof body.idempotencyKey !== 'string') {
      throw new MockTestServerError('INVALID_REQUEST');
    }
    const examKey = parseMockExamKey(body.examKey);
    if (!examKey) throw new MockTestServerError('INVALID_REQUEST');
    const result = await generateMockTest(user.id, body.idempotencyKey, examKey);
    return mockJson({ ok: true, ...result }, result.reused ? 200 : 201);
  } catch (error) {
    return mockErrorResponse(error);
  }
}
