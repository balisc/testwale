'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';

const translations = {
  en: { tagline: 'Created by student for students' },
  hi: { tagline: 'Created by student for students' },
};

export default function Footer() {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <footer className="w-full min-w-0 overflow-x-hidden border-t border-slate-200 bg-white px-2 py-8 text-slate-900 shadow-sm min-[360px]:px-4 min-[360px]:py-12">
      <div className="mx-auto flex max-w-6xl min-w-0 flex-col gap-6 min-[360px]:gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3 min-[360px]:space-y-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="break-words text-xl font-extrabold tracking-tight min-[360px]:text-3xl">Questionwale</span>
          </div>
          <div className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-3xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700 shadow-sm ring-1 ring-red-100 min-[360px]:gap-3 min-[360px]:px-4 min-[360px]:py-3 min-[360px]:text-sm">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 min-[360px]:h-8 min-[360px]:w-8">
              <Heart className="h-4 w-4" />
            </span>
            <span className="min-w-0 break-words">{t.tagline}</span>
          </div>
        </div>

        <nav aria-label="Footer navigation" className="grid min-w-0 gap-2 text-xs text-slate-600 min-[360px]:gap-3 min-[360px]:text-sm sm:grid-cols-2 sm:gap-x-8">
          <Link href="/subjects" className="hover:text-slate-900">Subjects</Link>
          <Link href="/history" className="hover:text-slate-900">History MCQs</Link>
          <Link href="/general-knowledge" className="hover:text-slate-900">General Knowledge</Link>
          <Link href="/about_us" className="hover:text-slate-900">About Us</Link>
          <Link href="/contact" className="hover:text-slate-900">Contact</Link>
        </nav>

        <p className="min-w-0 break-words text-xs text-slate-500 min-[360px]:text-sm">© 2026 Questionwale. All rights reserved.</p>
      </div>
    </footer>
  );
}
