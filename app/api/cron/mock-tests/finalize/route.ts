import { timingSafeEqual } from 'node:crypto';
import { finalizeExpiredMockTests } from '@/lib/mockTests/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function authorized(request: Request) {
  const configured = process.env.MOCK_TEST_CRON_SECRET?.trim();
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (!configured || !supplied) return false;
  const expectedBuffer = Buffer.from(configured);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

/** Invoke every minute from a trusted scheduler. Repeated finalization is harmless. */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return Response.json({ ok: false, code: 'UNAUTHORIZED' }, {
      status: 401,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }
  try {
    const finalized = await finalizeExpiredMockTests(250);
    return Response.json({ ok: true, finalized, checkedAt: new Date().toISOString() }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('[mock-tests:expiry-job]', error);
    return Response.json({ ok: false, code: 'FINALIZE_FAILED' }, {
      status: 500,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }
}
