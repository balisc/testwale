import { createHash, randomBytes } from 'crypto';
import {
  AUTH_MAX_AGE_SECONDS,
  STORED_SESSION_PREFIX,
  parseLegacySessionToken,
  type SessionUser,
} from '@/lib/appSession';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const TOKEN_BYTES = 32;
const ROTATION_AFTER_MS = 24 * 60 * 60 * 1000;
const TOUCH_AFTER_MS = 5 * 60 * 1000;

type StoredSessionRow = {
  id: string;
  user_id: string;
  created_at: string;
  last_used_at: string;
  last_rotated_at: string;
  expires_at: string;
  revoked_at: string | null;
};

export type AuthSession = {
  user: SessionUser;
  sessionId: string | null;
  rawToken: string;
  expiresAt: number;
  kind: 'stored' | 'legacy';
  needsRotation: boolean;
};

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function createOpaqueSessionToken() {
  return `${STORED_SESSION_PREFIX}${randomBytes(TOKEN_BYTES).toString('base64url')}`;
}

export function isStoredSessionToken(token: string | undefined | null) {
  return Boolean(token && /^v2\.[A-Za-z0-9_-]{43}$/.test(token));
}

/**
 * Proxy may transparently replace legacy cookies only on page reads. API
 * handlers own their response cookies, and adding a replacement cookie to an
 * auth mutation (especially logout) can overwrite that handler's deletion.
 */
export function shouldUpgradeLegacySessionInProxy(method: string, pathname: string) {
  const normalizedMethod = method.toUpperCase();
  return (
    (normalizedMethod === 'GET' || normalizedMethod === 'HEAD') &&
    !pathname.startsWith('/api/')
  );
}

function isMissingSecurityMigration(error: unknown) {
  const record = error as { code?: string; message?: string } | null;
  const code = String(record?.code ?? '');
  const message = String(record?.message ?? '');
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    (/app_sessions|user_security_state/i.test(message) && /does not exist|schema cache/i.test(message))
  );
}

async function loadAuthoritativeUser(userId: string): Promise<SessionUser | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin
    .from('users')
    .select('id, full_name, email, provider, avatar_url')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data || (data.provider !== 'email' && data.provider !== 'google')) return null;
  return {
    id: String(data.id),
    fullName: String(data.full_name),
    email: String(data.email),
    provider: data.provider,
    avatarUrl: typeof data.avatar_url === 'string' ? data.avatar_url : null,
  };
}

async function insertStoredSession(userId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false as const, migrationMissing: false };
  const rawToken = createOpaqueSessionToken();
  const expiresAt = new Date(Date.now() + AUTH_MAX_AGE_SECONDS * 1000);
  const { data, error } = await admin
    .from('app_sessions')
    .insert({ user_id: userId, token_hash: tokenHash(rawToken), expires_at: expiresAt.toISOString() })
    .select('id')
    .single();
  if (error || !data) {
    return { ok: false as const, migrationMissing: isMissingSecurityMigration(error) };
  }
  return { ok: true as const, rawToken, sessionId: String(data.id), expiresAt: expiresAt.getTime() };
}

export async function createStoredSession(user: SessionUser) {
  return insertStoredSession(user.id);
}

async function resolveStoredSession(rawToken: string): Promise<AuthSession | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin
    .from('app_sessions')
    .select('id, user_id, created_at, last_used_at, last_rotated_at, expires_at, revoked_at')
    .eq('token_hash', tokenHash(rawToken))
    .maybeSingle();
  if (error || !data) return null;

  const row = data as StoredSessionRow;
  const now = Date.now();
  const expiresAt = Date.parse(row.expires_at);
  if (row.revoked_at || !Number.isFinite(expiresAt) || expiresAt <= now) return null;
  const user = await loadAuthoritativeUser(row.user_id);
  if (!user) return null;

  const lastUsedAt = Date.parse(row.last_used_at);
  if (!Number.isFinite(lastUsedAt) || now - lastUsedAt >= TOUCH_AFTER_MS) {
    await admin.from('app_sessions').update({ last_used_at: new Date(now).toISOString() })
      .eq('id', row.id).is('revoked_at', null);
  }
  const lastRotatedAt = Date.parse(row.last_rotated_at);
  return {
    user,
    sessionId: row.id,
    rawToken,
    expiresAt,
    kind: 'stored',
    needsRotation: !Number.isFinite(lastRotatedAt) || now - lastRotatedAt >= ROTATION_AFTER_MS,
  };
}

