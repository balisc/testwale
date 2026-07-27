import { getSafeRedirectPath } from './safeRedirect';

/** OAuth query keys that must never remain on non-callback pages. */
const OAUTH_PARAM_KEYS = new Set(['code', 'error', 'error_code', 'error_description']);

/**
 * True when an OAuth callback belongs on /auth/callback but landed elsewhere
 * (e.g. Supabase Site URL fallback to /?code=...).
 */
export function pathnameHasStrayOAuthParams(pathname: string, params: URLSearchParams): boolean {
  if (pathname === '/auth/callback') return false;
  return params.has('code') || params.has('error');
}

/**
 * Build a server/client redirect target that forwards OAuth params to /auth/callback.
 * Never logs or persists the authorization code.
 */
export function buildOAuthCallbackForwardUrl(
  origin: string,
  pathname: string,
  params: URLSearchParams,
): string {
  const url = new URL('/auth/callback', origin);

  const code = params.get('code');
  if (code) url.searchParams.set('code', code);

  const oauthError = params.get('error');
  if (oauthError) url.searchParams.set('error', oauthError);

  const explicitNext = params.get('next');
  if (explicitNext) {
    url.searchParams.set('next', getSafeRedirectPath(explicitNext, '/'));
  } else if (pathname !== '/' && pathname !== '/auth/callback') {
    const returnParams = new URLSearchParams();
    for (const [key, value] of params.entries()) {
      if (OAUTH_PARAM_KEYS.has(key)) continue;
      returnParams.append(key, value);
    }
    const query = returnParams.toString();
    const returnPath = query ? `${pathname}?${query}` : pathname;
    url.searchParams.set('next', getSafeRedirectPath(returnPath, '/'));
  } else {
    url.searchParams.set('next', '/');
  }

  return url.toString();
}
