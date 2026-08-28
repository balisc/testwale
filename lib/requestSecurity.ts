const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const MAX_API_MUTATION_BYTES = 64 * 1024;

type MutationRequestCheck =
  | { ok: true }
  | { ok: false; status: 403 | 413; error: 'cross_origin_request' | 'payload_too_large' };

function normalizeOrigin(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function expectedOrigins(request: Request): Set<string> {
  const origins = new Set<string>();
  const configured = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? null);
  const vercelEnvironment = process.env.VERCEL_ENV?.trim();
  const vercelUrl = process.env.VERCEL_URL?.trim();

  if (vercelEnvironment === 'preview' && vercelUrl) {
    const preview = normalizeOrigin(`https://${vercelUrl.replace(/^https?:\/\//i, '')}`);
    if (preview) origins.add(preview);
    return origins;
  }

  try {
    const requestUrl = new URL(request.url);
    const isLoopback = requestUrl.hostname === 'localhost' || requestUrl.hostname === '127.0.0.1';
    if (process.env.NODE_ENV !== 'production' || (isLoopback && vercelEnvironment !== 'production')) {
      origins.add(requestUrl.origin);
    }
  } catch {
    // The configured canonical origin remains the fail-closed fallback.
  }

  if (configured) origins.add(configured);
  return origins;
}

/**
 * Enforces the browser same-origin boundary for unsafe API methods.
 * Non-browser administrative requests authenticate separately and are exempted
 * by the caller before reaching this check.
 */
export function checkMutationRequest(request: Request): MutationRequestCheck {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return { ok: true };

  const contentLength = request.headers.get('content-length');
  if (contentLength && /^\d+$/.test(contentLength)) {
    const bytes = Number.parseInt(contentLength, 10);
    if (bytes > MAX_API_MUTATION_BYTES) {
      return { ok: false, status: 413, error: 'payload_too_large' };
    }
  }

  const expected = expectedOrigins(request);
  if (expected.size === 0) {
    return { ok: false, status: 403, error: 'cross_origin_request' };
  }

  const origin = normalizeOrigin(request.headers.get('origin'));
  if (origin) {
    return expected.has(origin)
      ? { ok: true }
      : { ok: false, status: 403, error: 'cross_origin_request' };
  }

  const referer = normalizeOrigin(request.headers.get('referer'));
  if (referer) {
    return expected.has(referer)
      ? { ok: true }
      : { ok: false, status: 403, error: 'cross_origin_request' };
  }

  // Modern same-origin browser requests include Sec-Fetch-Site even when a
  // privacy policy removes Referer. Do not accept "same-site": a compromised
  // sibling subdomain must not be able to mutate cookie-authenticated state.
  return request.headers.get('sec-fetch-site') === 'same-origin'
    ? { ok: true }
    : { ok: false, status: 403, error: 'cross_origin_request' };
}
