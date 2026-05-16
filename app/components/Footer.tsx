'use client';

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
    <footer className="w-full px-4 py-12 bg-white border-t border-gray-200">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Testwale</h3>
          <p className="mt-2 text-sm text-slate-600 max-w-xl">
            Practice previous year questions and topic-wise mock tests for competitive exams.
          </p>
          <p className="mt-4 text-sm text-slate-500">© 2026 Testwale. All rights reserved.</p>
        </div>

        <div className="flex items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-6 py-3">
            <Heart className="h-5 w-5 text-red-500 fill-red-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-800">{t.tagline}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
