'use client';



import { useEffect, useState } from 'react';

import type { PracticeProgress } from '@/lib/practice';

import { trackPracticeDebug } from '@/lib/practiceDebug';

import { useAuth } from '@/lib/AuthContext';

import { useLanguage } from '@/lib/LanguageContext';



type PracticeProgressSummaryProps = {

  subjectId?: string | null;

  topicId?: string | null;

  subtopicId?: string | null;

  refreshKey?: number;

  /** When set, skips network fetch (e.g. after answer submit RPC returns progress). */

  progressOverride?: PracticeProgress | null;

};



const COPY = {

  en: {

    title: 'Your Progress',

    attempted: 'Attempted',

    correct: 'Correct',

    wrong: 'Wrong',

    accuracy: 'Accuracy',

    signIn: 'Sign in to track your personal progress.',

  },

  hi: {

    title: 'आपकी प्रगति',

    attempted: 'प्रयास',

    correct: 'सही',

    wrong: 'गलत',

    accuracy: 'सटीकता',

    signIn: 'अपनी प्रगति ट्रैक करने के लिए साइन इन करें।',

  },

};



export default function PracticeProgressSummary({

  subjectId,

  topicId,

  subtopicId,

  refreshKey = 0,

  progressOverride,

}: PracticeProgressSummaryProps) {

  const { user, loading } = useAuth();

  const { language } = useLanguage();

  const c = COPY[language];

  const [progress, setProgress] = useState<PracticeProgress | null>(null);

  const [fetching, setFetching] = useState(false);



  useEffect(() => {

    if (progressOverride) {

      setProgress(progressOverride);

      return;

    }

  }, [progressOverride]);



  useEffect(() => {

    if (!user) {

      setProgress(null);

      return;

    }



    if (progressOverride) {

      return;

    }



    const params = new URLSearchParams();

    if (subjectId) params.set('subjectId', subjectId);

    if (topicId) params.set('topicId', topicId);

    if (subtopicId) params.set('subtopicId', subtopicId);



    setFetching(true);

    trackPracticeDebug('progress_fetch', params.toString());

    fetch(`/api/practice/progress?${params.toString()}`, { cache: 'no-store' })

      .then(async (res) => (res.ok ? ((await res.json()) as PracticeProgress) : null))

      .then((data) => setProgress(data))

      .catch(() => setProgress(null))

      .finally(() => setFetching(false));

  }, [user, subjectId, topicId, subtopicId, refreshKey, progressOverride]);



  if (loading) {

    return (

      <div className="mb-6 h-24 animate-pulse rounded-2xl border border-slate-100 bg-white" />

    );

  }



  if (!user) {

    return (

      <div className="mb-6 rounded-2xl border border-dashed border-[#DDD6FE] bg-[#FAF5FF] px-4 py-3 text-sm text-slate-600">

        {c.signIn}

      </div>

    );

  }



  if ((fetching && !progressOverride) || !progress) {

    return <div className="mb-6 h-24 animate-pulse rounded-2xl border border-slate-100 bg-white" />;

  }



  return (

    <section className="mb-6 rounded-2xl border border-[#EDE9FE] bg-white px-4 py-4 shadow-sm sm:px-5">

      <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-brand">{c.title}</h2>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">

        <Stat label={c.attempted} value={progress.attempted} />

        <Stat label={c.correct} value={progress.correct} />

        <Stat label={c.wrong} value={progress.wrong} />

        <Stat label={c.accuracy} value={`${progress.accuracy}%`} />

      </div>

    </section>

  );

}



function Stat({ label, value }: { label: string; value: string | number }) {

  return (

    <div className="rounded-xl bg-[#FAF5FF] px-3 py-2.5">

      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>

      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>

    </div>

  );

}

