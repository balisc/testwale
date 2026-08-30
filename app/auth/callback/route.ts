import { upsertGoogleUser } from '@/lib/userRepository';
import { attachAuthCookie, toSessionUser } from '@/lib/authCookies';
import { attachAuthFlashCookie, type AuthFlashKind } from '@/lib/authFlash';
import { authRedirectResponse } from '@/lib/authRedirectResponse';
import { getPublicOrigin } from '@/lib/publicOrigin';
import { getSafeRedirectPath } from '@/lib/safeRedirect';
import {
  clearSupabaseAuthCookies,
  clearSupabaseAuthCookiesOnResponse,
  createSupabaseAuthExchangeClient,
} from '@/lib/supabaseServerAuth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

function redirectWithFlash(origin: string, kind: AuthFlashKind, path: '/login' | '/signup' = '/login') {
  const response = authRedirectResponse(`${origin}${path}`);
  attachAuthFlashCookie(response, kind);
  return response;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = getPublicOrigin(request);
  const code = requestUrl.searchParams.get('code');
  const oauthError = requestUrl.searchParams.get('error');

  if (oauthError) {
    return redirectWithFlash(origin, 'oauth_failed');
  }

  if (!code) {
    return redirectWithFlash(origin, 'oauth_failed');
  }

  const next = getSafeRedirectPath(requestUrl.searchParams.get('next'), '/');
  const response = authRedirectResponse(`${origin}${next}`);
  const cookieStore = await cookies();

  const supabase = await createSupabaseAuthExchangeClient({ response });
  if (!supabase) {
    return redirectWithFlash(origin, 'oauth_config');
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    await clearSupabaseAuthCookies();
    clearSupabaseAuthCookiesOnResponse(response, cookieStore.getAll());
    return redirectWithFlash(origin, 'oauth_failed');
  }

  const user = data.user;
  const email = user.email!.toLowerCase();
  const metadata = user.user_metadata ?? {};
  const fullName = String(
    metadata.full_name ?? metadata.name ?? metadata.fullName ?? email.split('@')[0] ?? 'User',
  ).trim();

  const saveResult = await upsertGoogleUser({
    full_name: fullName,
    email,
    google_id: String(metadata.sub ?? user.id),
    avatar_url: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null,
  });

  if (!saveResult.ok) {
    await clearSupabaseAuthCookies();
    clearSupabaseAuthCookiesOnResponse(response, cookieStore.getAll());
    return redirectWithFlash(origin, 'oauth_save');
  }

  await clearSupabaseAuthCookies();
  clearSupabaseAuthCookiesOnResponse(response, cookieStore.getAll());
  await attachAuthCookie(response, toSessionUser(saveResult.user));
  return response;
}
