/**
 * Authoritative trusted public origin for OAuth callbacks and post-auth redirects.
 * Never derives production origin from Host, Origin, Referer or forwarded headers.
 */

const LOCALHOST_ORIGIN_PATTERN =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

const DEFAULT_LOCAL_ORIGIN = 'http://localhost:3000';

export class PublicOriginConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublicOriginConfigError';
  }
}

export function isLocalhostOrigin(origin: string): boolean {
  return LOCALHOST_ORIGIN_PATTERN.test(origin);
}

/** Validate a configured site origin string (no path/query/hash/credentials). */
export function validateTrustedOrigin(
  raw: string | null | undefined,
  options: { allowLocalhost: boolean; requireHttps: boolean },
): string | null {
  if (!raw || typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.username || url.password) return null;
  if (url.search || url.hash) return null;
  if (url.pathname && url.pathname !== '/') return null;

  const origin = url.origin;

  if (isLocalhostOrigin(origin)) {
    return options.allowLocalhost ? origin : null;
  }

  if (options.requireHttps && url.protocol !== 'https:') {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return null;
  }

  return origin;
}

function readConfiguredSiteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim();
}

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production';
}

function isPreviewDeployment(): boolean {
  return process.env.VERCEL_ENV === 'preview' || process.env.VERCEL_ENV === 'development';
}

/**
 * Server-only trusted origin for OAuth callback construction.
 * Production/preview: configured HTTPS origin only — never localhost, never request headers.
 * Local dev: localhost request origin or validated local configured URL.
 */
export function getTrustedPublicOrigin(request?: Request): string {
  const configured = readConfiguredSiteOrigin();

  if (isProductionRuntime() || isPreviewDeployment()) {
    const validated = validateTrustedOrigin(configured, {
      allowLocalhost: false,
      requireHttps: true,
    });

    if (!validated) {
      throw new PublicOriginConfigError(
        'NEXT_PUBLIC_SITE_URL must be a valid HTTPS production origin (e.g. https://questionwale.com).',
      );
    }

    return validated;
  }

  if (request) {
    try {
      const requestOrigin = new URL(request.url).origin;
      const localFromRequest = validateTrustedOrigin(requestOrigin, {
        allowLocalhost: true,
        requireHttps: false,
      });
      if (localFromRequest && isLocalhostOrigin(localFromRequest)) {
        return localFromRequest;
      }
    } catch {
      // ignore malformed request URL
    }
  }

  const localConfigured = validateTrustedOrigin(configured, {
    allowLocalhost: true,
    requireHttps: false,
  });
  if (localConfigured) return localConfigured;

  return DEFAULT_LOCAL_ORIGIN;
}

/** Backward-compatible alias used by callback routes and auth redirects. */
export function getPublicOrigin(request?: Request): string {
  return getTrustedPublicOrigin(request);
}
