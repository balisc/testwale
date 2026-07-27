import { NextResponse } from 'next/server';
import { attachAuthFlashCookie } from '@/lib/authFlash';
import { authRedirectResponse } from '@/lib/authRedirectResponse';
import { buildOAuthCallbackForRequest } from '@/lib/oauthCallback';
import { PublicOriginConfigError } from '@/lib/publicOrigin';
import { getSafeRedirectPath } from '@/lib/safeRedirect';
import {
  applyPendingSupabaseCookies,
  createSupabaseAuthExchangeClient,
} from '@/lib/supabaseServerAuth';

export const dynamic = 'force-dynamic';

function redirectToLogin(request: Request, kind: 'oauth_failed' | 'oauth_config' = 'oauth_config') {
  const loginUrl = new URL('/login', request.url);
  const response = authRedirectResponse(loginUrl.toString());
  attachAuthFlashCookie(response, kind);
  return response;
}

/**
 * Server-side Google OAuth start — trusted callback origin never comes from the browser.
 * PKCE verifier is stored in HTTP-only cookies via @supabase/ssr.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = getSafeRedirectPath(requestUrl.searchParams.get('next'), '/dashboard');

  let redirectTo: string;
  try {
    redirectTo = buildOAuthCallbackForRequest(request, next);
  } catch (error) {
    if (error instanceof PublicOriginConfigError) {
      return redirectToLogin(request, 'oauth_config');
    }
    return redirectToLogin(request, 'oauth_failed');
  }

  const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];
  const supabase = await createSupabaseAuthExchangeClient({ pendingCookies });
  if (!supabase) {
    return redirectToLogin(request, 'oauth_config');
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        prompt: 'select_account',
      },
    },
  });

  if (error || !data?.url) {
    return redirectToLogin(request, 'oauth_failed');
  }

  const response = authRedirectResponse(data.url);
  applyPendingSupabaseCookies(response, pendingCookies);
  return response;
}
