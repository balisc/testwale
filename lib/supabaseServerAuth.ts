import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

type SupabaseCookie = {
  name: string;
  value: string;
  options: Record<string, unknown>;
};

function getSupabaseConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim() || '')
    .replace(/\/?rest\/v1\/?$/i, '')
    .replace(/\/$/, '');
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    '';

  if (!url || !key) return null;
  return { url, key };
}

function setSupabaseCookie(
  target: NextResponse | null,
  pending: SupabaseCookie[] | null,
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  cookie: SupabaseCookie,
) {
  if (target) {
    target.cookies.set(
      cookie.name,
      cookie.value,
      cookie.options as Parameters<NextResponse['cookies']['set']>[2],
    );
    return;
  }

  if (pending) {
    pending.push(cookie);
    return;
  }

  try {
    cookieStore.set(cookie.name, cookie.value, cookie.options);
  } catch {
    /* read-only server context */
  }
}

/** Apply PKCE / transient Supabase cookies collected during OAuth start. */
export function applyPendingSupabaseCookies(
  response: NextResponse,
  pending: SupabaseCookie[],
): NextResponse {
  for (const cookie of pending) {
    response.cookies.set(
      cookie.name,
      cookie.value,
      cookie.options as Parameters<NextResponse['cookies']['set']>[2],
    );
  }
  return response;
}

/** Remove transient Supabase auth cookies on a redirect response. */
export function clearSupabaseAuthCookiesOnResponse(
  response: NextResponse,
  existing: { name: string }[],
): NextResponse {
  for (const cookie of existing) {
    if (!cookie.name.startsWith('sb-')) continue;
    response.cookies.set(cookie.name, '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }
  return response;
}

type SupabaseAuthClientOptions =
  | { response: NextResponse }
  | { pendingCookies: SupabaseCookie[] }
  | undefined;

/** Server-only Supabase client for PKCE OAuth start and code exchange in route handlers. */
export async function createSupabaseAuthExchangeClient(options?: SupabaseAuthClientOptions) {
  const config = getSupabaseConfig();
  if (!config) return null;

  const cookieStore = await cookies();
  const responseTarget = options && 'response' in options ? options.response : null;
  const pendingTarget = options && 'pendingCookies' in options ? options.pendingCookies : null;

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: SupabaseCookie[]) {
        for (const cookie of cookiesToSet) {
          setSupabaseCookie(responseTarget, pendingTarget, cookieStore, cookie);
        }
      },
    },
  });
}

/** Remove transient Supabase auth cookies after exchanging into the app session cookie. */
export async function clearSupabaseAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith('sb-')) {
      cookieStore.set(cookie.name, '', {
        path: '/',
        maxAge: 0,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }
  }
}
