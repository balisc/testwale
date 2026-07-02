import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { upsertGoogleUser } from '@/lib/userRepository';
import { setAuthCookie, toSessionUser } from '@/lib/authCookies';

export const dynamic = 'force-dynamic';

function getSupabaseAuthClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '')
    .trim()
    .replace(/\/?rest\/v1\/?$/i, '')
    .replace(/\/$/, '');
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.SUPABASE_KEY
  )?.trim();

  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  const errorParam = requestUrl.searchParams.get('error_description') ?? requestUrl.searchParams.get('error');

  if (errorParam || !code) {
    return NextResponse.redirect(`${origin}/signup?error=google`);
  }

  const supabase = getSupabaseAuthClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/signup?error=config`);
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    console.error('Google auth callback error:', error?.message);
    return NextResponse.redirect(`${origin}/signup?error=google`);
  }

  const user = data.user;
  const email = user.email!.toLowerCase();
  const metadata = user.user_metadata ?? {};
  const fullName =
    String(metadata.full_name ?? metadata.name ?? metadata.fullName ?? email.split('@')[0] ?? 'User').trim();

  const saveResult = await upsertGoogleUser({
    full_name: fullName,
    email,
    google_id: String(metadata.sub ?? user.id),
    avatar_url: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null,
  });

  if (!saveResult.ok) {
    console.error('Google user save error:', saveResult);
    return NextResponse.redirect(`${origin}/signup?error=save`);
  }

  await setAuthCookie(toSessionUser(saveResult.user));
  return NextResponse.redirect(`${origin}/subjects`);
}
