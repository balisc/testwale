'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import UserAvatar from '@/components/UserAvatar';
import QuestionWaleLogoMark from '@/components/QuestionWaleLogoMark';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../lib/AuthContext';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';

type Language = 'en' | 'hi';

const translations: Record<
  Language,
  {
    brand: string;
    home: string;
    subjects: string;
    aboutUs: string;
    contact: string;
    signIn: string;
    logout: string;
    progress: string;
    english: string;
    hindi: string;
    menuLabel: string;
    closeMenuLabel: string;
  }
> = {
  en: {
    brand: 'QuestionWale',
    home: 'Home',
    subjects: 'Subjects',
    aboutUs: 'About Us',
    contact: 'Contact',
    signIn: 'Sign In',
    logout: 'Log out',
    progress: 'Profile',
    english: 'English',
    hindi: 'हिंदी',
    menuLabel: 'Open menu',
    closeMenuLabel: 'Close menu',
  },
  hi: {
    brand: 'QuestionWale',
    home: 'होम',
    subjects: 'विषय',
    aboutUs: 'हमारे बारे में',
    contact: 'संपर्क',
    signIn: 'साइन इन',
    logout: 'लॉग आउट',
    progress: 'प्रोफ़ाइल',
    english: 'English',
    hindi: 'हिंदी',
    menuLabel: 'मेनू खोलें',
    closeMenuLabel: 'मेनू बंद करें',
  },
};

const DESKTOP_NAV_LINKS = [
  { href: '/', labelKey: 'home' as const },
  { href: '/subjects', labelKey: 'subjects' as const },
  { href: '/about_us', labelKey: 'aboutUs' as const },
  { href: '/contact', labelKey: 'contact' as const },
];

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2';

const desktopNavLinkClass = (active: boolean) =>
  `relative inline-flex items-center whitespace-nowrap px-1 py-2 text-sm font-medium leading-none transition-colors ${focusRing} ${
    active ? 'text-brand' : 'text-[#0F172A] hover:text-brand'
  }`;

const desktopAuthButtonClass = `inline-flex items-center whitespace-nowrap px-1 py-2 text-sm font-semibold leading-none transition-colors ${focusRing} rounded-lg text-slate-700 hover:text-brand`;

const mobileLinkClass = (active: boolean) =>
  `block min-h-[44px] rounded-xl px-4 py-3 text-base font-semibold transition-colors ${focusRing} ${
    active ? 'bg-[#F3E8FF] text-brand' : 'text-slate-900 hover:bg-slate-50 hover:text-brand'
  }`;

