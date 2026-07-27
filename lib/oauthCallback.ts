import { getSafeRedirectPath } from './safeRedirect';
import { getTrustedPublicOrigin, isLocalhostOrigin, validateTrustedOrigin } from './publicOrigin';

/** Build the Supabase OAuth redirectTo URL using a server-validated origin. */
export function buildOAuthCallbackUrl(trustedOrigin: string, nextPath?: string | null): string {
  const validatedOrigin = validateTrustedOrigin(trustedOrigin, {
    allowLocalhost: isLocalhostOrigin(trustedOrigin),
    requireHttps: !isLocalhostOrigin(trustedOrigin),
  });

  if (!validatedOrigin) {
    throw new Error('Invalid trusted origin for OAuth callback.');
  }

  const next = getSafeRedirectPath(nextPath, '/dashboard');
  const url = new URL('/auth/callback', validatedOrigin);
  url.searchParams.set('next', next);
  return url.toString();
}

/** Resolve trusted origin and callback URL in one step (server routes). */
export function buildOAuthCallbackForRequest(request: Request, nextPath?: string | null): string {
  const origin = getTrustedPublicOrigin(request);
  return buildOAuthCallbackUrl(origin, nextPath);
}
