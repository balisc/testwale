'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import UserAvatar from '@/components/UserAvatar';
import HomeLogo from './HomeLogo';
import { getSscCglLoginHref } from '@/lib/sscCglPreference';
import { getSscChslLoginHref } from '@/lib/sscChsl';

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Subjects', href: '/subjects' },
  { label: 'About Us', href: '/about_us' },
  { label: 'Contact', href: '/contact' },
] as const;

const LANG_OPTIONS = [
  { id: 'en' as const, label: 'English' },
  { id: 'hi' as const, label: 'हिंदी' },
];

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href.includes('#')) return false;
  if (href === '/') return pathname === '/';
  if (href === '/subjects') {
    return pathname === '/subjects' || pathname.startsWith('/subjects/');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function userDisplayName(fullName: string, email: string) {
  const trimmed = fullName.trim();
  if (trimmed) return trimmed;
  return email.split('@')[0] || 'User';
}

function userFirstName(fullName: string, email: string) {
  return userDisplayName(fullName, email).split(' ')[0];
}

function LanguageSelect() {
  const { language, setLanguage } = useLanguage();

  return (
    <label className="relative">
      <span className="sr-only">Language</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as 'en' | 'hi')}
        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#E4E7EC] bg-white px-3 text-[13px] font-semibold text-[#18181B] transition hover:border-[#DDD6FE] hover:bg-[#F5F3FF]"
      >
        {LANG_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

export default function HomeHeader() {
  const { language, setLanguage } = useLanguage();
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const isRevisionPage = Boolean(pathname?.includes('/revision'));

  const authLabels =
    language === 'hi'
      ? { signIn: 'साइन इन', profile: 'प्रोफ़ाइल', logout: 'लॉग आउट' }
      : { signIn: 'Sign In', profile: 'Profile', logout: 'Log out' };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isRevisionPage) return;

    function onScroll() {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      const pct = max > 0 ? (el.scrollTop / max) * 100 : 0;
      setReadProgress(Math.min(100, Math.max(0, pct)));
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [isRevisionPage]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const menuButton = menuButtonRef.current;
    const frame = window.requestAnimationFrame(() => {
      mobileMenuRef.current
        ?.querySelector<HTMLElement>('a[href], button:not([disabled]), select')
        ?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !mobileMenuRef.current) return;
      const focusable = Array.from(
        mobileMenuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), select, [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      menuButton?.focus();
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
  };

  const showSignedIn = !loading && Boolean(user);
  const showSignIn = !loading && !user;
  const signInHref = pathname?.startsWith('/ssc-chsl')
    ? getSscChslLoginHref(pathname)
    : getSscCglLoginHref(pathname);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b bg-white/95 backdrop-blur-sm transition-shadow ${
        scrolled ? 'border-[#E4E7EC] shadow-[0_1px_0_rgba(24,24,27,0.04)]' : 'border-[#E4E7EC]'
      }`}
    >
      <div className="home-container grid h-[72px] min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 max-[359px]:h-14 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-4">
        <HomeLogo
          className="min-w-0 shrink-0 justify-self-start"
          href={user ? '/dashboard' : '/'}
        />

        <nav
          className="hidden min-w-0 items-center justify-center gap-1 justify-self-center lg:flex"
          aria-label="Primary"
        >
          {NAV.map((item) => {
            const href = user && item.href === '/' ? '/dashboard' : item.href;
            const active = user && item.href === '/'
              ? pathname === '/dashboard'
              : isActivePath(pathname, item.href);
            return (
              <Link
                key={item.label}
                href={href}
                className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-[15px] font-medium transition ${
                  active
                    ? 'text-[#5521BF]'
                    : 'text-[#475569] hover:bg-[#F5F3FF] hover:text-[#18181B]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center justify-self-end gap-2 max-[359px]:gap-1 lg:gap-3">
          <div className="hidden items-center gap-2 lg:flex lg:gap-3">
            <LanguageSelect />
            {showSignedIn && user ? (
              <>
                <Link
                  href="/profile"
                  className="inline-flex h-10 max-w-[10rem] shrink-0 items-center gap-2 rounded-xl border border-[#E4E7EC] bg-[#FAFAFC] py-1 pl-1 pr-3 text-[15px] font-semibold text-[#18181B] transition hover:border-[#DDD6FE] hover:bg-[#F5F3FF]"
                  aria-label={`${userDisplayName(user.fullName, user.email)} profile`}
                >
                  <UserAvatar
                    name={user.fullName}
                    id={user.id}
                    email={user.email}
                    imageUrl={user.avatarUrl}
                    className="pointer-events-none h-8 w-8 shrink-0 rounded-full"
                    textClassName="text-xs"
                  />
                  <span className="truncate">{userFirstName(user.fullName, user.email)}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-xl border border-[#E4E7EC] bg-white px-3 text-[15px] font-semibold text-[#18181B] transition hover:border-[#DDD6FE] hover:bg-[#F5F3FF]"
                >
                  {authLabels.logout}
                </button>
              </>
            ) : null}
            {showSignIn ? (
              <Link
                href={signInHref}
                className="inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-xl border border-[#E4E7EC] bg-white px-4 text-[15px] font-semibold text-[#18181B] transition hover:border-[#DDD6FE] hover:bg-[#F5F3FF]"
              >
                {authLabels.signIn}
              </Link>
            ) : null}
            <Link
              href="/subjects"
              className="inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-xl bg-[#6D28D9] px-4 text-[15px] font-semibold text-white transition hover:bg-[#5B21B6] active:bg-[#4C1D95]"
            >
              Browse Subjects
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2 max-[359px]:gap-1 lg:hidden">
            <Link
              href="/subjects"
              className="inline-flex h-10 shrink-0 items-center rounded-xl bg-[#6D28D9] px-3 text-[13px] font-semibold text-white max-[279px]:hidden"
            >
              Browse <span className="sr-only">published subjects</span>
            </Link>
            <button
              ref={menuButtonRef}
              type="button"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="home-mobile-menu"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E4E7EC] max-[359px]:h-9 max-[359px]:w-9"
            >
              <span className="sr-only">Menu</span>
              <div className="flex w-4 flex-col gap-1">
                <span className={`h-0.5 rounded bg-[#18181B] transition ${open ? 'translate-y-1.5 rotate-45' : ''}`} />
                <span className={`h-0.5 rounded bg-[#18181B] transition ${open ? 'opacity-0' : ''}`} />
                <span className={`h-0.5 rounded bg-[#18181B] transition ${open ? '-translate-y-1.5 -rotate-45' : ''}`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div
          ref={mobileMenuRef}
          id="home-mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className="border-t border-[#E4E7EC] bg-white lg:hidden"
        >
          <nav className="home-container flex flex-col gap-1 py-4" aria-label="Mobile">
            {NAV.map((item) => {
              const href = user && item.href === '/' ? '/dashboard' : item.href;
              return <Link
                key={item.label}
                href={href}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-3 py-3 text-[15px] font-medium hover:bg-[#F5F3FF] ${
                  (user && item.href === '/' ? pathname === '/dashboard' : isActivePath(pathname, item.href))
                    ? 'text-[#5521BF]'
                    : 'text-[#18181B]'
                }`}
              >
                {item.label}
              </Link>;
            })}

            {showSignedIn && user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="mt-2 flex items-center gap-3 rounded-xl bg-[#FAFAFC] px-3 py-3 transition hover:bg-[#F5F3FF]"
                  aria-label={`${userDisplayName(user.fullName, user.email)} profile`}
                >
                  <UserAvatar
                    name={user.fullName}
                    id={user.id}
                    email={user.email}
                    imageUrl={user.avatarUrl}
                    className="pointer-events-none h-10 w-10 shrink-0 rounded-full"
                    textClassName="text-sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#18181B]">
                      {userDisplayName(user.fullName, user.email)}
                    </p>
                    <p className="truncate text-xs text-[#475569]">{user.email}</p>
                  </div>
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-3 py-3 text-[15px] font-medium hover:bg-[#F5F3FF] ${
                    isActivePath(pathname, '/profile') ? 'text-[#5521BF]' : 'text-[#18181B]'
                  }`}
                >
                  {authLabels.profile}
                </Link>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="rounded-xl px-3 py-3 text-left text-[15px] font-semibold text-[#18181B] hover:bg-[#F5F3FF]"
                >
                  {authLabels.logout}
                </button>
              </>
            ) : null}
            {showSignIn ? (
              <Link
                href={signInHref}
                onClick={() => setOpen(false)}
                className="mt-2 rounded-xl border border-[#E4E7EC] px-3 py-3 text-center text-[15px] font-semibold"
              >
                {authLabels.signIn}
              </Link>
            ) : null}

            <div className="mt-3 border-t border-[#F2F4F7] pt-3">
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-[#475569]">
                Language
              </p>
              <div className="flex items-center gap-1 rounded-xl border border-[#E4E7EC] bg-[#FAFAFC] p-1">
                {LANG_OPTIONS.map((option) => {
                  const selected = option.id === language;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setLanguage(option.id)}
                      className={`min-h-[44px] flex-1 rounded-lg px-3 text-sm font-semibold transition ${
                        selected
                          ? 'bg-white text-[#5521BF] shadow-sm'
                          : 'text-[#475569] hover:text-[#18181B]'
                      }`}
                      aria-pressed={selected}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>
      ) : null}

      {isRevisionPage ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-[#E8E2F8] print:hidden"
          role="progressbar"
          aria-valuenow={Math.round(readProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Page read progress"
        >
          <div
            className="h-full bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] transition-[width] duration-100 ease-out"
            style={{ width: `${readProgress}%` }}
          />
        </div>
      ) : null}
    </header>
  );
}
