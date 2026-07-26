import { NextResponse } from 'next/server';
import { clearAuthCookie, getAuthUserFromCookies } from '@/lib/authCookies';

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
  const user = await getAuthUserFromCookies();
  return NextResponse.json({ user }, { headers: PRIVATE_NO_STORE });
}

export async function DELETE() {
  await clearAuthCookie();
  return NextResponse.json({ success: true }, { headers: PRIVATE_NO_STORE });
}
