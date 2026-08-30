import { createHash, randomBytes } from 'crypto';
import { getPublicOrigin } from '@/lib/publicOrigin';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const TOKEN_BYTES = 32;
const RECOVERY_TTL_MS = 30 * 60 * 1000;
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

type DeliveryKind = 'password-recovery' | 'email-verification';

type EmailUser = {
  id: string;
  email: string;
  provider: string;
  email_verified_at: string | null;
};

function normalizeEmail(raw: string) {
  const email = raw.trim().toLowerCase();
  return EMAIL_REGEX.test(email) && email.length <= 254 ? email : null;
}

export function validateNewPassword(password: string) {
  return password.length >= 8 && password.length <= 128 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

export function hashAccountToken(rawToken: string) {
  return createHash('sha256').update(rawToken).digest('hex');
}

export function isEmailDeliveryConfigured() {
  const rawUrl = process.env.AUTH_EMAIL_DELIVERY_URL?.trim();
  const bearer = process.env.AUTH_EMAIL_DELIVERY_BEARER_TOKEN?.trim();
  if (!rawUrl || !bearer) return false;
  try {
    const url = new URL(rawUrl);
    return url.protocol === 'https:' && !url.username && !url.password && !url.hash;
  } catch {
    return false;
  }
}

export function isEmailVerificationRequired() {
  return process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
}

async function findEmailUser(email: string): Promise<EmailUser | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin.from('users')
    .select('id, email, provider, email_verified_at')
    .eq('email', email).maybeSingle();
  if (error || !data) return null;
  return {
    id: String(data.id),
    email: String(data.email),
    provider: String(data.provider),
    email_verified_at: typeof data.email_verified_at === 'string' ? data.email_verified_at : null,
  };
}

function createAccountToken() {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

async function deliverAccountEmail(
  kind: DeliveryKind,
  email: string,
  rawToken: string,
  request?: Request,
) {
  if (!isEmailDeliveryConfigured()) return false;
  const endpoint = process.env.AUTH_EMAIL_DELIVERY_URL!.trim();
  const bearer = process.env.AUTH_EMAIL_DELIVERY_BEARER_TOKEN!.trim();
  const origin = getPublicOrigin(request);
  const path = kind === 'password-recovery' ? '/reset-password' : '/verify-email';
  // The token is placed in the URL fragment so it is not sent in HTTP access
  // logs or Referer headers when the recipient opens the page.
  const actionUrl = `${origin}${path}#token=${encodeURIComponent(rawToken)}`;
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearer}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ kind, to: email, actionUrl }),
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function issueAccountToken(
  kind: DeliveryKind,
  rawEmail: string,
  request?: Request,
) {
  const email = normalizeEmail(rawEmail);
  // Always return a generic outcome to the route. Whether a matching account
  // exists must not be observable through this endpoint.
  if (!email || !isEmailDeliveryConfigured()) return { accepted: true, delivered: false };
  const user = await findEmailUser(email);
  if (!user || user.provider !== 'email') return { accepted: true, delivered: false };
  if (kind === 'email-verification' && user.email_verified_at) {
    return { accepted: true, delivered: false };
  }

  const admin = getSupabaseAdmin();
  if (!admin) return { accepted: true, delivered: false };
  const rawToken = createAccountToken();
  const tokenHash = hashAccountToken(rawToken);
  const expiresAt = new Date(Date.now() + (
    kind === 'password-recovery' ? RECOVERY_TTL_MS : VERIFICATION_TTL_MS
  )).toISOString();
  const table = kind === 'password-recovery'
    ? 'password_recovery_tokens'
    : 'email_verification_tokens';
  const { error } = await admin.from(table).upsert({
    user_id: user.id,
    token_hash: tokenHash,
    created_at: new Date().toISOString(),
    expires_at: expiresAt,
    used_at: null,
  }, { onConflict: 'user_id' });
  if (error) return { accepted: true, delivered: false };

  const delivered = await deliverAccountEmail(kind, user.email, rawToken, request);
  if (!delivered) {
    // Never leave a live token behind when its delivery failed.
    await admin.from(table).delete().eq('user_id', user.id).eq('token_hash', tokenHash);
  }
  return { accepted: true, delivered };
}

export function issuePasswordRecovery(email: string, request?: Request) {
  return issueAccountToken('password-recovery', email, request);
}

export function issueEmailVerification(email: string, request?: Request) {
  return issueAccountToken('email-verification', email, request);
}

export async function consumePasswordRecovery(rawToken: string, newPassword: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(rawToken) || !validateNewPassword(newPassword)) return false;
  const admin = getSupabaseAdmin();
  if (!admin) return false;
  const { data, error } = await admin.rpc('consume_password_recovery_token', {
    p_token_hash: hashAccountToken(rawToken),
    p_new_password: newPassword,
  });
  return !error && typeof data === 'string' && data.length > 0;
}

export async function consumeEmailVerification(rawToken: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(rawToken)) return false;
  const admin = getSupabaseAdmin();
  if (!admin) return false;
  const { data, error } = await admin.rpc('consume_email_verification_token', {
    p_token_hash: hashAccountToken(rawToken),
  });
  return !error && typeof data === 'string' && data.length > 0;
}

export async function changeEmailUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  if (!currentPassword || !validateNewPassword(newPassword)) return false;
  const admin = getSupabaseAdmin();
  if (!admin) return false;
  const { data, error } = await admin.rpc('change_email_user_password', {
    p_user_id: userId,
    p_current_password: currentPassword,
    p_new_password: newPassword,
  });
  return !error && data === true;
}
