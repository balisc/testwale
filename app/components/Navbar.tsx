'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../lib/AuthContext';

type Language = 'en' | 'hi';

const translations: Record<
  Language,
  {
    brand: string;
    tagline: string;
    home: string;
    subjects: string;
    pyq: string;
    signup: string;
    login: string;
    logout: string;
    english: string;
    hindi: string;
    startPractice: string;
    menuLabel: string;
  }
> = {
  en: {
    brand: 'uestionwale',
    tagline: 'Created by student for student',
    home: 'Home',
    subjects: 'Subjects',
    pyq: 'PYQ Series',
    signup: 'Sign Up',
    login: 'Log in',
    logout: 'Log out',
    english: 'English',
    hindi: 'Hindi',
    startPractice: 'Start Practice',
    menuLabel: 'Open menu',
  },
  hi: {
    brand: 'uestionwale',
    tagline: 'Created by student for student',
    home: 'होम',
    subjects: 'विषय',
    pyq: 'पिछले साल के प्रश्न',
    signup: 'साइन अप',
    login: 'लॉग इन',
    logout: 'लॉग आउट',
    english: 'English',
    hindi: 'हिंदी',
    startPractice: 'अभ्यास शुरू करें',
    menuLabel: 'मेनू खोलें',
  },
};

const mobileLinkClass = (active: boolean) =>
  `block rounded-xl px-4 py-3.5 text-base font-semibold transition-colors ${
    active ? 'bg-[#F3E8FF] text-brand' : 'text-slate-900 hover:bg-slate-50 hover:text-brand'
  }`;

