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
    <footer className="w-full px-4 py-12 bg-brand text-white">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold">Testwale</h3>
          <p className="mt-3 text-sm text-slate-100 inline-flex items-center gap-2">
            <Heart className="w-4 h-4 text-white" />
            {t.tagline}
          </p>
        </div>

        <p className="text-sm text-slate-100/90">© 2026 Testwale. All rights reserved.</p>
      </div>
    </footer>
  );
}
