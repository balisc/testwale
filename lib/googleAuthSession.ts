import { NextResponse } from 'next/server';
import { verifyGoogleCredential } from '@/lib/googleAuth';
import { upsertGoogleUser } from '@/lib/userRepository';
import { setAuthCookie, toSessionUser } from '@/lib/authCookies';
import { getSafeRedirectPath } from '@/lib/safeRedirect';
import { SUPABASE_AVAILABLE } from '@/lib/supabase';

export async function authenticateGoogleCredential(credential: string) {
  if (!credential) {
    return { ok: false as const, code: 'invalidToken', status: 400, message: 'Missing Google credential.' };
  }

  const verified = await verifyGoogleCredential(credential);
  if (!verified.ok) {
    if (verified.reason === 'missing_client_id') {
      return {
        ok: false as const,
        code: 'googleConfig',
        status: 503,
        message:
          'Add NEXT_PUBLIC_GOOGLE_CLIENT_ID, GOOGLE_CLIENT_ID, or GOOGLE_CLIENT_ID_AUTH in Vercel and redeploy.',
      };
    }

    return { ok: false as const, code: 'googleError', status: 401, message: 'Google sign-in failed.' };
  }

  if (!SUPABASE_AVAILABLE) {
    return { ok: false as const, code: 'saveError', status: 503, message: 'Database is not configured.' };
  }

  const saveResult = await upsertGoogleUser({
    full_name: verified.profile.fullName,
    email: verified.profile.email,
    google_id: verified.profile.googleId,
    avatar_url: verified.profile.avatarUrl,
  });

  if (!saveResult.ok) {
    if (saveResult.reason === 'use_password') {
      return {
        ok: false as const,
        code: 'usePassword',
        status: 409,
        message: 'This email already has a password account. Log in with email instead.',
      };
    }

    if (saveResult.reason === 'missing_setup') {
      return {
        ok: false as const,
        code: 'saveError',
        status: 503,
        message: 'Run scripts/create_users_auth_functions.sql in Supabase SQL Editor.',
      };
    }

    return { ok: false as const, code: 'saveError', status: 500, message: 'Could not save your account.' };
  }

  await setAuthCookie(toSessionUser(saveResult.user));

  return {
    ok: true as const,
    user: {
      id: saveResult.user.id,
      fullName: saveResult.user.full_name,
      email: saveResult.user.email,
      provider: saveResult.user.provider,
      avatarUrl: saveResult.user.avatar_url,
    },
  };
}

export async function redirectAfterGoogleAuth(request: Request, credential: string, redirectTo?: string | null) {
  const origin = new URL(request.url).origin;
  const destination = getSafeRedirectPath(redirectTo, '/subjects');
  const result = await authenticateGoogleCredential(credential);

  if (!result.ok) {
    const params = new URLSearchParams({ error: result.code });
    if (result.message) params.set('message', result.message);
    return NextResponse.redirect(`${origin}/login?${params.toString()}`);
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
