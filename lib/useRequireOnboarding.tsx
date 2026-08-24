'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { fetchClientJson } from '@/lib/clientRequestCache';

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
    // The content can paint immediately; this lightweight status check only
    // redirects accounts whose onboarding is genuinely incomplete.
    setReady(true);

    void (async () => {
      try {
        const data = await fetchClientJson<{ required: boolean }>(
          `onboarding-status:${user.id}`,
          '/api/onboarding/status',
          { maxAgeMs: 60_000 },
        );
        if (cancelled) return;
        if (data.required) {
          const next =
            typeof window !== 'undefined'
              ? `${redirectPath}?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
              : redirectPath;
          router.replace(next);
          return;
        }
      } catch {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, authLoading, user, router, redirectPath]);

  return { ready, authLoading };
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
