import { NextResponse } from 'next/server';
import { redirectAfterGoogleAuth } from '@/lib/googleAuthSession';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get('next');
    const formData = await request.formData();
    const credential = String(formData.get('credential') ?? '');

    return redirectAfterGoogleAuth(request, credential, redirectTo);
  } catch (error) {
    console.error('Google redirect auth error:', error);
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/login?error=google`);
  }
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/login`);
}