export default function Navbar() {
  const { language, setLanguage } = useLanguage();
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;
  const [isOpen, setIsOpen] = useState(false);

  const activeTranslation = translations[language];
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    closeMenu();
  }, [pathname]);

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

  useEffect(() => {
    const updateWidth = () => {
      setIsNarrowScreen(window.innerWidth <= 330);
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const mobileNavLinks = [
    { href: '/', label: activeTranslation.home },
    { href: '/subjects', label: activeTranslation.subjects },
    { href: '/pyq', label: activeTranslation.pyq },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 z-50 h-16 w-full border-b border-slate-200 bg-white/95 px-2 shadow-sm backdrop-blur-sm min-[360px]:px-4 sm:px-5">
        <div className="flex h-full min-w-0 items-center justify-between gap-1 min-[360px]:gap-2">
          <div className="flex min-w-0 shrink items-center gap-2 min-[360px]:gap-3">
            <Link
              href="/"
              aria-label={`${activeTranslation.brand} - ${activeTranslation.tagline}`}
              className="flex min-w-0 max-w-[7.5rem] items-center gap-1 truncate text-sm font-extrabold tracking-tight text-brand transition hover:opacity-80 min-[360px]:max-w-[9rem] min-[360px]:gap-.5 min-[360px]:text-base sm:max-w-[12rem] sm:text-lg"
            >
              <Image
                src="/logo/questionwale_logo.webp"
                alt={`${activeTranslation.brand} logo`}
                width={38}
                height={38}
                priority
                className="h-8 w-8 shrink-0 rounded-full px-.9 min-[360px]:h-9 min-[360px]:w-9"
              />
              <span className="hidden truncate min-[280px]:inline" aria-hidden="true">
                {activeTranslation.brand}
              </span>
            </Link>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-center">
            <div className="hidden items-center gap-8 md:flex">
              <Link
                href="/"
                className={`text-sm font-medium transition-all duration-300 ${isActive('/') ? 'text-brand' : 'text-slate-900 hover:text-slate-700'}`}
              >
                {activeTranslation.home}
              </Link>
              <Link
                href="/subjects"
                className={`text-sm font-medium transition-all duration-300 ${isActive('/subjects') ? 'text-brand' : 'text-slate-900 hover:text-slate-700'}`}
              >
                {activeTranslation.subjects}
              </Link>
            </div>

            <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-slate-100 p-0.5 min-[360px]:gap-1 min-[360px]:p-1 md:hidden">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition min-[360px]:px-3 min-[360px]:py-1 min-[360px]:text-xs ${
                  language === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isNarrowScreen ? 'En' : activeTranslation.english}
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition min-[360px]:px-3 min-[360px]:py-1 min-[360px]:text-xs ${
                  language === 'hi' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isNarrowScreen ? 'Hi' : activeTranslation.hindi}
              </button>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 min-[360px]:gap-2 sm:gap-3">
            {!loading && user ? (
              <>
                <span className="hidden max-w-[8rem] truncate text-sm font-semibold text-slate-700 sm:inline">
                  {user.fullName.split(' ')[0]}
                </span>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="hidden text-sm font-semibold text-slate-700 transition hover:text-brand sm:inline-flex"
                >
                  {activeTranslation.logout}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`hidden text-sm font-semibold transition sm:inline-flex ${
                    isActive('/login') ? 'text-brand' : 'text-slate-700 hover:text-brand'
                  }`}
                >
                  {activeTranslation.login}
                </Link>
                <Link
                  href="/signup"
                  className={`hidden text-sm font-semibold transition sm:inline-flex ${
                    isActive('/signup') ? 'text-brand' : 'text-slate-700 hover:text-brand'
                  }`}
                >
                  {activeTranslation.signup}
                </Link>
              </>
            )}

            <div className="hidden items-center rounded-full bg-slate-100 p-1 md:flex">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  language === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {activeTranslation.english}
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  language === 'hi' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {activeTranslation.hindi}
              </button>
            </div>

            <Link
              href="/subjects"
              className="hidden items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#6D28D9] md:inline-flex"
            >
              {activeTranslation.startPractice}
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen((current) => !current)}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 min-[360px]:h-10 min-[360px]:w-10 md:hidden"
              aria-label={isOpen ? 'Close menu' : activeTranslation.menuLabel}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              <span
                className={`absolute left-1/2 block h-0.5 w-5 -translate-x-1/2 rounded-full bg-slate-900 transition-all duration-300 ease-out ${
                  isOpen ? 'top-[18px] rotate-45' : 'top-[13px]'
                }`}
              />
              <span
                className={`absolute left-1/2 top-[18px] block h-0.5 w-5 -translate-x-1/2 rounded-full bg-slate-900 transition-all duration-300 ease-out ${
                  isOpen ? 'scale-x-0 opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute left-1/2 block h-0.5 w-5 -translate-x-1/2 rounded-full bg-slate-900 transition-all duration-300 ease-out ${
                  isOpen ? 'top-[18px] -rotate-45' : 'top-[23px]'
                }`}
              />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeMenu}
              className="fixed inset-0 top-16 z-40 bg-slate-900/40 backdrop-blur-[2px] md:hidden"
            />

            <motion.div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-0 right-0 top-16 z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)] md:hidden"
            >
              <motion.nav
                initial="closed"
                animate="open"
                variants={{
                  open: { transition: { staggerChildren: 0.05, delayChildren: 0.06 } },
                  closed: {},
                }}
                className="mx-auto flex max-w-lg flex-col gap-1 px-4 py-5 min-[360px]:px-5"
                aria-label="Mobile navigation"
              >
                {mobileNavLinks.map((item) => (
                  <motion.div
                    key={item.href}
                    variants={{
                      closed: { opacity: 0, x: -12 },
                      open: { opacity: 1, x: 0 },
                    }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    <Link href={item.href} onClick={closeMenu} className={mobileLinkClass(isActive(item.href))}>
                      {item.label}
                    </Link>
                  </motion.div>
                ))}

                <motion.div
                  variants={{ closed: { opacity: 0, x: -12 }, open: { opacity: 1, x: 0 } }}
                  className="my-2 h-px bg-slate-100"
                />

                {!loading && user ? (
                  <>
                    <motion.div variants={{ closed: { opacity: 0, x: -12 }, open: { opacity: 1, x: 0 } }}>
                      <p className="px-4 py-2 text-sm font-semibold text-slate-500">
                        {user.fullName.split(' ')[0]}
                      </p>
                    </motion.div>
                    <motion.div variants={{ closed: { opacity: 0, x: -12 }, open: { opacity: 1, x: 0 } }}>
                      <button
                        type="button"
                        onClick={() => {
                          closeMenu();
                          void logout();
                        }}
                        className={mobileLinkClass(false)}
                      >
                        {activeTranslation.logout}
                      </button>
                    </motion.div>
                  </>
                ) : (
                  <>
                    <motion.div variants={{ closed: { opacity: 0, x: -12 }, open: { opacity: 1, x: 0 } }}>
                      <Link href="/login" onClick={closeMenu} className={mobileLinkClass(isActive('/login'))}>
                        {activeTranslation.login}
                      </Link>
                    </motion.div>
                    <motion.div variants={{ closed: { opacity: 0, x: -12 }, open: { opacity: 1, x: 0 } }}>
                      <Link href="/signup" onClick={closeMenu} className={mobileLinkClass(isActive('/signup'))}>
                        {activeTranslation.signup}
                      </Link>
                    </motion.div>
                  </>
                )}

                <motion.div
                  variants={{ closed: { opacity: 0, x: -12 }, open: { opacity: 1, x: 0 } }}
                  className="mt-2 px-1"
                >
                  <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Language</p>
                  <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                        language === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      {activeTranslation.english}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('hi')}
                      className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                        language === 'hi' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      {activeTranslation.hindi}
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={{ closed: { opacity: 0, y: 8 }, open: { opacity: 1, y: 0 } }} className="mt-4 px-1">
                  <Link
                    href="/subjects"
                    onClick={closeMenu}
                    className="flex w-full items-center justify-center rounded-xl bg-brand px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(124,58,237,0.28)] transition hover:bg-[#6D28D9]"
                  >
                    {activeTranslation.startPractice}
                  </Link>
                </motion.div>
              </motion.nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
