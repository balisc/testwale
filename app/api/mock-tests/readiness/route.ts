import { parseMockExamKey } from '@/lib/mockTests/blueprints';
import { getMockReadiness, MockTestServerError } from '@/lib/mockTests/server';
import { mockErrorResponse, mockJson } from '@/lib/mockTests/http';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const examKey = parseMockExamKey(new URL(request.url).searchParams.get('exam'));
    if (!examKey) throw new MockTestServerError('INVALID_REQUEST');
    return mockJson({ ok: true, readiness: await getMockReadiness(examKey) });
  } catch (error) {
    return mockErrorResponse(error);
  }
}
