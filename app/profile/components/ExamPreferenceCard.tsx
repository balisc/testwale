'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpenCheck, Loader2, Pencil, RotateCw } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import type { SavedExamPreference } from '@/lib/examPreference';

type PreferenceResponse = {
  status: 'ready' | 'missing' | 'invalid';
  preference: SavedExamPreference | null;
};

function localized(value: { en?: string; hi?: string }, language: 'en' | 'hi', fallback: string) {
  return value[language] ?? value.en ?? value.hi ?? fallback;
}

export default function ExamPreferenceCard() {
  const { language } = useLanguage();
  const [preference, setPreference] = useState<SavedExamPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const copy = language === 'hi'
    ? {
        heading: 'परीक्षा तैयारी पसंद', exam: 'चुनी गई परीक्षा', tier: 'चुना गया Tier',
        stage: 'पेपर / चरण', mode: 'तैयारी मोड', change: 'पसंद बदलें', retry: 'फिर प्रयास करें',
        error: 'आपकी सेव की गई परीक्षा पसंद लोड नहीं हो सकी।', missing: 'अभी कोई तैयारी पसंद सेव नहीं है।',
      }
    : {
        heading: 'Exam preparation preference', exam: 'Selected exam', tier: 'Selected Tier',
        stage: 'Paper / stage', mode: 'Preparation mode', change: 'Change preference', retry: 'Retry',
        error: 'We could not load your saved exam preference.', missing: 'No preparation preference is saved yet.',
      };

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch('/api/profile/exam-preference', {
        cache: 'no-store', credentials: 'include',
      });
      if (!response.ok) throw new Error('preference_load_failed');
      const body = await response.json() as PreferenceResponse;
      setPreference(body.preference ?? null);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const clear = () => setPreference(null);
    window.addEventListener('questionwale:clear-user-caches', clear);
    return () => window.removeEventListener('questionwale:clear-user-caches', clear);
  }, []);

  return (
    <section className="mt-6 w-full min-w-0 max-w-full rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6" aria-labelledby="exam-preference-heading">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-brand"><BookOpenCheck className="h-5 w-5" aria-hidden /></span>
          <h2 id="exam-preference-heading" className="mt-3 break-words text-xl font-bold text-[#0F172A]">{copy.heading}</h2>
        </div>
        <Link href="/onboarding?edit=1&returnTo=%2Fprofile" className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-[#6D28D9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto">
          <Pencil className="h-4 w-4" aria-hidden />{copy.change}
        </Link>
      </div>

      {loading ? (
        <div className="mt-5 flex min-h-24 items-center justify-center rounded-xl bg-slate-50" aria-busy="true"><Loader2 className="h-6 w-6 animate-spin text-brand" aria-hidden /></div>
      ) : failed ? (
        <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4" role="alert">
          <p className="text-sm font-medium text-red-700">{copy.error}</p>
          <button type="button" onClick={() => void load()} className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-red-700 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"><RotateCw className="h-4 w-4" aria-hidden />{copy.retry}</button>
        </div>
      ) : preference ? (
        <dl className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0 rounded-xl bg-slate-50 p-3"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{copy.exam}</dt><dd className="mt-1 break-words text-sm font-bold text-slate-900">{localized(preference.examTitle, language, preference.examCode)}</dd></div>
          {preference.tierCode ? <div className="min-w-0 rounded-xl bg-slate-50 p-3"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{copy.tier}</dt><dd className="mt-1 text-sm font-bold text-slate-900">{preference.tierCode === 'TIER_I' ? 'Tier I' : 'Tier II'}</dd></div> : null}
          <div className="min-w-0 rounded-xl bg-slate-50 p-3"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{copy.stage}</dt><dd className="mt-1 break-words text-sm font-bold text-slate-900">{localized(preference.paperOrSection, language, localized(preference.stageTitle, language, preference.stageCode))}</dd></div>
          <div className="min-w-0 rounded-xl bg-slate-50 p-3"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{copy.mode}</dt><dd className="mt-1 text-sm font-bold text-slate-900">{preference.preparationMode === 'MCQ' ? 'MCQ / Objective' : 'Written / Descriptive'}</dd></div>
        </dl>
      ) : (
        <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{copy.missing}</p>
      )}
    </section>
  );
}
