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
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-extrabold tracking-tight">Testwale</span>
          </div>
          <div className="inline-flex items-center gap-3 rounded-3xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm ring-1 ring-red-100">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Heart className="w-4 h-4" />
            </span>
            <span>{t.tagline}</span>
          </div>
        </div>

        <p className="text-sm text-slate-500">© 2026 Testwale. All rights reserved.</p>
      </div>
    </footer>
  );
}
