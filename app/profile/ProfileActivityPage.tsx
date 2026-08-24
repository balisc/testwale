'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { fetchClientJson, isClientCacheFresh, readClientCache } from '@/lib/clientRequestCache';
import { parseActivityPeriod } from '@/lib/profileActivityCore';
import type { ActivityPeriodDays, ProfileActivityData } from '@/lib/profileActivityTypes';
import ProfileShell from './ProfileShell';
import { getProfileActivityCopy, periodQueryValue } from './profileActivityCopy';
import ProfileActivity from './components/ProfileActivity';
import ProfileActivityPeriodSelector from './components/ProfileActivityPeriodSelector';
import ProfileActivitySkeleton from './components/ProfileActivitySkeleton';

function profileActivityPath(period: ActivityPeriodDays): string {
  if (period === 7) return '/profile/activity';
  return `/profile/activity?period=${periodQueryValue(period)}`;
}

function ProfileActivityContent() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const copy = useMemo(() => getProfileActivityCopy(language), [language]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const period = parseActivityPeriod(searchParams.get('period'));

  const [activity, setActivity] = useState<ProfileActivityData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(false);

  const loadActivity = useCallback(async (selectedPeriod: ActivityPeriodDays, force = false) => {
    if (!user) return;
    const cacheKey = `profile-activity:${user.id}:${selectedPeriod}`;
    const cached = readClientCache<ProfileActivityData>(cacheKey);
    if (cached) {
      setActivity(cached);
      setFetching(false);
      if (!force && isClientCacheFresh(cacheKey, 60_000)) return;
    } else {
      setFetching(true);
    }
    setError(false);
    try {
      const query =
        selectedPeriod === 7 ? '' : `?period=${encodeURIComponent(periodQueryValue(selectedPeriod))}`;
      setActivity(await fetchClientJson<ProfileActivityData>(
        cacheKey,
        `/api/profile/activity${query}`,
        { maxAgeMs: 60_000, force },
      ));
    } catch {
      setError(true);
    } finally {
      setFetching(false);
    }
  }, [user]);

  useEffect(() => {
    void loadActivity(period);
  }, [loadActivity, period]);

  const handlePeriodChange = (next: ActivityPeriodDays) => {
    router.replace(profileActivityPath(next), { scroll: false });
  };

  return (
    <ProfileShell activeTab="activity" title={copy.title} subtitle={copy.subtitle}>
      {() => (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-end">
            <ProfileActivityPeriodSelector copy={copy} period={period} onChange={handlePeriodChange} />
          </div>

          {error && !activity ? (
            <div className="py-12 text-center">
              <p className="text-sm text-red-600">{copy.loadError}</p>
              <button
                type="button"
                onClick={() => void loadActivity(period, true)}
                className="mt-4 inline-flex min-h-[44px] items-center text-sm text-brand underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {copy.retry}
              </button>
            </div>
          ) : fetching && !activity ? (
            <ProfileActivitySkeleton />
          ) : activity ? (
            <ProfileActivity copy={copy} data={activity} language={language} />
          ) : null}
        </>
      )}
    </ProfileShell>
  );
}

export default function ProfileActivityPage() {
  return (
    <Suspense fallback={<ProfileActivitySkeleton />}>
      <ProfileActivityContent />
    </Suspense>
  );
}
