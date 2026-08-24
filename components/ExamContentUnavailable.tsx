'use client';

import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

type Props = {
  reason: 'not_in_exam' | 'inactive_exam' | 'no_content' | 'subjects_preparing' | 'questions_coming' | 'error';
};

const COPY = {
  en: {
    not_in_exam: 'This content is not included in your selected exam.',
    inactive_exam: 'Your selected exam is no longer active. Please choose it again.',
    no_content: 'No learning content is mapped to this exam yet.',
    subjects_preparing: 'Subjects are being prepared for this exam.',
    questions_coming: 'Questions are being added',
    error: 'We could not load your exam-specific content.',
    dashboard: 'Back to dashboard',
    change: 'Change exam',
    retry: 'Try again',
  },
  hi: {
    not_in_exam: 'यह सामग्री आपकी चुनी हुई परीक्षा में शामिल नहीं है।',
    inactive_exam: 'आपकी चुनी हुई परीक्षा अब सक्रिय नहीं है। कृपया दूसरी परीक्षा चुनें।',
    no_content: 'इस परीक्षा के लिए अभी कोई अध्ययन सामग्री मैप नहीं है।',
    subjects_preparing: 'इस परीक्षा के विषय तैयार किए जा रहे हैं।',
    questions_coming: 'प्रश्न जल्द जोड़े जा रहे हैं',
    error: 'आपकी परीक्षा की सामग्री लोड नहीं हो सकी।',
    dashboard: 'डैशबोर्ड पर जाएँ',
    change: 'परीक्षा बदलें',
    retry: 'फिर प्रयास करें',
  },
};

export default function ExamContentUnavailable({ reason }: Props) {
  const { language } = useLanguage();
  const c = COPY[language];
  return (
    <main className="min-h-[70vh] bg-[#F8FAFC] px-4 py-16">
      <section className="mx-auto max-w-xl rounded-3xl border border-purple-100 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED]">
          <AlertCircle className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="mt-5 text-xl font-bold text-slate-900">{c[reason]}</h1>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          {reason === 'error' ? (
            <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 font-semibold text-white">
              <RefreshCw className="h-4 w-4" aria-hidden />{c.retry}
            </button>
          ) : null}
          <Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-purple-200 px-5 font-semibold text-[#6D28D9]">{c.dashboard}</Link>
          <Link href="/onboarding?edit=1&returnTo=%2Fdashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#7C3AED] px-5 font-semibold text-white">{c.change}</Link>
        </div>
      </section>
    </main>
  );
}
