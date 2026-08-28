'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Template from './Template';
import HomeHeader from '@/app/home/components/HomeHeader';
import HomeFooter from '@/app/home/components/HomeFooter';
import SmoothHashScroll, { SCROLL_INTENT_KEY } from './SmoothHashScroll';
import OAuthCodeQueryGuard from '@/components/OAuthCodeQueryGuard';

const HIDDEN_CHROME_PATHS = ['/loading-test', '/onboarding'];
const PageChromeVisibilityContext = createContext<((visible: boolean) => void) | null>(null);

export function usePageChromeVisibility() {
  return useContext(PageChromeVisibilityContext) ?? (() => undefined);
}

export default function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideChromeByPath = pathname
    ? HIDDEN_CHROME_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
    : false;
  const [showPageChrome, setShowPageChrome] = useState(!hideChromeByPath);

  useEffect(() => {
    setShowPageChrome(!hideChromeByPath);
  }, [hideChromeByPath]);

  useEffect(() => {
    // Don't reset scroll when navigating to homepage for #subjects
    try {
      if (sessionStorage.getItem(SCROLL_INTENT_KEY)) return;
    } catch {
      /* ignore */
    }
    if (pathname === '/' && typeof window !== 'undefined' && window.location.hash) return;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return (
    <PageChromeVisibilityContext.Provider value={setShowPageChrome}>
      <OAuthCodeQueryGuard />
      <SmoothHashScroll />
      {showPageChrome ? <HomeHeader /> : null}
      <Template disableTopPadding={!showPageChrome}>{children}</Template>
      {showPageChrome ? <HomeFooter /> : null}
    </PageChromeVisibilityContext.Provider>
  );
}
