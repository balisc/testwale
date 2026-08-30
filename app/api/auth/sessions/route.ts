import { NextResponse } from 'next/server';
import {
  clearAuthCookieOnResponse,
  getAuthSessionFromCookies,
  rotateAuthCookieIfNeeded,
} from '@/lib/authCookies';
import { listUserSessions, revokeUserSessionById } from '@/lib/sessionStore';

export const dynamic = 'force-dynamic';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store' } as const;

export async function GET() {
  const session = await getAuthSessionFromCookies();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: PRIVATE_HEADERS });
  const rows = await listUserSessions(session.user.id);
  const response = NextResponse.json({
    sessions: rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at,
      expiresAt: row.expires_at,
      current: row.id === session.sessionId,
    })),
  }, { headers: PRIVATE_HEADERS });
  await rotateAuthCookieIfNeeded(response, session);
  return response;
}

export async function DELETE(request: Request) {
  const session = await getAuthSessionFromCookies();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: PRIVATE_HEADERS });
  let sessionId = '';
  try {
    const body = await request.json();
    sessionId = String(body?.sessionId ?? '');
  } catch {
    return NextResponse.json({ error: 'invalid_session' }, { status: 400, headers: PRIVATE_HEADERS });
  }
  if (!UUID_PATTERN.test(sessionId)) {
    return NextResponse.json({ error: 'invalid_session' }, { status: 400, headers: PRIVATE_HEADERS });
  }
  const revoked = await revokeUserSessionById(session.user.id, sessionId);
  if (!revoked) {
    // Do not disclose whether an ID belongs to another user.
    return NextResponse.json({ error: 'invalid_session' }, { status: 404, headers: PRIVATE_HEADERS });
  }
  const response = NextResponse.json({ success: true }, { headers: PRIVATE_HEADERS });
  if (sessionId === session.sessionId) {
    await clearAuthCookieOnResponse(response, session.rawToken);
  }
  return response;
}
