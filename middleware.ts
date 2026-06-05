import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;
  const parts = pathname.split('/').filter(Boolean);

  if (parts.length >= 2 && parts[0] === 'question') {
    const canonicalSlug = parts.slice(1).join('/');
    const redirectUrl = new URL(`${origin}/question/${canonicalSlug}`);
    return NextResponse.redirect(redirectUrl, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/question/:slug*'],
};
