import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_PRIVATE_HEADERS } from '@/lib/authRedirectResponse';
import { renderBrandedNotFoundHtml } from '@/lib/brandedNotFoundHtml';
import {
  buildOAuthCallbackForwardUrl,
  pathnameHasStrayOAuthParams,
} from '@/lib/oauthCodeRedirect';
import { checkRateLimit, getApiRateLimitKey, getClientIp } from '@/lib/rateLimit';
import { SUBJECT_KEYS } from '@/lib/subjects';
import { AUTH_COOKIE_NAME, parseSessionToken } from '@/lib/appSession';
import { needsExamOnboarding } from '@/lib/examOnboarding';
import { getExamOnboardingDetails } from '@/lib/examOnboardingServer';
import { getSafeRedirectPath } from '@/lib/safeRedirect';

const API_RATE_LIMIT = 120;
const API_RATE_WINDOW_MS = 60_000;
const LEGACY_TOP_LEVEL = new Set(SUBJECT_KEYS.map((key) => key.toLowerCase()));

const PATH_CHECK_TTL_MS = 5 * 60_000;
const pathCheckCache = new Map<string, { ok: boolean; expiresAt: number }>();

function internalPathCheckToken(): string | null {
  return process.env.AUTH_SECRET?.trim() || null;
}

function notFoundResponse(): NextResponse {
  return new NextResponse(renderBrandedNotFoundHtml(), {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function isReservedTopLevelSegment(segment: string): boolean {
  const reserved = new Set([
    'subjects',
    'about_us',
    'contact',
    'privacy',
    'terms',
    'disclaimer',
    'refund-policy',
    'login',
    'signup',
    'dashboard',
    'profile',
    'onboarding',
    'auth',
    'api',
    'question',
    'demo',
    'map-practice',
    'pyq',
    'pcb_page',
    'loading-test',
    'classic',
    'examples',
    'sitemaps',
    'ssc-cgl',
    'robots.txt',
    'sitemap.xml',
    'manifest.webmanifest',
    'icon.webp',
    'llms.txt',
    '_next',
  ]);
  return reserved.has(segment);
}

async function maybeRejectUnknownCatalogPath(
  request: NextRequest,
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  const isCheckedPath =
    pathname.startsWith('/subjects/') ||
    pathname.startsWith('/exams/') ||
    pathname.startsWith('/question/');
  if (!isCheckedPath) return null;
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 2) return null;

  const stageCode = request.nextUrl.searchParams.get('stage')?.trim() || null;
  const cacheKey = stageCode ? `${pathname}?stage=${stageCode}` : pathname;
  const cached = pathCheckCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.ok ? null : notFoundResponse();
  }

  const checkUrl = new URL('/api/catalog/path-exists', request.nextUrl.origin);
  checkUrl.searchParams.set('path', pathname);
  if (stageCode) checkUrl.searchParams.set('stage', stageCode);
  const token = internalPathCheckToken();

  try {
    const res = await fetch(checkUrl.toString(), {
      method: 'GET',
      next: { revalidate: 300 },
      headers: token ? { 'x-questionwale-path-check': token } : undefined,
    });
    if (res.ok) {
      pathCheckCache.set(cacheKey, { ok: true, expiresAt: Date.now() + PATH_CHECK_TTL_MS });
      return null;
    }
    if (res.status === 404) {
      pathCheckCache.set(cacheKey, { ok: false, expiresAt: Date.now() + PATH_CHECK_TTL_MS });
      return notFoundResponse();
    }
  } catch {
    return null;
  }

  return null;
}

function maybeRejectUnknownTopLevel(pathname: string): NextResponse | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length !== 1) return null;
  const segment = segments[0]!.toLowerCase();
  if (LEGACY_TOP_LEVEL.has(segment) || isReservedTopLevelSegment(segment)) {
    return null;
  }
  return notFoundResponse();
}

function maybeForwardStrayOAuthCode(request: NextRequest): NextResponse | null {
  const { pathname, searchParams, origin } = request.nextUrl;
  if (!pathnameHasStrayOAuthParams(pathname, searchParams)) return null;

  const target = buildOAuthCallbackForwardUrl(origin, pathname, searchParams);
  return NextResponse.redirect(target, {
    status: 302,
    headers: AUTH_PRIVATE_HEADERS,
  });
}

