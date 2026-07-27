import { NextResponse } from 'next/server';

export const AUTH_PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store, must-revalidate',
  'Referrer-Policy': 'no-referrer',
} as const;

export function authRedirectResponse(url: string, status = 302): NextResponse {
  return NextResponse.redirect(url, {
    status,
    headers: AUTH_PRIVATE_HEADERS,
  });
}
