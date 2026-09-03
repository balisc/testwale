import { getAuthUserFromCookies } from '@/lib/authCookies';
import { saveMockResponse, MockTestServerError } from '@/lib/mockTests/server';
import { mockErrorResponse, mockJson, rejectUnknownFields } from '@/lib/mockTests/http';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const user = await getAuthUserFromCookies();
    if (!user) throw new MockTestServerError('LOGIN_REQUIRED');
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const allowed = ['itemId', 'selectedOption', 'visited', 'markedForReview', 'eventVersion', 'activeTimeDeltaSeconds'];
    if (!body || rejectUnknownFields(body, allowed) || typeof body.itemId !== 'string'
      || !['A', 'B', 'C', 'D', null].includes(body.selectedOption as string | null)
      || typeof body.visited !== 'boolean' || typeof body.markedForReview !== 'boolean'
      || typeof body.eventVersion !== 'number' || typeof body.activeTimeDeltaSeconds !== 'number') {
      throw new MockTestServerError('INVALID_REQUEST');
    }
    const { testId } = await params;
    const result = await saveMockResponse(user.id, testId, {
      itemId: body.itemId,
      selectedOption: body.selectedOption as 'A' | 'B' | 'C' | 'D' | null,
      visited: body.visited,
      markedForReview: body.markedForReview,
      eventVersion: body.eventVersion,
      activeTimeDeltaSeconds: body.activeTimeDeltaSeconds,
    });
    return mockJson({ ok: true, result });
  } catch (error) {
    return mockErrorResponse(error);
  }
}

