import { NextResponse } from 'next/server';
import { verifyGoogleCredential } from '@/lib/googleAuth';
import { upsertGoogleUser } from '@/lib/userRepository';
import { setAuthCookie, toSessionUser } from '@/lib/authCookies';
import { SUPABASE_AVAILABLE } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const credential = String(body?.credential ?? '');

    if (!credential) {
      return NextResponse.json({ success: false, code: 'invalidToken' }, { status: 400 });
    }

    const verified = await verifyGoogleCredential(credential);
    if (!verified.ok) {
      if (verified.reason === 'missing_client_id') {
        return NextResponse.json(
          {
            success: false,
            code: 'googleConfig',
            message: 'Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local and restart the dev server.',
          },
          { status: 503 },
        );
      }

      console.error('Google token verification failed:', verified.reason);
      return NextResponse.json({ success: false, code: 'googleError' }, { status: 401 });
    }

    if (!SUPABASE_AVAILABLE) {
      return NextResponse.json({ success: false, code: 'saveError' }, { status: 503 });
    }

    const saveResult = await upsertGoogleUser({
      full_name: verified.profile.fullName,
      email: verified.profile.email,
      google_id: verified.profile.googleId,
      avatar_url: verified.profile.avatarUrl,
    });

    if (!saveResult.ok) {
      if (saveResult.reason === 'use_password') {
        return NextResponse.json(
          {
            success: false,
            code: 'usePassword',
            message: 'This email already has a password account. Log in with email instead.',
          },
          { status: 409 },
        );
      }

      if (saveResult.reason === 'missing_setup') {
        return NextResponse.json(
          {
            success: false,
            code: 'saveError',
            message: 'Run scripts/create_users_auth_functions.sql in Supabase SQL Editor.',
          },
          { status: 503 },
        );
      }

      console.error('Google user save error:', saveResult);
      return NextResponse.json({ success: false, code: 'saveError' }, { status: 500 });
    }

    await setAuthCookie(toSessionUser(saveResult.user));

    return NextResponse.json({
      success: true,
      user: {
        id: saveResult.user.id,
        fullName: saveResult.user.full_name,
        email: saveResult.user.email,
        provider: saveResult.user.provider,
        avatarUrl: saveResult.user.avatar_url,
      },
    });
  } catch (error) {
    console.error('Google auth API error:', error);
    return NextResponse.json({ success: false, code: 'submitError' }, { status: 500 });
  }
}
