'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Loader2, Target } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { minExamDateInput, validateExamDateInput } from '@/lib/examCountdown';
import { needsProfileOnboarding } from '@/lib/profileOnboarding';
import { pickCatalogText } from '@/lib/useCatalogText';
import { sortExamsForDisplay } from '@/lib/polity';
import type { Exam } from '@/types/polity';
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
    loadError: 'Could not load exams. Please refresh.',
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
    loadError: 'परीक्षाएँ लोड नहीं हो सकीं। पृष्ठ रीफ़्रेश करें।',
    invalidDate: 'कृपया मान्य परीक्षा तारीख चुनें।',
    pickExam: 'कृपया अपनी लक्ष्य परीक्षा चुनें या लिखें।',
    loading: 'लोड हो रहा है…',
  },
};

type OnboardingClientProps = {
  exams: Exam[];
};

export default function OnboardingClient({ exams: initialExams }: OnboardingClientProps) {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const c = COPY[language];

  const redirectTo = getSafeRedirectPath(searchParams.get('redirect'), '/profile');

  const sortedExams = useMemo(() => sortExamsForDisplay(initialExams), [initialExams]);

  const [exams, setExams] = useState(initialExams);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [isOther, setIsOther] = useState(false);
  const [otherExamName, setOtherExamName] = useState('');
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
            setIsOther(true);
            setOtherExamName(data.profile.target_exam.trim());
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

  useEffect(() => {
    if (initialExams.length > 0) return;
    void fetch('/api/catalog/exams')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.exams) setExams(json.exams as Exam[]);
      })
      .catch(() => undefined);
  }, [initialExams.length]);

  const resolveTargetExam = useCallback((): string | null => {
    if (isOther) {
      const name = otherExamName.trim();
      return name.length > 0 ? name.slice(0, 120) : null;
    }
    if (!selectedCode) return null;
    const exam = sortedExams.find((item) => item.code === selectedCode);
    if (!exam) return selectedCode;
    return pickCatalogText(exam.title, language) || exam.code;
  }, [isOther, otherExamName, selectedCode, sortedExams, language]);

  const handleSubmit = async () => {
    setError(null);
    const targetExam = resolveTargetExam();
    if (!targetExam) {
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
        body: JSON.stringify({ target_exam: targetExam, exam_date: examDate }),
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
            <p className="mb-3 text-xs text-slate-500">{c.chooseExam}</p>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-[#E2E8F0] p-2">
              {sortExamsForDisplay(exams).map((exam) => {
                const label = pickCatalogText(exam.title, language) || exam.code;
                const active = !isOther && selectedCode === exam.code;
                return (
                  <button
                    key={exam.id}
                    type="button"
                    onClick={() => {
                      setIsOther(false);
                      setSelectedCode(exam.code);
                      setOtherExamName('');
                    }}
                    className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                      active
                        ? 'border-brand bg-[#F5F3FF] font-medium text-brand'
                        : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOther(true);
                setSelectedCode(null);
              }}
              className={`mt-2 w-full rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                isOther ? 'border-brand bg-[#F5F3FF] font-medium text-brand' : 'border-[#E2E8F0] hover:bg-slate-50'
              }`}
            >
              {c.otherExam}
            </button>
            {isOther ? (
              <input
                type="text"
                value={otherExamName}
                onChange={(e) => setOtherExamName(e.target.value)}
                placeholder={c.otherPlaceholder}
                maxLength={120}
                className="mt-3 w-full rounded-xl border border-[#E2E8F0] px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-[#DDD6FE]"
              />
            ) : null}
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
