'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import HomeSectionSkeleton from '@/app/components/HomeSectionSkeleton';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { HOME_COPY, type HomeLang } from '@/lib/homeCopy';

const HomeChooseSubjectSection = dynamic(() => import('@/app/components/HomeChooseSubjectSection'), {
  loading: () => <HomeSectionSkeleton className="mx-auto mt-8 h-[520px] max-w-[1240px]" />,
});

const HomeLowerSections = dynamic(() => import('@/app/components/HomeLowerSections'), {
  loading: () => <HomeSectionSkeleton className="mx-auto mt-8 h-[640px] max-w-[1240px]" />,
});

type HomeClientProps = {
  initialSubjectCounts?: Record<string, number>;
};

export default function HomeClient({
  initialSubjectCounts,
}: HomeClientProps) {
  const { language } = useLanguage();
  const lang = language as HomeLang;
  const c = HOME_COPY[lang];
  const { user } = useAuth();
  const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>(initialSubjectCounts ?? {});

  useEffect(() => {
    const hasCounts = initialSubjectCounts && Object.values(initialSubjectCounts).some((v) => v > 0);
    if (hasCounts) return;

    fetch('/api/subject-counts')
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === 'object') {
          setSubjectCounts(data);
        }
      })
      .catch(() => undefined);
  }, [initialSubjectCounts]);

  return (
    <div className="min-w-0 overflow-x-hidden bg-white text-slate-900">
      <HomeChooseSubjectSection
        lang={lang}
        chooseSubject={c.chooseSubject}
        chooseSubjectSub={c.chooseSubjectSub}
        questions={c.questions}
        english={c.english}
        hindi={c.hindi}
        startPracticeCard={c.startPracticeCard}
        subjectCounts={subjectCounts}
      />

      <HomeLowerSections
        lang={lang}
        stepsTitle={c.stepsTitle}
        step1t={c.step1t}
        step1d={c.step1d}
        step2t={c.step2t}
        step2d={c.step2d}
        step3t={c.step3t}
        step3d={c.step3d}
        whyTitle={c.whyTitle}
        whySub={c.whySub}
        feat1t={c.feat1t}
        feat1d={c.feat1d}
        feat2t={c.feat2t}
        feat2d={c.feat2d}
        feat3t={c.feat3t}
        feat3d={c.feat3d}
        feat4t={c.feat4t}
        feat4d={c.feat4d}
        googleTitle={c.googleTitle}
        googleSub={c.googleSub}
        secureSignIn={c.secureSignIn}
        showGoogleCta={!user}
      />
    </div>
  );
}