export default function Navbar() {
  const { language, setLanguage } = useLanguage();
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);

  const t = translations[language];
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/profile') return pathname.startsWith('/profile');
    if (href === '/dashboard') return pathname.startsWith('/dashboard');
    if (href === '/subjects') {
      const segment = pathname.split('/').filter(Boolean)[0];
      const subjectSlugs = new Set([
        'subjects',
        'polity',
        'history',
        'science',
        'geography',
        'economics',
        'math',
        'reasoning',
        'current-affairs',
        'general-knowledge',
      ]);
      return subjectSlugs.has(segment ?? '');
    }
    return pathname.startsWith(href);
  };

  const closeMenu = () => setIsOpen(false);

  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    if (pathname === '/') {
      router.refresh();
    }
  };

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 900) setIsOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const navLinks = DESKTOP_NAV_LINKS.map((item) => ({
    href: item.href,
    label: t[item.labelKey],
  }));

  const authNavLinks = user
    ? [{ href: '/profile', label: t.progress }]
    : [];

  const LanguageToggle = ({ className = '' }: { className?: string }) => (
    <div className={`flex shrink-0 items-center gap-1.5 text-sm font-medium ${className}`}>
      <button
        type="button"
        onClick={() => changeLanguage('en')}
        className={`min-h-[44px] min-w-[44px] px-1 transition ${focusRing} ${
          language === 'en' ? 'font-semibold text-brand' : 'text-slate-600 hover:text-[#0F172A]'
        }`}
        aria-pressed={language === 'en'}
      >
        {t.english}
      </button>
      <span className="text-slate-300" aria-hidden="true">
        |
      </span>
      <button
        type="button"
        onClick={() => changeLanguage('hi')}
        className={`min-h-[44px] min-w-[44px] px-1 transition ${focusRing} ${
          language === 'hi' ? 'font-semibold text-brand' : 'text-slate-600 hover:text-[#0F172A]'
        }`}
        aria-pressed={language === 'hi'}
      >
        {t.hindi}
      </button>
    </div>
  );

  return (
    <>
      <header className="fixed top-0 left-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <nav
          className="mx-auto flex h-16 max-w-[1240px] items-center gap-2 px-2.5 min-[360px]:gap-3 min-[360px]:px-5 min-[900px]:grid min-[900px]:grid-cols-[auto_1fr_auto] min-[900px]:gap-6 min-[900px]:px-6"
          aria-label="Main navigation"
        >
          <Link
            href="/"
            className={`flex min-w-0 shrink-0 items-center gap-2 ${focusRing} rounded-lg`}
            aria-label={`${t.brand} home`}
          >
            <QuestionWaleLogoMark size={36} />
            <span className="truncate text-sm font-extrabold tracking-tight text-[#0F172A] min-[360px]:text-base min-[900px]:text-lg">
              {t.brand}
            </span>
          </Link>

          <div className="hidden min-w-0 items-center justify-center gap-6 min-[900px]:flex min-[900px]:gap-8">
            {navLinks.map((item) => (
              <Link key={item.href} href={item.href} className={desktopNavLinkClass(isActive(item.href))}>
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute -bottom-0.5 left-0 right-0 mx-auto h-0.5 w-full max-w-[2.5rem] rounded-full bg-brand" />
                )}
              </Link>
            ))}
            {authNavLinks.map((item) => (
              <Link key={item.href} href={item.href} className={desktopNavLinkClass(isActive(item.href))}>
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute -bottom-0.5 left-0 right-0 mx-auto h-0.5 w-full max-w-[2.5rem] rounded-full bg-brand" />
                )}
              </Link>
            ))}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 min-[360px]:gap-2 min-[900px]:ml-0 min-[900px]:gap-4">
            <LanguageToggle className="hidden min-[900px]:flex" />

            {!loading && user ? (
              <div className="hidden items-center gap-3 min-[900px]:flex">
                <Link
                  href="/profile"
                  className={`inline-flex items-center gap-2 rounded-full bg-slate-50 py-1 pl-1 pr-3 text-sm font-semibold leading-none text-slate-700 transition hover:bg-[#FAF5FF] hover:text-brand ${focusRing}`}
                  aria-label={`${user.fullName} profile`}
                >
                  <UserAvatar
                    name={user.fullName}
                    id={user.id}
                    email={user.email}
                    className="pointer-events-none h-8 w-8 rounded-full"
                    textClassName="text-xs"
                  />
                  <span className="max-w-[7rem] truncate">{user.fullName.split(' ')[0]}</span>
                </Link>
                <button type="button" onClick={() => void logout()} className={desktopAuthButtonClass}>
                  {t.logout}
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className={`hidden min-h-[44px] items-center justify-center whitespace-nowrap rounded-full border-2 border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-[#FAF5FF] min-[360px]:px-5 min-[900px]:inline-flex ${focusRing}`}
              >
                {t.signIn}
              </Link>
            )}

            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 transition hover:bg-slate-200 min-[900px]:hidden ${focusRing}`}
              aria-label={isOpen ? t.closeMenuLabel : t.menuLabel}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              <span
                className={`absolute left-1/2 block h-0.5 w-5 -translate-x-1/2 rounded-full bg-slate-900 transition-all duration-300 ${
                  isOpen ? 'top-[22px] rotate-45' : 'top-[15px]'
                }`}
              />
              <span
                className={`absolute left-1/2 top-[22px] block h-0.5 w-5 -translate-x-1/2 rounded-full bg-slate-900 transition-all duration-300 ${
                  isOpen ? 'scale-x-0 opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute left-1/2 block h-0.5 w-5 -translate-x-1/2 rounded-full bg-slate-900 transition-all duration-300 ${
                  isOpen ? 'top-[22px] -rotate-45' : 'top-[29px]'
                }`}
              />
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              type="button"
              aria-label={t.closeMenuLabel}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              onClick={closeMenu}
              className="fixed inset-0 top-16 z-40 bg-slate-900/40 backdrop-blur-[2px] min-[900px]:hidden"
            />

            <motion.div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
              className="fixed left-0 right-0 top-16 z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-slate-200 bg-white shadow-lg min-[900px]:hidden"
            >
              <nav className="mx-auto flex max-w-lg flex-col gap-1 px-2.5 py-5 min-[360px]:px-5" aria-label="Mobile navigation">
                {navLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className={mobileLinkClass(isActive(item.href))}
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="my-2 h-px bg-slate-100" />

                {!loading && user ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={closeMenu}
                      className={`flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 transition hover:bg-[#FAF5FF] ${focusRing}`}
                      aria-label={`${user.fullName} profile`}
                    >
                      <UserAvatar
                        name={user.fullName}
                        id={user.id}
                        email={user.email}
                        className="pointer-events-none h-10 w-10 shrink-0 rounded-full"
                        textClassName="text-sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{user.fullName}</p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                      </div>
                    </Link>
                    <Link
                      href="/profile"
                      onClick={closeMenu}
                      className={mobileLinkClass(isActive('/profile'))}
                    >
                      {t.progress}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        void logout();
                      }}
                      className={mobileLinkClass(false)}
                    >
                      {t.logout}
                    </button>
                  </>
                ) : (
                  <Link href="/login" onClick={closeMenu} className={mobileLinkClass(isActive('/login'))}>
                    {t.signIn}
                  </Link>
                )}

                <div className="mt-3 px-1">
                  <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Language</p>
                  <LanguageToggle className="justify-center rounded-xl bg-slate-50 px-3 py-1" />
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
