'use client';

import { useLanguage } from '../../lib/LanguageContext';

const translations = {
  en: {
    footerText: 'Practice questions, review topics, and ace your exams with Testwale.',
    copyright: '© 2026 Testwale. All rights reserved.',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
  },
  hi: {
    footerText: 'प्रश्नों का अभ्यास करें, विषयों की समीक्षा करें और Testwale के साथ अपनी परीक्षाओं में सफलता प्राप्त करें।',
    copyright: '© 2026 Testwale. सभी अधिकार सुरक्षित हैं।',
    privacy: 'गोपनीयता नीति',
    terms: 'सेवा की शर्तें',
  },
};

export default function Footer() {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:px-6 lg:px-8">
        <div className="space-y-3 text-slate-700">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Testwale</p>
          <p className="max-w-2xl text-base leading-7">{t.footerText}</p>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>{t.copyright}</p>
          <div className="flex flex-wrap gap-4">
            <a href="/privacy" className="transition hover:text-slate-900">
              {t.privacy}
            </a>
            <a href="/terms" className="transition hover:text-slate-900">
              {t.terms}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
