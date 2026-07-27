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

const API_RATE_LIMIT = 120;
const API_RATE_WINDOW_MS = 60_000;
const LEGACY_TOP_LEVEL = new Set(SUBJECT_KEYS.map((key) => key.toLowerCase()));
/** Active catalog subject slugs served under /subjects/:slug (extend when new subjects launch). */
const CATALOG_SUBJECT_SLUGS = new Set(['indian-polity']);

const PATH_CHECK_TTL_MS = 5 * 60_000;
const pathCheckCache = new Map<string, { ok: boolean; expiresAt: number }>();

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
    'robots.txt',
    'sitemap.xml',
    'llms.txt',
    '_next',
  ]);
  return reserved.has(segment);
}

function maybeRejectUnknownCatalogSubject(pathname: string): NextResponse | null {
  const match = pathname.match(/^\/subjects\/([^/]+)(?:\/|$)/i);
  if (!match) return null;
  const slug = match[1]!.toLowerCase();
  if (CATALOG_SUBJECT_SLUGS.has(slug)) return null;
  return notFoundResponse();
}

async function maybeRejectUnknownCatalogPath(
  request: NextRequest,
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/subjects/')) return null;
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 3) return null;

  const cached = pathCheckCache.get(pathname);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.ok ? null : notFoundResponse();
  }

  const checkUrl = new URL('/api/catalog/path-exists', request.nextUrl.origin);
  checkUrl.searchParams.set('path', pathname);

  try {
    const res = await fetch(checkUrl.toString(), {
      method: 'GET',
      next: { revalidate: 300 },
      headers: { 'x-catalog-path-check': '1' },
    });
    const ok = res.status !== 404;
    pathCheckCache.set(pathname, { ok, expiresAt: Date.now() + PATH_CHECK_TTL_MS });
    if (!ok) return notFoundResponse();
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

/**
 * Next.js 16 request proxy. Keep this lightweight: API abuse protection only.
 * Route handlers also validate and rate-limit sensitive actions independently.
 */
export async function proxy(request: NextRequest) {
  const strayOAuth = maybeForwardStrayOAuthCode(request);
  if (strayOAuth) return strayOAuth;

  const pathname = request.nextUrl.pathname;
  const unknownCatalogSubject = maybeRejectUnknownCatalogSubject(pathname);
  if (unknownCatalogSubject) return unknownCatalogSubject;

  const unknownCatalogPath = await maybeRejectUnknownCatalogPath(request);
  if (unknownCatalogPath) return unknownCatalogPath;

  const unknownTopLevel = maybeRejectUnknownTopLevel(pathname);
  if (unknownTopLevel) return unknownTopLevel;

  if (!pathname.startsWith('/api/')) {
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
