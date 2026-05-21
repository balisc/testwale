'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../../lib/LanguageContext';

type Language = 'en' | 'hi';

const translations: Record<Language, { brand: string; tagline: string; home: string; subjects: string; pyq: string; english: string; hindi: string }> = {
  en: {
    brand: 'Questionwale',
    tagline: 'Created by student for student',
    home: 'Home',
    subjects: 'Subjects',
    pyq: 'PYQ Series',
    english: 'English',
    hindi: 'Hindi',
  },
  hi: {
    brand: 'Questionwale',
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
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;
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
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);

  useEffect(() => {
    const updateWidth = () => {
      setIsNarrowScreen(window.innerWidth <= 330);
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <nav className="fixed top-0 left-0 w-full h-16 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6">
      <div className="flex h-full items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            aria-label={`${activeTranslation.brand} - ${activeTranslation.tagline}`}
            className="max-w-[9rem] sm:max-w-[12rem] truncate text-base sm:text-lg font-extrabold tracking-tight text-purple-600 hover:opacity-80 transition"
          >
            {activeTranslation.brand}
          </Link>
        </div>

        <div className="flex flex-1 min-w-0 items-center justify-center">
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className={`text-sm font-medium transition ${isActive('/') ? 'text-brand' : 'text-slate-900 hover:text-slate-700'}`}>
              {activeTranslation.home}
            </Link>
            <Link href="/subjects" className={`text-sm font-medium transition ${isActive('/subjects') ? 'text-brand' : 'text-slate-900 hover:text-slate-700'}`}>
              {activeTranslation.subjects}
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-1 rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                language === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isNarrowScreen ? 'En' : activeTranslation.english}
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                language === 'hi' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isNarrowScreen ? 'Hi' : activeTranslation.hindi}
            </button>
          </div>
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

          <Link
            href="/subjects"
            className="hidden md:inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#6D28D9]"
          >
            Start Practice
          </Link>

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

        </div>
      )}
    </nav>
  );
}
