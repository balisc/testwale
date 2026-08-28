type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
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
  const forwarded = headers.get('x-forwarded-for');
  const candidate = forwarded?.split(',')[0]?.trim() || headers.get('x-real-ip')?.trim() || '';
  // Do not let arbitrary header text become an unbounded Map key. Vercel and
  // conventional trusted proxies provide plain IPv4/IPv6 values here.
  return candidate && candidate.length <= 64 && /^[0-9a-f:.]+$/i.test(candidate)
    ? candidate
    : 'unknown';
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
    return { limit: 10, windowMs: 10 * 60_000 };
  }
  if (pathname.startsWith('/api/auth/google')) {
    return { limit: 20, windowMs: 5 * 60_000 };
  }
  if (pathname === '/api/contact') {
    return { limit: 5, windowMs: 10 * 60_000 };
  }
  if (pathname === '/api/practice/report') {
    return { limit: 10, windowMs: 10 * 60_000 };
  }
  if (
    pathname === '/api/practice/submit' ||
    pathname === '/api/map-practice/submit' ||
    pathname === '/api/legacy-practice/submit'
  ) {
    return { limit: 60, windowMs: 60_000 };
  }
  return { limit: DEFAULT_LIMIT, windowMs: DEFAULT_WINDOW_MS };
}
