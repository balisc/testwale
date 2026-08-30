import { createHash, createHmac } from 'crypto';
import { checkRateLimit, type RateLimitOptions } from '@/lib/rateLimit';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
  backend: 'supabase' | 'local-fallback' | 'backend-deny';
};

function getKeySecret() {
  return process.env.RATE_LIMIT_KEY_SECRET?.trim() || process.env.AUTH_SECRET?.trim() || '';
}

export function createRateLimitDigest(subject: string, secret = getKeySecret()) {
  if (!secret) return null;
  return createHmac('sha256', secret).update(subject).digest('hex');
}

function isMissingRateLimitMigration(error: unknown) {
  const record = error as { code?: string; message?: string } | null;
  const code = String(record?.code ?? '');
  const message = String(record?.message ?? '');
  return code === '42883' || code === 'PGRST202' || (
    /check_security_rate_limit/i.test(message) && /does not exist|schema cache|not find/i.test(message)
  );
}

function localFallback(digest: string, policy: Required<RateLimitOptions>): RateLimitResult {
  const local = checkRateLimit(`distributed-fallback:${digest}`, policy);
  return {
    ...local,
    retryAfterSeconds: local.allowed
      ? 0
      : Math.max(1, Math.ceil((local.resetAt - Date.now()) / 1000)),
    backend: 'local-fallback',
  };
}

export async function checkDistributedRateLimit(
  subject: string,
  policy: Required<RateLimitOptions>,
): Promise<RateLimitResult> {
  const digest = createRateLimitDigest(subject);
  if (!digest) {
    return process.env.NODE_ENV === 'production'
      ? { allowed: false, remaining: 0, resetAt: Date.now() + 60_000, retryAfterSeconds: 60, backend: 'backend-deny' }
      : localFallback(createHash('sha256').update(subject).digest('hex'), policy);
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return process.env.NODE_ENV === 'production'
      ? { allowed: false, remaining: 0, resetAt: Date.now() + 60_000, retryAfterSeconds: 60, backend: 'backend-deny' }
      : localFallback(digest, policy);
  }

  const { data, error } = await admin.rpc('check_security_rate_limit', {
    p_key_hash: digest,
    p_limit: policy.limit,
    p_window_seconds: Math.max(1, Math.ceil(policy.windowMs / 1000)),
  });
  const row = Array.isArray(data) ? data[0] : data;
  if (!error && row && typeof row === 'object') {
    const result = row as Record<string, unknown>;
    const resetAt = Date.parse(String(result.reset_at ?? ''));
    const retryAfterSeconds = Math.max(0, Number(result.retry_after_seconds ?? 0));
    return {
      allowed: result.allowed === true,
      remaining: Math.max(0, Number(result.remaining ?? 0)),
      resetAt: Number.isFinite(resetAt) ? resetAt : Date.now() + retryAfterSeconds * 1000,
      retryAfterSeconds,
      backend: 'supabase',
    };
  }

  // Code must deploy before its migration. A bounded local limiter protects
  // that short window. Operators can require hard failure after migration.
  if (isMissingRateLimitMigration(error) || process.env.DISTRIBUTED_RATE_LIMIT_REQUIRED !== 'true') {
    return localFallback(digest, policy);
  }
  return {
    allowed: false,
    remaining: 0,
    resetAt: Date.now() + 60_000,
    retryAfterSeconds: 60,
    backend: 'backend-deny',
  };
}
