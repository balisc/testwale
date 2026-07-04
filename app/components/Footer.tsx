'use client';

import Link from 'next/link';
import { useLanguage } from '../../lib/LanguageContext';

type Lang = 'en' | 'hi';

const COPY: Record<
  Lang,
  {
    brand: string;
    tagline: string;
    practice: string;
    company: string;
    legal: string;
    subjects: string;
    about: string;
    contact: string;
    classic: string;
    terms: string;
    privacy: string;
    disclaimer: string;
    refund: string;
    rights: string;
    signIn: string;
    signUp: string;
  }
> = {
  en: {
    brand: 'QuestionWale',
    tagline: 'Focused practice for better exam preparation.',
    practice: 'Practice',
    company: 'Company',
    legal: 'Legal',
    subjects: 'All Subjects',
    about: 'About Us',
    contact: 'Contact',
    classic: 'Classic Home',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    disclaimer: 'Disclaimer',
    refund: 'Refund Policy',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    rights: 'All rights reserved.',
  },
  hi: {
    brand: 'QuestionWale',
    tagline: 'बेहतर परीक्षा तैयारी के लिए केंद्रित अभ्यास।',
    practice: 'अभ्यास',
    company: 'कंपनी',
    legal: 'कानूनी',
    subjects: 'सभी विषय',
    about: 'हमारे बारे में',
    contact: 'संपर्क',
    classic: 'पुराना होम',
    terms: 'सेवा की शर्तें',
    privacy: 'गोपनीयता नीति',
    signIn: 'साइन इन',
    signUp: 'साइन अप',
    disclaimer: 'अस्वीकरण',
    refund: 'रिफंड नीति',
    rights: 'सर्वाधिकार सुरक्षित।',
  },
};

export default function Footer() {
  const { language } = useLanguage();
  const c = COPY[language as Lang];

  const linkClass =
    'inline-flex min-h-[44px] items-center text-slate-600 transition hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#EDE9FE]';

  return (
    <footer className="mt-auto w-full min-w-0 overflow-x-hidden border-t border-[#DDD6FE] bg-[#EDE9FE] text-slate-700">
      <div className="mx-auto max-w-[1240px] px-2.5 py-8 min-[360px]:px-5 min-[360px]:py-10 md:px-6 md:py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex min-w-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#EDE9FE]"
              aria-label={`${c.brand} home`}
            >
              <span className="truncate text-sm font-extrabold tracking-tight text-[#0F172A] min-[360px]:text-base min-[900px]:text-lg">
                {c.brand}
              </span>
            </Link>
            <p className="mt-3 max-w-xs break-words text-sm leading-relaxed text-slate-600">{c.tagline}</p>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#0F172A]">{c.practice}</h3>
            <nav className="mt-3 flex flex-col gap-1 text-sm" aria-label="Footer practice links">
              <Link href="/subjects" className={linkClass}>
                {c.subjects}
              </Link>
              <Link href="/classic" className={linkClass}>
                {c.classic}
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#0F172A]">{c.company}</h3>
            <nav className="mt-3 flex flex-col gap-1 text-sm" aria-label="Footer company links">
              <Link href="/about_us" className={linkClass}>
                {c.about}
              </Link>
              <Link href="/contact" className={linkClass}>
                {c.contact}
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#0F172A]">{c.legal}</h3>
            <nav className="mt-3 flex flex-col gap-1 text-sm" aria-label="Footer legal links">
              <Link href="/terms" className={linkClass}>
                {c.terms}
              </Link>
              <Link href="/privacy" className={linkClass}>
                {c.privacy}
              </Link>
              <Link href="/disclaimer" className={linkClass}>
                {c.disclaimer}
              </Link>
              <Link href="/refund-policy" className={linkClass}>
                {c.refund}
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-[#DDD6FE] pt-6 min-[360px]:mt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500 min-[360px]:text-sm">
            © {new Date().getFullYear()} {c.brand}. {c.rights}
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/login" className={linkClass}>
              {c.signIn}
            </Link>
            <Link href="/signup" className={linkClass}>
              {c.signUp}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
