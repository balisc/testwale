import { createHmac, timingSafeEqual } from 'crypto';

export const AUTH_COOKIE_NAME = 'qw_auth';
export const AUTH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  provider: 'email' | 'google';
  avatarUrl?: string | null;
};

type SessionPayload = SessionUser & { exp: number };

export type LegacySession = {
  user: SessionUser;
  issuedAt: number;
  expiresAt: number;
};

export const STORED_SESSION_PREFIX = 'v2.';

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret && (process.env.NODE_ENV !== 'production' || Buffer.byteLength(secret, 'utf8') >= 32)) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[auth] AUTH_SECRET with at least 32 bytes is required in production. Use an independent random value.',
    );
  }

  // Development only — never used when NODE_ENV=production.
  return 'questionwale-dev-secret';
}

function sign(body: string) {
  return createHmac('sha256', getAuthSecret()).update(body).digest('base64url');
}

/** Legacy transition token. New sessions are opaque and stored server-side. */
export function createSessionToken(user: SessionUser) {
  const payload: SessionPayload = {
    ...user,
    exp: Date.now() + AUTH_MAX_AGE_SECONDS * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function parseSessionToken(token: string | undefined | null): SessionUser | null {
  return parseLegacySessionToken(token)?.user ?? null;
}

export function parseLegacySessionToken(token: string | undefined | null): LegacySession | null {
  if (!token) return null;
  if (token.startsWith(STORED_SESSION_PREFIX)) return null;

  const lastDot = token.lastIndexOf('.');
  if (lastDot <= 0) return null;

  const body = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  const expected = sign(body);

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload?.id || !payload?.email || !payload?.fullName || !payload?.provider) return null;
    if (Date.now() > payload.exp) return null;

    return {
      user: {
        id: payload.id,
        fullName: payload.fullName,
        email: payload.email,
        provider: payload.provider,
        avatarUrl: payload.avatarUrl ?? null,
      },
      issuedAt: payload.exp - AUTH_MAX_AGE_SECONDS * 1000,
      expiresAt: payload.exp,
    };
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: AUTH_MAX_AGE_SECONDS,
  };
}
