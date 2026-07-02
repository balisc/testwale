import { NextResponse } from 'next/server';
import { validateSignupForm } from '@/lib/signupValidation';
import { createEmailUser } from '@/lib/userRepository';
import { setAuthCookie, toSessionUser } from '@/lib/authCookies';
import { SUPABASE_AVAILABLE } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateSignupForm({
      fullName: String(body?.fullName ?? ''),
      email: String(body?.email ?? ''),
      password: String(body?.password ?? ''),
      confirmPassword: String(body?.confirmPassword ?? ''),
      agreedToTerms: Boolean(body?.agreedToTerms),
    });

    if (!validation.ok) {
      return NextResponse.json(
        { success: false, field: validation.field, code: validation.code },
        { status: 400 },
      );
    }

    if (!SUPABASE_AVAILABLE) {
      return NextResponse.json(
        { success: false, code: 'saveError', message: 'Database is not configured.' },
        { status: 503 },
      );
    }

    const result = await createEmailUser({
      full_name: validation.data.fullName,
      email: validation.data.email,
      password: validation.data.password,
    });

    if (!result.ok) {
      if (result.reason === 'duplicate_email') {
        return NextResponse.json(
          { success: false, field: 'email', code: 'emailExists' },
          { status: 409 },
        );
      }

      if (result.reason === 'missing_setup') {
        return NextResponse.json(
          {
            success: false,
            code: 'saveError',
            message: 'Run scripts/create_users_table.sql and scripts/create_users_auth_functions.sql in Supabase.',
          },
          { status: 503 },
        );
      }

      if (result.reason === 'rls_error') {
        return NextResponse.json(
          {
            success: false,
            code: 'saveError',
            message: 'Users table permissions missing. Run scripts/create_users_table.sql again.',
          },
          { status: 503 },
        );
      }

      console.error('Signup insert error:', result.message);
      return NextResponse.json({ success: false, code: 'submitError' }, { status: 500 });
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
    console.error('Signup API error:', error);
    return NextResponse.json({ success: false, code: 'submitError' }, { status: 500 });
  }
}
