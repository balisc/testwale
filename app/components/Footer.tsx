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
    <footer className="w-full px-4 py-12 bg-white text-slate-900 border-t border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-extrabold tracking-tight">Questionwale</span>
          </div>
          <div className="inline-flex items-center gap-3 rounded-3xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm ring-1 ring-red-100">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Heart className="w-4 h-4" />
            </span>
            <span>{t.tagline}</span>
          </div>
        </div>

        <nav aria-label="Footer navigation" className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 sm:gap-x-8">
          <Link href="/subjects" className="hover:text-slate-900">Subjects</Link>
          <Link href="/history" className="hover:text-slate-900">History MCQs</Link>
          <Link href="/general-knowledge" className="hover:text-slate-900">General Knowledge</Link>
          <Link href="/about_us" className="hover:text-slate-900">About Us</Link>
          <Link href="/contact" className="hover:text-slate-900">Contact</Link>
        </nav>

        <p className="text-sm text-slate-500">© 2026 Questionwale. All rights reserved.</p>
      </div>
    </footer>
  );
}
