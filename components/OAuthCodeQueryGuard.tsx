'use client';

import { useEffect, useRef } from 'react';
import {
  buildOAuthCallbackForwardUrl,
  pathnameHasStrayOAuthParams,
} from '@/lib/oauthCodeRedirect';

/**
 * Client-side safety net when Supabase returns OAuth params to a non-callback page.
 * Server proxy should handle this first; this guard covers edge cases only.
 */
export default function OAuthCodeQueryGuard() {
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current || typeof window === 'undefined') return;

    const { pathname, search, origin } = window.location;
    const params = new URLSearchParams(search);
    if (!pathnameHasStrayOAuthParams(pathname, params)) return;

    handledRef.current = true;
    const target = buildOAuthCallbackForwardUrl(origin, pathname, params);
    window.location.replace(target);
  }, []);

  return null;
}
