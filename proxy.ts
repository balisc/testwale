import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { AUTH_PRIVATE_HEADERS } from '@/lib/authRedirectResponse';
import { renderBrandedNotFoundHtml } from '@/lib/brandedNotFoundHtml';
import {
  buildOAuthCallbackForwardUrl,
  pathnameHasStrayOAuthParams,
} from '@/lib/oauthCodeRedirect';
import { checkDistributedRateLimit } from '@/lib/distributedRateLimit';
import {
  getApiRateLimitPolicy,
  getClientIp,
  normalizeRateLimitAccount,
  routeRateLimitGroup,
} from '@/lib/rateLimit';
import { checkMutationRequest } from '@/lib/requestSecurity';
import { SUBJECT_KEYS } from '@/lib/subjects';
import { AUTH_COOKIE_NAME, getSessionCookieOptions, type SessionUser } from '@/lib/appSession';
import {
  resolveAuthSession,
  shouldUpgradeLegacySessionInProxy,
  upgradeLegacySession,
} from '@/lib/sessionStore';
import { needsExamOnboarding } from '@/lib/examOnboarding';
import { getExamOnboardingGateState } from '@/lib/examOnboardingServer';
import { getSafeRedirectPath } from '@/lib/safeRedirect';
import { isPermanentlyRemovedLegacyTopicPath } from '@/lib/legacyRouteTombstones';

const LEGACY_TOP_LEVEL = new Set(SUBJECT_KEYS.map((key) => key.toLowerCase()));

const PATH_CHECK_TTL_MS = 5 * 60_000;
const PATH_CHECK_NEGATIVE_TTL_MS = 15_000;
const pathCheckCache = new Map<string, { ok: boolean; expiresAt: number }>();

function internalPathCheckToken(): string | null {
  return process.env.AUTH_SECRET?.trim() || null;
}

function usesStrictDynamicCsp(pathname: string) {
  return (
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname === '/verify-email' ||
    pathname === '/dashboard' ||
    pathname === '/onboarding' ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/ssc-cgl') ||
    pathname.startsWith('/ssc-chsl')
  );
}

export function buildStrictDynamicCsp(nonce: string) {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://accounts.google.com${isDevelopment ? " 'unsafe-eval'" : ''}`,
    "script-src-attr 'none'",
    // React style props and the current Google widget require style attributes.
    "style-src 'self' 'unsafe-inline' https://accounts.google.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com https://oauth2.googleapis.com https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com",
    "frame-src 'self' https://accounts.google.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

async function getAccountLimitSubject(request: NextRequest, pathname: string) {
  if (
    pathname !== '/api/auth/login' &&
    pathname !== '/api/signup' &&
    pathname !== '/api/auth/recovery/request' &&
    pathname !== '/api/auth/email-verification/request'
  ) return null;
  try {
    const body = await request.clone().json() as { email?: unknown };
    const account = normalizeRateLimitAccount(body?.email);
    return account ? `account:${account}:${routeRateLimitGroup(pathname)}` : null;
  } catch {
    return null;
  }
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
    'content-standards',
    'contact',
    'privacy',
    'terms',
    'disclaimer',
    'refund-policy',
    'login',
    'signup',
    'forgot-password',
    'reset-password',
    'verify-email',
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
    'ssc-chsl',
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
  // The destination pages perform the authoritative validation. The proxy
  // probe exists to preserve a true 404 for document requests; repeating it
  // for Link prefetches and RSC navigations only adds a serial network hop.
  if (
    request.headers.get('rsc') === '1' ||
    request.headers.has('next-router-prefetch') ||
    request.headers.get('purpose')?.toLowerCase() === 'prefetch'
  ) {
    return null;
  }

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
      cache: 'no-store',
      headers: token ? { 'x-questionwale-path-check': token } : undefined,
    });
    if (res.ok) {
      pathCheckCache.set(cacheKey, { ok: true, expiresAt: Date.now() + PATH_CHECK_TTL_MS });
      return null;
    }
    if (res.status === 404) {
      // Syllabus publishing and legacy-data fallbacks can make a path valid
      // immediately. Keep abuse protection, but never pin a newly valid path
      // behind a five-minute negative cache.
      pathCheckCache.set(cacheKey, {
        ok: false,
        expiresAt: Date.now() + PATH_CHECK_NEGATIVE_TTL_MS,
      });
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

function goneResponse(): NextResponse {
  return new NextResponse(renderBrandedNotFoundHtml(), {
    status: 410,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=86400',
      'X-Robots-Tag': 'noindex, follow',
    },
  });
}

