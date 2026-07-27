import type { NextResponse } from 'next/server';
import { getSessionCookieOptions } from '@/lib/appSession';

export const AUTH_FLASH_COOKIE = 'qw_auth_notice';

export type AuthFlashKind = 'oauth_failed' | 'oauth_config' | 'oauth_save';

const FLASH_MAX_AGE_SECONDS = 120;

const MESSAGES: Record<AuthFlashKind, { en: string; hi: string }> = {
  oauth_failed: {
    en: 'Sign-in could not be completed. Please try again.',
    hi: 'साइन-इन पूरा नहीं हो सका। कृपया पुनः प्रयास करें।',
  },
  oauth_config: {
    en: 'Sign-in is temporarily unavailable. Please try again later.',
    hi: 'साइन-इन अस्थायी रूप से उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।',
  },
  oauth_save: {
    en: 'We could not finish setting up your account. Please try again.',
    hi: 'आपका खाता सेटअप पूरा नहीं हो सका। कृपया पुनः प्रयास करें।',
  },
};

export function isAuthFlashKind(value: string | undefined | null): value is AuthFlashKind {
  return Boolean(value && value in MESSAGES);
}

export function getAuthFlashMessage(kind: AuthFlashKind, language: 'en' | 'hi' = 'en'): string {
  return MESSAGES[kind][language] ?? MESSAGES[kind].en;
}

export function attachAuthFlashCookie(response: NextResponse, kind: AuthFlashKind): NextResponse {
  response.cookies.set(AUTH_FLASH_COOKIE, kind, {
    ...getSessionCookieOptions(),
    maxAge: FLASH_MAX_AGE_SECONDS,
  });
  return response;
}

export function clearAuthFlashCookie(response: NextResponse): NextResponse {
  response.cookies.set(AUTH_FLASH_COOKIE, '', {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
