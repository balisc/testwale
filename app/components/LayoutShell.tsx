'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import Template from './Template';

const HIDDEN_CHROME_PATHS = ['/loading-test'];
const PageChromeVisibilityContext = createContext<((visible: boolean) => void) | null>(null);

export function usePageChromeVisibility() {
  return useContext(PageChromeVisibilityContext) ?? (() => undefined);
}

export default function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideChromeByPath = pathname ? HIDDEN_CHROME_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`)) : false;
  const [showPageChrome, setShowPageChrome] = useState(!hideChromeByPath);

  useEffect(() => {
    setShowPageChrome(!hideChromeByPath);
  }, [hideChromeByPath]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return (
    <PageChromeVisibilityContext.Provider value={setShowPageChrome}>
      {showPageChrome && <Navbar />}
      <Template disableTopPadding={!showPageChrome}>{children}</Template>
      {showPageChrome && <Footer />}
    </PageChromeVisibilityContext.Provider>
  );
}
