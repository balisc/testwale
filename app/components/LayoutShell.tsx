'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Template from './Template';
import BaliHeader from '@/app/bali/components/BaliHeader';
import BaliFooter from '@/app/bali/components/BaliFooter';
import SmoothHashScroll, { SCROLL_INTENT_KEY } from './SmoothHashScroll';

const HIDDEN_CHROME_PATHS = ['/loading-test'];
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
      <SmoothHashScroll />
      {showPageChrome ? <BaliHeader /> : null}
      <Template disableTopPadding={!showPageChrome}>{children}</Template>
      {showPageChrome ? <BaliFooter /> : null}
    </PageChromeVisibilityContext.Provider>
  );
}
