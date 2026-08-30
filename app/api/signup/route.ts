import { NextResponse } from 'next/server';
import { validateSignupForm } from '@/lib/signupValidation';
import { createEmailUser } from '@/lib/userRepository';
import { setAuthCookie, toSessionUser } from '@/lib/authCookies';
import { SUPABASE_AVAILABLE } from '@/lib/supabase';
import {
  isEmailDeliveryConfigured,
  isEmailVerificationRequired,
  issueEmailVerification,
} from '@/lib/accountSecurity';

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
        { success: false, code: 'serviceUnavailable' },
        { status: 503 },
      );
    }

    if (isEmailVerificationRequired() && !isEmailDeliveryConfigured()) {
      return NextResponse.json(
        { success: false, code: 'serviceUnavailable' },
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
        // A uniform accepted response avoids confirming that the email exists.
        // If verification is enforced, the normal verification flow may send a
        // message to the owner without revealing that fact to the caller.
        if (isEmailVerificationRequired()) {
          await issueEmailVerification(validation.data.email, request);
        }
        return NextResponse.json(
          { success: true, pending: true },
          { status: 202, headers: { 'Cache-Control': 'private, no-store' } },
        );
      }

      if (result.reason === 'missing_setup') {
        return NextResponse.json(
          { success: false, code: 'serviceUnavailable' },
          { status: 503 },
        );
      }

      if (result.reason === 'rls_error') {
        return NextResponse.json(
          { success: false, code: 'serviceUnavailable' },
          { status: 503 },
        );
      }

      console.error('Signup insert failed:', result.reason);
      return NextResponse.json({ success: false, code: 'submitError' }, { status: 500 });
    }

    if (isEmailVerificationRequired()) {
      await issueEmailVerification(result.user.email, request);
      return NextResponse.json(
        { success: true, verificationRequired: true },
        { status: 202, headers: { 'Cache-Control': 'private, no-store' } },
      );
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
