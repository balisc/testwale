import { NextResponse } from 'next/server';
import { clearAuthCookieOnResponse, getAuthSessionFromCookies } from '@/lib/authCookies';
import { loginEmailUser } from '@/lib/userRepository';
import { revokeAllUserSessions } from '@/lib/sessionStore';

export const dynamic = 'force-dynamic';

const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store' } as const;

export async function POST(request: Request) {
  const session = await getAuthSessionFromCookies();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: PRIVATE_HEADERS });
  if (session.user.provider === 'email') {
    let currentPassword = '';
    try {
      const body = await request.json();
      currentPassword = String(body?.currentPassword ?? '');
    } catch {
      // Fall through to the same generic reauthentication failure.
    }
    const reauthenticated = await loginEmailUser({ email: session.user.email, password: currentPassword });
    if (!reauthenticated.ok || reauthenticated.user.id !== session.user.id) {
      return NextResponse.json({ success: false, code: 'reauthenticationFailed' }, {
        status: 403,
        headers: PRIVATE_HEADERS,
      });
    }
  }
  if (!await revokeAllUserSessions(session.user.id)) {
    return NextResponse.json({ success: false }, { status: 503, headers: PRIVATE_HEADERS });
  }
  const response = NextResponse.json({ success: true }, { headers: PRIVATE_HEADERS });
  await clearAuthCookieOnResponse(response, session.rawToken);
  return response;
}