async function maybeEnforceExamOnboarding(
  request: NextRequest,
  session: SessionUser | null,
): Promise<NextResponse | null> {
  const { pathname, search, searchParams, origin } = request.nextUrl;
  const isOnboarding = pathname === '/onboarding';
  const isProtected =
    pathname === '/dashboard' ||
    pathname === '/profile' ||
    pathname.startsWith('/profile/');
  if (!isOnboarding && !isProtected) return null;

  if (!session) {
    if (!isOnboarding) return null;
    const loginReturn = `/onboarding${search}`;
    return NextResponse.redirect(
      `${origin}/login?redirect=${encodeURIComponent(loginReturn)}`,
      { status: 307, headers: AUTH_PRIVATE_HEADERS },
    );
  }

  const state = await getExamOnboardingGateState(session.id);
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

  const pathname = request.nextUrl.pathname;
  if (isPermanentlyRemovedLegacyTopicPath(pathname)) {
    return goneResponse();
  }

  const rawAuthToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const authSession = await resolveAuthSession(rawAuthToken);
  const session = authSession?.user ?? null;
  const upgradedToken = authSession?.kind === 'legacy' &&
    shouldUpgradeLegacySessionInProxy(request.method, pathname)
    ? await upgradeLegacySession(authSession)
    : null;
  const applySessionUpgrade = (response: NextResponse) => {
    if (upgradedToken) {
      response.cookies.set(AUTH_COOKIE_NAME, upgradedToken, getSessionCookieOptions());
    }
    return response;
  };

  if (pathname === '/' && session) {
    return applySessionUpgrade(NextResponse.redirect(new URL('/dashboard', request.url), {
      status: 307,
      headers: AUTH_PRIVATE_HEADERS,
    }));
  }

  const onboardingRedirect = await maybeEnforceExamOnboarding(request, session);
  if (onboardingRedirect) return applySessionUpgrade(onboardingRedirect);

  const hasAuthenticatedSession = Boolean(session);
  // Published exact-exam node slugs are intentionally not part of the legacy
  // global catalog. Authenticated pages validate them against the user's exact
  // profile/version, so the public catalog cache must not reject or cache them.
  const alwaysValidatePublicPath =
    pathname.startsWith('/exams/') || pathname.startsWith('/question/');
  if (!hasAuthenticatedSession) {
    const unknownCatalogPath = await maybeRejectUnknownCatalogPath(request);
    if (unknownCatalogPath) return applySessionUpgrade(unknownCatalogPath);
  } else if (alwaysValidatePublicPath) {
    const unknownCatalogPath = await maybeRejectUnknownCatalogPath(request);
    if (unknownCatalogPath) return applySessionUpgrade(unknownCatalogPath);
  }

  const unknownTopLevel = maybeRejectUnknownTopLevel(pathname);
  if (unknownTopLevel) return applySessionUpgrade(unknownTopLevel);

  if (!pathname.startsWith('/api/')) {
    if (usesStrictDynamicCsp(pathname)) {
      const nonce = randomBytes(16).toString('base64');
      const csp = buildStrictDynamicCsp(nonce);
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-nonce', nonce);
      requestHeaders.set('Content-Security-Policy', csp);
      const response = NextResponse.next({ request: { headers: requestHeaders } });
      response.headers.set('Content-Security-Policy', csp);
      return applySessionUpgrade(response);
    }
    return applySessionUpgrade(NextResponse.next());
  }

  const token = internalPathCheckToken();
  if (
    pathname === '/api/catalog/path-exists' &&
    token &&
    request.headers.get('x-questionwale-path-check') === token
  ) {
    return applySessionUpgrade(NextResponse.next());
  }

  if (!pathname.startsWith('/api/admin/')) {
    const mutationCheck = await checkMutationRequest(request);
    if (!mutationCheck.ok) {
      return applySessionUpgrade(NextResponse.json(
        { error: mutationCheck.error },
        {
          status: mutationCheck.status,
          headers: { 'Cache-Control': 'no-store' },
        },
      ));
    }
  }

  const ip = getClientIp(request.headers);
  const policy = getApiRateLimitPolicy(pathname);
  const group = routeRateLimitGroup(pathname);
  const accountSubject = await getAccountLimitSubject(request, pathname);
  const results = await Promise.all([
    checkDistributedRateLimit(`ip:${ip}:${group}`, policy),
    ...(accountSubject ? [checkDistributedRateLimit(accountSubject, policy)] : []),
  ]);
  const result = results.reduce((worst, current) => {
    if (!current.allowed) return current;
    return current.remaining < worst.remaining ? current : worst;
  });

  if (!result.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      result.retryAfterSeconds || Math.ceil((result.resetAt - Date.now()) / 1000),
    );
    return applySessionUpgrade(NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Cache-Control': 'no-store',
          'Retry-After': String(retryAfterSeconds),
          'X-RateLimit-Limit': String(policy.limit),
          'X-RateLimit-Remaining': '0',
        },
      },
    ));
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(policy.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  return applySessionUpgrade(response);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:avif|css|gif|ico|jpe?g|js|map|png|svg|ttf|woff2?)$).*)',
  ],
};
