'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

export default function SscChslError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { language } = useLanguage();
  useEffect(() => { console.error('[ssc-chsl-syllabus]', error); }, [error]);
  const copy = language === 'hi'
    ? { eyebrow: 'SSC CHSL पाठ्यक्रम उपलब्ध नहीं है', title: 'यह टियर लोड नहीं हो सका।', body: 'दोबारा प्रयास करें या SSC CHSL तैयारी केंद्र पर लौटें।', retry: 'दोबारा प्रयास करें', hub: 'तैयारी केंद्र खोलें' }
    : { eyebrow: 'SSC CHSL syllabus unavailable', title: 'We could not load this tier.', body: 'Retry the syllabus request or return to the SSC CHSL preparation hub.', retry: 'Retry', hub: 'Open Preparation Hub' };
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-20 text-slate-900">
      <section className="mx-auto max-w-2xl rounded-3xl border border-red-100 bg-white p-6 text-center shadow-sm sm:p-12" role="alert">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-red-600">{copy.eyebrow}</p><h1 className="mt-4 text-3xl font-extrabold">{copy.title}</h1><p className="mt-3 text-sm leading-6 text-slate-600">{copy.body}</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button type="button" onClick={reset} className="min-h-11 rounded-xl bg-violet-700 px-5 font-bold text-white hover:bg-violet-800">{copy.retry}</button><Link href="/ssc-chsl" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 font-bold text-slate-700 hover:bg-slate-50">{copy.hub}</Link></div>
      </section>
    </main>
  );
}
