import { redirectAfterGoogleAuth, redirectToLogin } from '@/lib/googleAuthSession';
import { attachAuthFlashCookie } from '@/lib/authFlash';
import { authRedirectResponse } from '@/lib/authRedirectResponse';
import { getPublicOrigin } from '@/lib/publicOrigin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new Response(null, { status: 404 });
  }
  try {
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get('next');
    const formData = await request.formData();
    const credential = String(formData.get('credential') ?? '');

    return redirectAfterGoogleAuth(request, credential, redirectTo);
  } catch {
    const response = authRedirectResponse(`${getPublicOrigin(request)}/login`);
    attachAuthFlashCookie(response, 'oauth_failed');
    return response;
  }
}

export async function GET(request: Request) {
  return redirectToLogin(request);
}
