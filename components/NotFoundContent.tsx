'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';

type NotFoundContentProps = {
  /** When true, renders a minimal document shell for proxy HTML responses. */
  standalone?: boolean;
};

const COPY = {
  en: {
    title: 'Page not found',
    body: 'The page you requested is not available. Return home or browse subjects to continue practicing.',
    home: 'Go Home',
    subjects: 'Browse Subjects',
    back: 'Go back',
  },
  hi: {
    title: 'पेज नहीं मिला',
    body: 'आपका अनुरोधित पेज उपलब्ध नहीं है। होम पर लौटें या विषयों को ब्राउज़ करके अभ्यास जारी रखें।',
    home: 'होम पर जाएँ',
    subjects: 'विषय देखें',
    back: 'वापस जाएँ',
  },
} as const;

export default function NotFoundContent({ standalone = false }: NotFoundContentProps) {
  const { language } = useLanguage();
  const c = COPY[language];

  const inner = (
    <main className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-slate-900 px-4">
      <div className="max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">QuestionWale</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">{c.title}</h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">{c.body}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {c.home}
          </Link>
          <Link
            href="/subjects"
            className="inline-flex min-h-[44px] items-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand/40 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {c.subjects}
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex min-h-[44px] items-center rounded-full px-4 py-3 text-sm font-semibold text-slate-600 transition hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {c.back}
          </button>
        </div>
      </div>
    </main>
  );

  if (standalone) {
    return (
      <html lang={language}>
        <body className="m-0 min-h-screen bg-[#F8FAFC] font-sans antialiased">{inner}</body>
      </html>
    );
  }

  return inner;
}