async function maybeEnforceExamOnboarding(request: NextRequest): Promise<NextResponse | null> {
  const { pathname, search, searchParams, origin } = request.nextUrl;
  const isOnboarding = pathname === '/onboarding';
  const isProtected =
    pathname === '/dashboard' ||
    pathname === '/profile' ||
    pathname.startsWith('/profile/') ||
    pathname === '/subjects' ||
    pathname.startsWith('/subjects/');
  if (!isOnboarding && !isProtected) return null;

  const session = parseSessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  if (!session) {
    if (!isOnboarding) return null;
    const loginReturn = `/onboarding${search}`;
    return NextResponse.redirect(
      `${origin}/login?redirect=${encodeURIComponent(loginReturn)}`,
      { status: 307, headers: AUTH_PRIVATE_HEADERS },
    );
  }

  const state = await getExamOnboardingDetails(session.id);
  if (isProtected && needsExamOnboarding(state)) {
    const returnTo = `${pathname}${search}`;
    return NextResponse.redirect(
      `${origin}/onboarding?returnTo=${encodeURIComponent(returnTo)}`,
      { status: 307, headers: AUTH_PRIVATE_HEADERS },
    );
  }

  if (isOnboarding && !needsExamOnboarding(state) && searchParams.get('edit') !== '1') {
    const returnTo = getSafeRedirectPath(
      searchParams.get('returnTo') ?? searchParams.get('redirect'),
      '/dashboard',
    );
    return NextResponse.redirect(`${origin}${returnTo}`, {
      status: 307,
      headers: AUTH_PRIVATE_HEADERS,
    });
  }

  return null;
}

/**
 * Next.js 16 request proxy. Keep this lightweight: API abuse protection only.
 * Route handlers also validate and rate-limit sensitive actions independently.
 */
export async function proxy(request: NextRequest) {
  const strayOAuth = maybeForwardStrayOAuthCode(request);
  if (strayOAuth) return strayOAuth;

  const onboardingRedirect = await maybeEnforceExamOnboarding(request);
  if (onboardingRedirect) return onboardingRedirect;

  const pathname = request.nextUrl.pathname;
  const hasAuthenticatedSession = Boolean(
    parseSessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value),
  );
  // Published exact-exam node slugs are intentionally not part of the legacy
  // global catalog. Authenticated pages validate them against the user's exact
  // profile/version, so the public catalog cache must not reject or cache them.
  const alwaysValidatePublicPath =
    pathname.startsWith('/exams/') || pathname.startsWith('/question/');
  if (!hasAuthenticatedSession) {
    const unknownCatalogPath = await maybeRejectUnknownCatalogPath(request);
    if (unknownCatalogPath) return unknownCatalogPath;
  } else if (alwaysValidatePublicPath) {
    const unknownCatalogPath = await maybeRejectUnknownCatalogPath(request);
    if (unknownCatalogPath) return unknownCatalogPath;
  }

  const unknownTopLevel = maybeRejectUnknownTopLevel(pathname);
  if (unknownTopLevel) return unknownTopLevel;

  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const token = internalPathCheckToken();
  if (
    pathname === '/api/catalog/path-exists' &&
    token &&
    request.headers.get('x-questionwale-path-check') === token
  ) {
    return NextResponse.next();
  }

  const ip = getClientIp(request.headers);
  const rateLimitKey = getApiRateLimitKey(ip, request.nextUrl.pathname);
  const result = checkRateLimit(rateLimitKey, {
    limit: API_RATE_LIMIT,
    windowMs: API_RATE_WINDOW_MS,
  });

  if (!result.allowed) {
    const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Cache-Control': 'no-store',
          'Retry-After': String(retryAfterSeconds),
          'X-RateLimit-Limit': String(API_RATE_LIMIT),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(API_RATE_LIMIT));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/subjects/:path*',
    '/((?!_next/static|_next/image|favicon.ico|logo|images|home).*)',
  ],
};
