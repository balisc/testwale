import { NextResponse } from 'next/server';
import { changeEmailUserPassword } from '@/lib/accountSecurity';
import { getAuthSessionFromCookies, setAuthCookie } from '@/lib/authCookies';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getAuthSessionFromCookies();
  if (!session) {
    return NextResponse.json({ success: false }, {
      status: 401,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }
  if (session.user.provider !== 'email') {
    return NextResponse.json({ success: false, code: 'reauthenticationUnavailable' }, {
      status: 400,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }
  try {
    const body = await request.json();
    const changed = await changeEmailUserPassword(
      session.user.id,
      String(body?.currentPassword ?? ''),
      String(body?.newPassword ?? ''),
    );
    if (!changed) {
      return NextResponse.json({ success: false, code: 'reauthenticationFailed' }, {
        status: 403,
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }
    // The database function revoked every pre-change session. Create a fresh,
    // unrelated token only after successful password reauthentication.
    await setAuthCookie(session.user);
    return NextResponse.json({ success: true }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return NextResponse.json({ success: false, code: 'reauthenticationFailed' }, {
      status: 403,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }
}
