'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import HomeLogo from './HomeLogo';

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Subjects', href: '/#subjects' },
  { label: 'About Us', href: '/about_us' },
  { label: 'Contact', href: '/contact' },
] as const;

const LANG_OPTIONS = [
  { id: 'en' as const, label: 'English' },
  { id: 'hi' as const, label: 'हिंदी' },
];

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  // Hash links (e.g. /#subjects) are not route-active highlights
  if (href.includes('#')) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function LanguageDropdown() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = LANG_OPTIONS.find((o) => o.id === language) ?? LANG_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Language"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#E4E7EC] bg-white px-3 text-[13px] font-semibold text-[#18181B] transition hover:border-[#DDD6FE] hover:bg-[#F5F3FF]"
      >
        <span>{current.label}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
          className={`text-[#475569] transition ${open ? 'rotate-180' : ''}`}
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 z-[60] mt-1.5 min-w-[148px] overflow-hidden rounded-xl border border-[#E4E7EC] bg-white py-1 shadow-[0_12px_32px_-16px_rgba(24,24,27,0.35)]"
        >
          {LANG_OPTIONS.map((option) => {
            const selected = option.id === language;
            return (
              <li key={option.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    setLanguage(option.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm font-medium transition hover:bg-[#F5F3FF] ${
                    selected ? 'text-[#5521BF]' : 'text-[#344054]'
                  }`}
                >
                  {option.label}
                  {selected ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path
                        d="M3 7.2L5.8 10L11 4"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export default function HomeHeader() {
  const { language, setLanguage } = useLanguage();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const isRevisionPage = Boolean(pathname?.includes('/revision'));

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
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b bg-white/95 backdrop-blur-sm transition-shadow ${
        scrolled ? 'border-[#E4E7EC] shadow-[0_1px_0_rgba(24,24,27,0.04)]' : 'border-[#E4E7EC]'
      }`}
    >
      <div className="home-container flex h-[72px] min-w-0 items-center justify-between gap-2 max-[359px]:h-14">
        <HomeLogo className="min-w-0 flex-1" />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[15px] font-medium transition ${
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

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageDropdown />
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-xl border border-[#E4E7EC] bg-white px-4 text-[15px] font-semibold text-[#18181B] transition hover:border-[#DDD6FE] hover:bg-[#F5F3FF]"
          >
            Sign In
          </Link>
          <Link
            href="/subjects/indian-polity"
            className="inline-flex h-10 items-center rounded-xl bg-[#6D28D9] px-4 text-[15px] font-semibold text-white transition hover:bg-[#5B21B6] active:bg-[#4C1D95]"
          >
            Start Practicing
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2 max-[359px]:gap-1 lg:hidden">
          <Link
            href="/subjects/indian-polity"
            className="inline-flex h-10 items-center rounded-xl bg-[#6D28D9] px-3 text-[13px] font-semibold text-white max-[279px]:hidden"
          >
            Start
          </Link>
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E4E7EC] max-[359px]:h-9 max-[359px]:w-9"
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

      {open ? (
        <div className="border-t border-[#E4E7EC] bg-white lg:hidden">
          <nav className="home-container flex flex-col gap-1 py-4" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-3 py-3 text-[15px] font-medium hover:bg-[#F5F3FF] ${
                  isActivePath(pathname, item.href) ? 'text-[#5521BF]' : 'text-[#18181B]'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-xl border border-[#E4E7EC] px-3 py-3 text-center text-[15px] font-semibold"
            >
              Sign In
            </Link>

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
