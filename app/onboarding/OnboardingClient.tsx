'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Loader2, Target } from 'lucide-react';
import TargetExamPickerField from '@/components/profile/TargetExamPickerField';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { minExamDateInput, validateExamDateInput } from '@/lib/examCountdown';
import { needsProfileOnboarding } from '@/lib/profileOnboarding';
import type { ProfilePageData } from '@/lib/profileAnalytics';
import { getSafeRedirectPath } from '@/lib/safeRedirect';

const COPY = {
  en: {
    title: 'Set up your exam goal',
    subtitle: 'Tell us your target exam and date so we can personalize your prep.',
    stepExam: 'Target exam',
    stepDate: 'Exam date',
    chooseExam: 'Select your target exam',
    otherExam: 'Other (type your exam)',
    otherPlaceholder: 'e.g. SSC CGL, State PCS…',
    examDateLabel: 'When is your exam?',
    examDateHint: 'Pick today or a future date.',
    continue: 'Save & continue',
    saving: 'Saving…',
    loadError: 'Could not save. Please try again.',
    examsLoadError: 'Could not load exams. Type your exam name below.',
    searchExams: 'Search exams by name, state or stage…',
    noExamsFound: 'No exams match your search.',
    invalidDate: 'Please choose a valid future exam date.',
    pickExam: 'Please select or enter your target exam.',
    loading: 'Loading…',
  },
  hi: {
    title: 'अपना परीक्षा लक्ष्य सेट करें',
    subtitle: 'अपनी लक्ष्य परीक्षा और तारीख बताएं ताकि हम आपकी तैयारी को व्यक्तिगत बना सकें।',
    stepExam: 'लक्ष्य परीक्षा',
    stepDate: 'परीक्षा की तारीख',
    chooseExam: 'अपनी लक्ष्य परीक्षा चुनें',
    otherExam: 'अन्य (परीक्षा का नाम लिखें)',
    otherPlaceholder: 'जैसे SSC CGL, State PCS…',
    examDateLabel: 'आपकी परीक्षा कब है?',
    examDateHint: 'आज या आगे की कोई तारीख चुनें।',
    continue: 'सहेजें और आगे बढ़ें',
    saving: 'सहेजा जा रहा है…',
    loadError: 'सहेजा नहीं जा सका। पुनः प्रयास करें।',
    examsLoadError: 'परीक्षाएँ लोड नहीं हो सकीं। नाम मैन्युअल लिखें।',
    searchExams: 'परीक्षा, राज्य या स्तर से खोजें…',
    noExamsFound: 'कोई परीक्षा नहीं मिली।',
    invalidDate: 'कृपया मान्य परीक्षा तारीख चुनें।',
    pickExam: 'कृपया अपनी लक्ष्य परीक्षा चुनें या लिखें।',
    loading: 'लोड हो रहा है…',
  },
};

export default function OnboardingClient() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const c = COPY[language];

  const redirectTo = getSafeRedirectPath(searchParams.get('redirect'), '/profile');

  const [checkingProfile, setCheckingProfile] = useState(true);
  const [targetExam, setTargetExam] = useState('');
  const [examDate, setExamDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent('/onboarding')}`);
      return;
    }

    void (async () => {
      try {
        const res = await fetch('/api/profile', { cache: 'no-store', credentials: 'include' });
        if (res.status === 401) {
          router.replace(`/login?redirect=${encodeURIComponent('/onboarding')}`);
          return;
        }
        if (res.ok) {
          const data = (await res.json()) as ProfilePageData;
          if (!needsProfileOnboarding(data.profile)) {
            router.replace(redirectTo);
            return;
          }
          if (data.profile.target_exam?.trim()) {
            setTargetExam(data.profile.target_exam.trim());
          }
          if (data.profile.exam_date) {
            setExamDate(data.profile.exam_date.slice(0, 10));
          }
        }
      } finally {
        setCheckingProfile(false);
      }
    })();
  }, [authLoading, user, router, redirectTo]);

  const handleSubmit = async () => {
    setError(null);
    const trimmedExam = targetExam.trim();
    if (!trimmedExam) {
      setError(c.pickExam);
      return;
    }
    if (!examDate || !validateExamDateInput(examDate)) {
      setError(c.invalidDate);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ target_exam: trimmedExam.slice(0, 120), exam_date: examDate }),
      });
      if (!res.ok) throw new Error('save failed');
      router.replace(redirectTo);
    } catch {
      setError(c.loadError);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || checkingProfile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" aria-label={c.loading} />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-10 sm:py-14">
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5F3FF] text-brand">
            <Target className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] sm:text-2xl">{c.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{c.subtitle}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">{c.stepExam}</label>
            <TargetExamPickerField
              value={targetExam}
              onChange={setTargetExam}
              language={language}
              chooseExamLabel={c.chooseExam}
              otherExamLabel={c.otherExam}
              otherPlaceholder={c.otherPlaceholder}
              loadErrorLabel={c.examsLoadError}
              searchPlaceholder={c.searchExams}
              noResultsLabel={c.noExamsFound}
              listClassName="max-h-56 sm:max-h-72"
            />
          </div>

          <div>
            <label htmlFor="exam-date" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Calendar className="h-4 w-4 text-brand" aria-hidden />
              {c.stepDate}
            </label>
            <p className="mb-2 text-xs text-slate-500">{c.examDateHint}</p>
            <input
              id="exam-date"
              type="date"
              min={minExamDateInput()}
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-[#DDD6FE]"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSubmit()}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6D28D9] disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                {c.saving}
              </>
            ) : (
              c.continue
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
