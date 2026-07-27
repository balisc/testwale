'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import type { ProfilePageData } from '@/lib/profileAnalytics';
import { needsProfileOnboarding } from '@/lib/profileOnboarding';

type UseRequireOnboardingOptions = {
  enabled?: boolean;
  redirectPath?: string;
};

export function useRequireOnboarding(options: UseRequireOnboardingOptions = {}) {
  const { enabled = true, redirectPath = '/onboarding' } = options;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setReady(true);
      return;
    }

    if (authLoading) return;

    if (!user) {
      setReady(true);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch('/api/profile', { cache: 'no-store', credentials: 'include' });
        if (cancelled) return;
        if (res.status === 401) {
          setReady(true);
          return;
        }
        if (!res.ok) {
          setReady(true);
          return;
        }
        const data = (await res.json()) as ProfilePageData;
        if (needsProfileOnboarding(data.profile)) {
          const next =
            typeof window !== 'undefined'
              ? `${redirectPath}?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
              : redirectPath;
          router.replace(next);
          return;
        }
        setReady(true);
      } catch {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, authLoading, user, router, redirectPath]);

  return { ready: ready && !authLoading, authLoading };
}

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { ready, authLoading } = useRequireOnboarding();

  if (authLoading || !ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" aria-label="Loading" />
      </div>
    );
  }

  return <>{children}</>;
}
