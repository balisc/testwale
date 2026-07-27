'use client';

import { useMemo } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { getProfileCopy } from './profileCopy';
import { getProfileInsightsCopy } from './profileInsightsCopy';
import ProfileShell from './ProfileShell';
import ProfileOverview from './components/ProfileOverview';
import ProfileOverviewSkeleton from './components/ProfileOverviewSkeleton';

export default function ProfileOverviewPage() {
  const { language } = useLanguage();
  const copy = useMemo(() => getProfileCopy(language), [language]);

  return (
    <ProfileShell activeTab="overview" title={copy.title} subtitle={copy.subtitle}>
      {({ profileData, fetching, openEdit, openTargetExam }) =>
        fetching && !profileData ? (
          <ProfileOverviewSkeleton />
        ) : profileData ? (
          <ProfileOverview
            copy={copy}
            data={profileData}
            language={language}
            onEditProfile={openEdit}
            onSetTargetExam={openTargetExam}
          />
        ) : null
      }
    </ProfileShell>
  );
}
