'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { fetchClientJson, isClientCacheFresh, readClientCache } from '@/lib/clientRequestCache';
import type { ProfileSavedData } from '@/lib/profileSavedTypes';
import ProfileShell from './ProfileShell';
import { getProfileSavedCopy } from './profileSavedCopy';
import ProfileSaved from './components/ProfileSaved';
import ProfileSavedSkeleton from './components/ProfileSavedSkeleton';

export default function ProfileSavedPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const copy = useMemo(() => getProfileSavedCopy(language), [language]);
  const [saved, setSaved] = useState<ProfileSavedData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(false);

  const loadSaved = useCallback(async (force = false) => {
    if (!user) return;
    const cacheKey = `profile-saved:${user.id}`;
    const cached = readClientCache<ProfileSavedData>(cacheKey);
    if (cached) {
      setSaved(cached);
      setFetching(false);
      if (!force && isClientCacheFresh(cacheKey, 60_000)) return;
    } else {
      setFetching(true);
    }
    setError(false);
    try {
      setSaved(await fetchClientJson<ProfileSavedData>(cacheKey, '/api/profile/saved', {
        maxAgeMs: 60_000,
        force,
      }));
    } catch {
      setError(true);
    } finally {
      setFetching(false);
    }
  }, [user]);

  useEffect(() => {
    void loadSaved();
  }, [loadSaved]);

  return (
    <ProfileShell activeTab="saved" title={copy.title} subtitle={copy.subtitle}>
      {() => {
        if (error && !saved) {
          return (
            <div className="py-12 text-center">
              <p className="text-sm text-red-600">{copy.loadError}</p>
              <button
                type="button"
                onClick={() => void loadSaved(true)}
                className="mt-4 inline-flex min-h-[44px] items-center text-sm text-brand underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {copy.retry}
              </button>
            </div>
          );
        }

        if (fetching && !saved) {
          return <ProfileSavedSkeleton />;
        }

        return saved ? <ProfileSaved copy={copy} data={saved} language={language} /> : null;
      }}
    </ProfileShell>
  );
}