async function resolveLegacySession(rawToken: string): Promise<AuthSession | null> {
  const legacy = parseLegacySessionToken(rawToken);
  if (!legacy) return null;
  const admin = getSupabaseAdmin();
  if (!admin) {
    return process.env.NODE_ENV === 'production'
      ? null
      : { user: legacy.user, sessionId: null, rawToken, expiresAt: legacy.expiresAt, kind: 'legacy', needsRotation: true };
  }

  const { data, error } = await admin.from('user_security_state')
    .select('sessions_valid_after, legacy_sessions_accepted_until')
    .eq('user_id', legacy.user.id).maybeSingle();
  if (error) {
    if (isMissingSecurityMigration(error)) {
      return { user: legacy.user, sessionId: null, rawToken, expiresAt: legacy.expiresAt, kind: 'legacy', needsRotation: true };
    }
    return null;
  }
  if (!data) return null;

  const validAfter = Date.parse(String(data.sessions_valid_after));
  const acceptedUntil = Date.parse(String(data.legacy_sessions_accepted_until));
  if (
    (Number.isFinite(validAfter) && legacy.issuedAt < validAfter) ||
    !Number.isFinite(acceptedUntil) ||
    Date.now() > acceptedUntil
  ) return null;

  const user = await loadAuthoritativeUser(legacy.user.id);
  if (!user) return null;
  return { user, sessionId: null, rawToken, expiresAt: legacy.expiresAt, kind: 'legacy', needsRotation: true };
}

export async function resolveAuthSession(rawToken: string | undefined | null): Promise<AuthSession | null> {
  if (!rawToken) return null;
  return isStoredSessionToken(rawToken) ? resolveStoredSession(rawToken) : resolveLegacySession(rawToken);
}

export async function rotateStoredSession(session: AuthSession) {
  if (session.kind !== 'stored' || !session.sessionId) return null;
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const rawToken = createOpaqueSessionToken();
  const { data, error } = await admin.from('app_sessions')
    .update({ token_hash: tokenHash(rawToken), last_rotated_at: new Date().toISOString() })
    .eq('id', session.sessionId).eq('token_hash', tokenHash(session.rawToken))
    .is('revoked_at', null).gt('expires_at', new Date().toISOString())
    .select('id').maybeSingle();
  return error || !data ? null : rawToken;
}

export async function upgradeLegacySession(session: AuthSession) {
  if (session.kind !== 'legacy') return null;
  const created = await insertStoredSession(session.user.id);
  return created.ok ? created.rawToken : null;
}

export async function revokeSessionToken(rawToken: string | undefined | null) {
  if (!rawToken) return;
  const admin = getSupabaseAdmin();
  if (!admin) return;
  if (isStoredSessionToken(rawToken)) {
    await admin.from('app_sessions').update({ revoked_at: new Date().toISOString() })
      .eq('token_hash', tokenHash(rawToken)).is('revoked_at', null);
    return;
  }
  const legacy = parseLegacySessionToken(rawToken);
  if (!legacy) return;
  await admin.from('user_security_state').upsert({
    user_id: legacy.user.id,
    legacy_sessions_accepted_until: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
}

export async function revokeAllUserSessions(userId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return false;
  const now = new Date().toISOString();
  const { error: sessionError } = await admin.from('app_sessions')
    .update({ revoked_at: now }).eq('user_id', userId).is('revoked_at', null);
  const { error: stateError } = await admin.from('user_security_state').upsert({
    user_id: userId,
    sessions_valid_after: now,
    legacy_sessions_accepted_until: now,
    updated_at: now,
  }, { onConflict: 'user_id' });
  return !sessionError && !stateError;
}

export async function listUserSessions(userId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  const { data, error } = await admin.from('app_sessions')
    .select('id, created_at, last_used_at, last_rotated_at, expires_at')
    .eq('user_id', userId).is('revoked_at', null).gt('expires_at', new Date().toISOString())
    .order('last_used_at', { ascending: false }).limit(50);
  return error ? [] : data ?? [];
}

export async function revokeUserSessionById(userId: string, sessionId: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return false;
  const { data, error } = await admin.from('app_sessions')
    .update({ revoked_at: new Date().toISOString() }).eq('id', sessionId).eq('user_id', userId)
    .is('revoked_at', null).select('id').maybeSingle();
  return !error && Boolean(data);
}

export const sessionTokenHashForTest = tokenHash;
