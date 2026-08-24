'use client';

import { RotateCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';

export default function SscCglPreferenceLoadError() {
  const router = useRouter();
  const { language } = useLanguage();
  const copy = language === 'hi'
    ? {
        title: 'आपकी SSC CGL पसंद लोड नहीं हो सकी',
        body: 'कुछ समय बाद फिर कोशिश करें। आपकी पहले से सहेजी गई पसंद बदली नहीं गई है।',
        retry: 'फिर कोशिश करें',
      }
    : {
        title: 'We could not load your SSC CGL preference',
        body: 'Please try again. Your existing preference has not been changed.',
        retry: 'Try again',
      };

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-16 text-slate-900 sm:px-6">
      <section className="mx-auto w-full max-w-lg rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm sm:p-8" role="alert">
        <h1 className="break-words text-xl font-extrabold text-slate-950 sm:text-2xl">{copy.title}</h1>
        <p className="mt-3 break-words text-sm leading-6 text-slate-600">{copy.body}</p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="mt-6 inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-bold text-white hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
        >
          <RotateCw className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="break-words">{copy.retry}</span>
        </button>
      </section>
    </main>
  );
}
