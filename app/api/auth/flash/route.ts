import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  AUTH_FLASH_COOKIE,
  getAuthFlashMessage,
  isAuthFlashKind,
} from '@/lib/authFlash';
import { getSessionCookieOptions } from '@/lib/appSession';

export const dynamic = 'force-dynamic';

const PRIVATE_NO_STORE = { 'Cache-Control': 'private, no-store' } as const;

/** Read and clear one-time auth flash (route handler only). */
export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(AUTH_FLASH_COOKIE)?.value;
  const kind = isAuthFlashKind(raw) ? raw : null;

  const response = NextResponse.json(
    { message: kind ? getAuthFlashMessage(kind) : null },
    { headers: PRIVATE_NO_STORE },
  );

  if (kind) {
    response.cookies.set(AUTH_FLASH_COOKIE, '', {
      ...getSessionCookieOptions(),
      maxAge: 0,
    });
  }

  return response;
}
