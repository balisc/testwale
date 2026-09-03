import { isIP } from 'node:net';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type RateLimitOptions = {
  limit?: number;
  windowMs?: number;
};

const DEFAULT_LIMIT = 120;
const DEFAULT_WINDOW_MS = 60_000;
const MAX_BUCKETS = 10_000;

const buckets = new Map<string, RateLimitEntry>();

function pruneExpiredEntries(now: number) {
  for (const [key, entry] of buckets.entries()) {
    if (now > entry.resetAt) {
      buckets.delete(key);
    }
  }
}

function boundedBucketKey(key: string, limit: number, windowMs: number, now: number) {
  if (buckets.has(key) || buckets.size < MAX_BUCKETS) return key;

  pruneExpiredEntries(now);
  if (buckets.size < MAX_BUCKETS) return key;

  // A shared overflow bucket keeps attacker-controlled identifiers from growing
  // process memory without evicting legitimate clients' active limits.
  return `__overflow__:${limit}:${windowMs}`;
}

export function getClientIp(headers: Headers): string {
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
  const forwarded = isVercel
    ? headers.get('x-vercel-forwarded-for') || headers.get('x-forwarded-for')
    : headers.get('x-forwarded-for') || headers.get('x-real-ip');
  let candidate = forwarded?.split(',')[0]?.trim().toLowerCase() || '';
  if (candidate.startsWith('[') && candidate.endsWith(']')) candidate = candidate.slice(1, -1);
  const zoneIndex = candidate.indexOf('%');
  if (zoneIndex > 0) candidate = candidate.slice(0, zoneIndex);
  // Vercel overwrites its forwarding headers. Outside a configured trusted
  // proxy, this value is abuse telemetry only and never an authorization input.
  return candidate.length <= 64 && isIP(candidate) !== 0 ? candidate : 'unknown';
}

export function checkRateLimit(key: string, options: RateLimitOptions = {}) {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const now = Date.now();

  if (buckets.size >= MAX_BUCKETS) pruneExpiredEntries(now);

  const bucketKey = boundedBucketKey(key, limit, windowMs, now);

  const current = buckets.get(bucketKey);
  if (!current || now > current.resetAt) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
    };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
    };
  }

  current.count += 1;
  return {
    allowed: true,
    remaining: limit - current.count,
    resetAt: current.resetAt,
  };
}

export function getApiRateLimitKey(ip: string, pathname: string) {
  return `${ip}:${pathname}`;
}

export function getApiRateLimitPolicy(pathname: string): Required<RateLimitOptions> {
  if (pathname === '/api/auth/login' || pathname === '/api/signup') {
    return { limit: 8, windowMs: 10 * 60_000 };
  }
  if (pathname.startsWith('/api/auth/google')) {
    return { limit: 20, windowMs: 5 * 60_000 };
  }
  if (pathname === '/api/contact') {
    return { limit: 5, windowMs: 10 * 60_000 };
  }
  if (
    pathname === '/api/auth/recovery/request' ||
    pathname === '/api/auth/email-verification/request'
  ) {
    return { limit: 5, windowMs: 15 * 60_000 };
  }
  if (
    pathname === '/api/auth/recovery/confirm' ||
    pathname === '/api/auth/email-verification/confirm' ||
    pathname === '/api/auth/password/change' ||
    pathname.startsWith('/api/auth/sessions')
  ) {
    return { limit: 10, windowMs: 15 * 60_000 };
  }
  if (pathname === '/api/practice/report') {
    return { limit: 10, windowMs: 10 * 60_000 };
  }
  if (pathname === '/api/mock-tests/generate') {
    return { limit: 3, windowMs: 60_000 };
  }
  if (pathname.startsWith('/api/mock-tests/') && pathname.endsWith('/responses')) {
    return { limit: 180, windowMs: 60_000 };
  }
  if (pathname.startsWith('/api/mock-tests/')) {
    return { limit: 60, windowMs: 60_000 };
  }
  if (
    pathname === '/api/practice/submit' ||
    pathname === '/api/map-practice/submit' ||
    pathname === '/api/legacy-practice/submit'
  ) {
    return { limit: 60, windowMs: 60_000 };
  }
  if (pathname.startsWith('/api/practice/')) {
    return { limit: 120, windowMs: 60_000 };
  }
  return { limit: DEFAULT_LIMIT, windowMs: DEFAULT_WINDOW_MS };
}

export function normalizeRateLimitAccount(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized.length < 3 || normalized.length > 254 || !normalized.includes('@')) return null;
  return normalized;
}

export function routeRateLimitGroup(pathname: string) {
  if (pathname === '/api/auth/login') return 'auth-login';
  if (pathname === '/api/signup') return 'auth-signup';
  if (pathname === '/api/auth/recovery/request') return 'auth-recovery';
  if (pathname === '/api/auth/email-verification/request') return 'auth-email-verification';
  if (pathname.startsWith('/api/auth/google')) return 'auth-google';
  if (pathname === '/api/contact') return 'contact';
  if (pathname === '/api/practice/report') return 'practice-report';
  if (pathname === '/api/mock-tests/generate') return 'mock-generate';
  if (pathname.startsWith('/api/mock-tests/')) return 'mock-test';
  if (pathname.includes('/submit')) return 'answer-submit';
  if (pathname.startsWith('/api/practice/')) return 'practice-mutation';
  return pathname.slice(0, 120);
}
