import { NextResponse } from 'next/server';
import { loginEmailUser } from '@/lib/userRepository';
import { setAuthCookie, toSessionUser } from '@/lib/authCookies';
import { SUPABASE_AVAILABLE } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? '').trim().toLowerCase();
    const password = String(body?.password ?? '');

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ success: false, code: 'invalidEmail' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ success: false, code: 'invalidPassword' }, { status: 400 });
    }

    if (!SUPABASE_AVAILABLE) {
      return NextResponse.json({ success: false, code: 'saveError' }, { status: 503 });
    }

    const result = await loginEmailUser({ email, password });

    if (!result.ok) {
      if (result.reason === 'missing_setup') {
        return NextResponse.json(
          {
            success: false,
            code: 'saveError',
            message: 'Run scripts/create_users_auth_functions.sql in Supabase SQL Editor.',
          },
          { status: 503 },
        );
      }

      return NextResponse.json({ success: false, code: 'invalidCredentials' }, { status: 401 });
    }

    await setAuthCookie(toSessionUser(result.user));

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        fullName: result.user.full_name,
        email: result.user.email,
        provider: result.user.provider,
      },
    });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ success: false, code: 'submitError' }, { status: 500 });
  }
}
