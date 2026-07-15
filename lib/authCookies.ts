import { cookies } from 'next/headers';
import {
  AUTH_COOKIE_NAME,
  createSessionToken,
  getSessionCookieOptions,
  parseSessionToken,
  type SessionUser,
} from '@/lib/appSession';

export async function setAuthCookie(user: SessionUser) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, createSessionToken(user), getSessionCookieOptions());
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, '', { ...getSessionCookieOptions(), maxAge: 0 });
}

export async function getAuthUserFromCookies(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  return parseSessionToken(cookieStore.get(AUTH_COOKIE_NAME)?.value);
}

export function toSessionUser(user: {
  id: string;
  full_name: string;
  email: string;
  provider: 'email' | 'google';
  avatar_url?: string | null;
}): SessionUser {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    provider: user.provider,
    avatarUrl: user.avatar_url ?? null,
  };
}
