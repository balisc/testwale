import { NextResponse } from 'next/server';
import {
  clearAuthCookie,
  getAuthSessionFromCookies,
  rotateAuthCookieIfNeeded,
} from '@/lib/authCookies';

export const dynamic = 'force-dynamic';

const PRIVATE_NO_STORE = {
  'Cache-Control': 'private, no-store',
} as const;

/**
 * Session probe: returns { user: null } with HTTP 200 when logged out.
 * AuthContext treats non-OK or missing user as signed-out state.
 * Response must never be shared-cached.
 */
export async function GET() {
  const session = await getAuthSessionFromCookies();
  const response = NextResponse.json({ user: session?.user ?? null }, { headers: PRIVATE_NO_STORE });
  if (session) await rotateAuthCookieIfNeeded(response, session);
  return response;
}

export async function DELETE() {
  await clearAuthCookie();
  return NextResponse.json({ success: true }, { headers: PRIVATE_NO_STORE });
}
