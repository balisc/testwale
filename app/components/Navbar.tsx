'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../lib/LanguageContext';

type Language = 'en' | 'hi';

const translations: Record<Language, { brand: string; tagline: string; home: string; subjects: string; pyq: string; english: string; hindi: string }> = {
  en: {
    brand: 'Testwale',
    tagline: 'Created by student for student',
    home: 'Home',
    subjects: 'Subjects',
    pyq: 'PYQ Series',
    english: 'English',
    hindi: 'Hindi',
  },
  hi: {
    brand: 'Testwale',
    tagline: 'Created by student for student',
    home: 'होम',
    subjects: 'विषय',
    pyq: 'पिछले साल के प्रश्न',
    english: 'English',
    hindi: 'हिंदी',
  },
};

export default function Navbar() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  const activeTranslation = translations[language];

  return (
    <nav className="fixed top-0 left-0 w-full h-16 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-6">
      <Link
        href="/"
        aria-label={`${activeTranslation.brand} - ${activeTranslation.tagline}`}
        className="text-lg font-bold tracking-tight text-slate-900 hover:opacity-80 transition"
      >
        {activeTranslation.brand}
      </Link>

      <div className="hidden md:flex items-center gap-8">
        <Link href="/" className="text-sm font-medium text-slate-900 hover:text-slate-700 transition">
          {activeTranslation.home}
        </Link>
        <Link href="/subjects" className="text-sm font-medium text-slate-900 hover:text-slate-700 transition">
          {activeTranslation.subjects}
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
              language === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {activeTranslation.english}
          </button>
          <button
            type="button"
            onClick={() => setLanguage('hi')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
              language === 'hi' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {activeTranslation.hindi}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          aria-label="Toggle menu"
        >
          <div className="space-y-1.5">
            <span className={`block w-6 h-0.5 bg-black transition-all ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-black transition-all ${isOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-black transition-all ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </div>
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-200 shadow-xl py-6 px-6 z-40">
          <div className="flex flex-col gap-5">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="text-lg font-bold text-slate-900 hover:text-slate-700 transition"
            >
              {activeTranslation.home}
            </Link>
            <Link
              href="/subjects"
              onClick={() => setIsOpen(false)}
              className="text-lg font-bold text-slate-900 hover:text-slate-700 transition"
            >
              {activeTranslation.subjects}
            </Link>
            <Link
              href="/pyq"
              onClick={() => setIsOpen(false)}
              className="text-lg font-bold text-slate-900 hover:text-slate-700 transition"
            >
              {activeTranslation.pyq}
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                language === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {activeTranslation.english}
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                language === 'hi' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {activeTranslation.hindi}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
