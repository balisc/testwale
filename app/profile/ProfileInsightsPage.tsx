'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import type { ProfileInsightsData } from '@/lib/profileInsightsTypes';
import ProfileShell from './ProfileShell';
import { getProfileInsightsCopy } from './profileInsightsCopy';
import ProfileInsights from './components/ProfileInsights';
import ProfileInsightsSkeleton from './components/ProfileInsightsSkeleton';

export default function ProfileInsightsPage() {
  const { language } = useLanguage();
  const copy = useMemo(() => getProfileInsightsCopy(language), [language]);
  const [insights, setInsights] = useState<ProfileInsightsData | null>(null);
  const [insightsFetching, setInsightsFetching] = useState(true);
  const [insightsError, setInsightsError] = useState(false);

  const loadInsights = useCallback(async () => {
    setInsightsFetching(true);
    setInsightsError(false);
    try {
      const res = await fetch('/api/profile/insights', { cache: 'no-store', credentials: 'include' });
      if (!res.ok) throw new Error('failed');
      setInsights((await res.json()) as ProfileInsightsData);
    } catch {
      setInsightsError(true);
    } finally {
      setInsightsFetching(false);
    }
  }, []);

  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  return (
    <ProfileShell activeTab="insights" title={copy.title} subtitle={copy.subtitle}>
      {({ openTargetExam }) => {
        if (insightsError && !insights) {
          return (
            <div className="py-12 text-center">
              <p className="text-sm text-red-600">{copy.loadError}</p>
              <button
                type="button"
                onClick={() => void loadInsights()}
                className="mt-4 inline-flex min-h-[44px] items-center text-sm text-brand underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {copy.retry}
              </button>
            </div>
          );
        }

        if (insightsFetching && !insights) {
          return <ProfileInsightsSkeleton />;
        }

        return insights ? (
          <ProfileInsights copy={copy} data={insights} language={language} onSetTargetExam={openTargetExam} />
        ) : null;
      }}
    </ProfileShell>
  );
}
