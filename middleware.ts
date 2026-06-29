import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, getApiRateLimitKey, getClientIp } from '@/lib/rateLimit';

const API_RATE_LIMIT = 120;
const API_RATE_WINDOW_MS = 60_000;

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/api/')) {
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
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(API_RATE_LIMIT));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
