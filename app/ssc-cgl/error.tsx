'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

export default function SscCglError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { language } = useLanguage();
  useEffect(() => {
    console.error('[ssc-cgl-syllabus]', error);
  }, [error]);
  const copy = language === 'hi'
    ? {
        eyebrow: 'SSC CGL पाठ्यक्रम उपलब्ध नहीं है',
        title: 'यह चरण लोड नहीं हो सका।',
        body: 'दोबारा प्रयास करें या SSC CGL तैयारी केंद्र पर लौटें।',
        retry: 'दोबारा प्रयास करें',
        hub: 'तैयारी केंद्र खोलें',
      }
    : {
        eyebrow: 'SSC CGL syllabus unavailable',
        title: 'We could not load this stage.',
        body: 'Retry the syllabus request or return to the SSC CGL preparation hub.',
        retry: 'Retry',
        hub: 'Open Preparation Hub',
      };

  return (
    <main className="min-h-screen w-full min-w-0 max-w-full bg-[#F8FAFC] px-4 py-20 text-slate-900">
      <section className="mx-auto w-full min-w-0 max-w-2xl rounded-3xl border border-red-100 bg-white p-6 text-center shadow-sm sm:p-12" role="alert">
        <p className="break-words text-sm font-bold uppercase tracking-[0.12em] text-red-600">{copy.eyebrow}</p>
        <h1 className="mt-4 break-words text-3xl font-extrabold">{copy.title}</h1>
        <p className="mt-3 break-words text-sm leading-6 text-slate-600">{copy.body}</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="min-h-11 rounded-xl bg-violet-700 px-5 font-bold text-white hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2">{copy.retry}</button>
          <Link href="/ssc-cgl" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2">{copy.hub}</Link>
        </div>
      </section>
    </main>
  );
}
