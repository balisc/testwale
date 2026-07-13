'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export const SUBJECTS_HASH = '#subjects';
export const SIGN_IN_HASH = '#sign-in';
export const SCROLL_INTENT_KEY = 'qw-scroll-to';

const HOME_HASHES = new Set([SUBJECTS_HASH, SIGN_IN_HASH]);

function headerOffsetPx() {
  if (typeof window === 'undefined') return 72;
  return window.matchMedia('(max-width: 359px)').matches ? 56 : 72;
}

function scrollToHash(hash: string, behavior: ScrollBehavior = 'smooth') {
  const id = hash.replace(/^#/, '').trim();
  if (!id) return false;
  const el = document.getElementById(id);
  if (!el) return false;
  const top = el.getBoundingClientRect().top + window.scrollY - headerOffsetPx() - 12;
  window.scrollTo({ top: Math.max(0, top), behavior });
  return true;
}

function scrollToHashWhenReady(hash: string, attempts = 0) {
  if (scrollToHash(hash, 'smooth')) return;
  if (attempts >= 100) return;
  window.setTimeout(() => scrollToHashWhenReady(hash, attempts + 1), 40);
}

/** Homepage section links like `/#subjects` or `/#sign-in`. */
function parseHomeHashLink(href: string | null): string | null {
  if (!href) return null;
  try {
    if (href.startsWith('#') && HOME_HASHES.has(href)) return href;
    const url = new URL(href, window.location.origin);
    if ((url.pathname === '/' || url.pathname === '') && HOME_HASHES.has(url.hash)) {
      return url.hash;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Smooth-scroll to homepage hash targets (#subjects, #sign-in),
 * including when navigating from another page.
 */
export default function SmoothHashScroll() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== '/') return;

    const run = () => {
      const intent = sessionStorage.getItem(SCROLL_INTENT_KEY);
      if (intent) {
        sessionStorage.removeItem(SCROLL_INTENT_KEY);
        const hash = intent.startsWith('#') ? intent : `#${intent}`;
        if (window.location.hash !== hash) {
          window.history.replaceState(null, '', `/${hash}`);
        }
        // Wait a tick so LayoutShell scroll-to-top (if any) finishes first
        window.setTimeout(() => scrollToHashWhenReady(hash), 50);
        return;
      }

      if (window.location.hash && HOME_HASHES.has(window.location.hash)) {
        window.setTimeout(() => scrollToHashWhenReady(window.location.hash), 50);
      }
    };

    run();
  }, [pathname]);

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash && HOME_HASHES.has(window.location.hash)) {
        scrollToHashWhenReady(window.location.hash);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.('a[href]');
      if (!anchor) return;
      const hash = parseHomeHashLink(anchor.getAttribute('href'));
      if (!hash) return;

      event.preventDefault();
      event.stopPropagation();

      if (pathname === '/') {
        if (window.location.hash !== hash) {
          window.history.pushState(null, '', `/${hash}`);
        }
        scrollToHashWhenReady(hash);
        return;
      }

      sessionStorage.setItem(SCROLL_INTENT_KEY, hash.replace(/^#/, ''));
      router.push('/');
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [pathname, router]);

  return null;
}
