'use client';

import { useMemo } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { getProfileCopy } from './profileCopy';
import { getProfileInsightsCopy } from './profileInsightsCopy';
import ProfileShell from './ProfileShell';
import ProfileOverview from './components/ProfileOverview';
import ProfileOverviewSkeleton from './components/ProfileOverviewSkeleton';
import ExamPreferenceCard from './components/ExamPreferenceCard';

export default function ProfileOverviewPage() {
  const { language } = useLanguage();
  const copy = useMemo(() => getProfileCopy(language), [language]);

  return (
    <ProfileShell activeTab="overview" title={copy.title} subtitle={copy.subtitle}>
      {({ profileData, fetching, openEdit, openTargetExam }) =>
        fetching && !profileData ? (
          <ProfileOverviewSkeleton />
        ) : profileData ? (
          <>
            <ProfileOverview
              copy={copy}
              data={profileData}
              language={language}
              onEditProfile={openEdit}
              onSetTargetExam={openTargetExam}
            />
            {profileData.profile.target_exam_profile_id ? (
              <ExamPreferenceCard />
            ) : null}
          </>
        ) : null
      }
    </ProfileShell>
  );
}
