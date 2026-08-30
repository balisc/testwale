import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import {
  AUTH_COOKIE_NAME,
  createSessionToken,
  getSessionCookieOptions,
  type SessionUser,
} from '@/lib/appSession';
import {
  createStoredSession,
  resolveAuthSession,
  revokeSessionToken,
  rotateStoredSession,
  type AuthSession,
} from '@/lib/sessionStore';

async function createCompatibleToken(user: SessionUser) {
  const stored = await createStoredSession(user);
  if (stored.ok) return stored.rawToken;
  if (stored.migrationMissing || process.env.NODE_ENV !== 'production') {
    return createSessionToken(user);
  }
  throw new Error('[auth] Could not create a revocable server session.');
}

export async function setAuthCookie(user: SessionUser) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, await createCompatibleToken(user), getSessionCookieOptions());
}

/** Prefer this on redirect responses; cookies() alone may not attach to redirects. */
export async function attachAuthCookie(
  response: NextResponse,
  user: SessionUser,
): Promise<NextResponse> {
  response.cookies.set(AUTH_COOKIE_NAME, await createCompatibleToken(user), getSessionCookieOptions());
  return response;
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  // Expire the browser cookie even if the backing session store is temporarily
  // unavailable. A database/network failure must never keep the user signed in
  // on this device.
  cookieStore.set(AUTH_COOKIE_NAME, '', { ...getSessionCookieOptions(), maxAge: 0 });
  try {
    await revokeSessionToken(rawToken);
  } catch {
    // Best-effort server revocation; the local session is already cleared.
  }
}

export async function clearAuthCookieOnResponse(
  response: NextResponse,
  rawToken?: string | null,
) {
  response.cookies.set(AUTH_COOKIE_NAME, '', { ...getSessionCookieOptions(), maxAge: 0 });
  try {
    await revokeSessionToken(rawToken);
  } catch {
    // Best-effort server revocation; the local session is already cleared.
  }
  return response;
}

export async function getAuthSessionFromCookies(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  return resolveAuthSession(cookieStore.get(AUTH_COOKIE_NAME)?.value);
}

export async function getAuthUserFromCookies(): Promise<SessionUser | null> {
  return (await getAuthSessionFromCookies())?.user ?? null;
}

export async function rotateAuthCookieIfNeeded(response: NextResponse, session: AuthSession) {
  if (!session.needsRotation || session.kind !== 'stored') return response;
  const replacement = await rotateStoredSession(session);
  if (replacement) {
    response.cookies.set(AUTH_COOKIE_NAME, replacement, getSessionCookieOptions());
  }
  return response;
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
