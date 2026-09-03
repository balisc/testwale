'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  isCurrentExamPath,
  isExamNavigationPath,
  type PublicExamNavigationEntry,
} from '@/lib/publicExamDirectory';

type SharedProps = {
  exams: readonly PublicExamNavigationEntry[];
  language: 'en' | 'hi';
  pathname: string | null;
};

function examTitle(exam: PublicExamNavigationEntry, language: 'en' | 'hi') {
  return language === 'hi' ? exam.publicTitle.hi ?? exam.publicTitle.en : exam.publicTitle.en;
}

export function DesktopExamNavigation({ exams, language, pathname }: SharedProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const active = isExamNavigationPath(pathname, exams);

  function closeMenu(returnFocus = false) {
    setOpen(false);
    if (returnFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) closeMenu();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeMenu(true);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        if (!containerRef.current?.contains(document.activeElement)) closeMenu();
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) closeMenu();
      }}
    >
      <Link
        href="/exams"
        aria-current={pathname === '/exams' ? 'page' : undefined}
        className={`inline-flex items-center whitespace-nowrap rounded-l-lg py-2 pl-3 pr-1 text-[15px] font-medium transition ${
          active ? 'text-[#5521BF]' : 'text-[#475569] hover:bg-[#F5F3FF] hover:text-[#18181B]'
        }`}
      >
        Exams
      </Link>
      <button
        ref={triggerRef}
        type="button"
        aria-label={open ? 'Hide available exams' : 'Show available exams'}
        aria-expanded={open}
        aria-controls="desktop-exams-navigation"
        onFocus={() => setOpen(true)}
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex h-10 w-8 items-center justify-center rounded-r-lg transition ${
          active ? 'text-[#5521BF]' : 'text-[#475569] hover:bg-[#F5F3FF] hover:text-[#18181B]'
        }`}
      >
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      <div
        id="desktop-exams-navigation"
        aria-hidden={!open}
        className={`absolute left-0 top-[calc(100%+0.65rem)] w-[23rem] overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white p-2 shadow-[0_20px_50px_rgba(46,16,101,0.16)] transition duration-150 ${
          open ? 'visible translate-y-0 opacity-100' : 'pointer-events-none invisible -translate-y-1 opacity-0'
        }`}
      >
        <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#6D28D9]">
          Published exams
        </p>
        {exams.length > 0 ? (
          <ul className="space-y-1">
            {exams.map((exam) => {
              const current = isCurrentExamPath(pathname, exam);
              return (
                <li key={exam.code}>
                  <Link
                    href={exam.canonicalPath}
                    tabIndex={open ? undefined : -1}
                    aria-current={pathname === exam.canonicalPath ? 'page' : undefined}
                    aria-label={`${exam.shortName} syllabus and mock tests`}
                    onClick={() => closeMenu()}
                    className={`block rounded-xl px-3 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] ${
                      current ? 'bg-[#F5F3FF]' : 'hover:bg-[#FAFAFC]'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-[#18181B]">{exam.shortName}</span>
                      {exam.mockAvailable ? (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                          Mock Available
                        </span>
                      ) : null}
                    </span>
                    <span lang={language === 'hi' ? 'hi' : 'en'} className="mt-0.5 block text-xs leading-5 text-[#475569]">
                      {examTitle(exam, language)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-3 py-2 text-sm leading-6 text-[#475569]">
            Published exam pages are temporarily unavailable.
          </p>
        )}
        <div className="mt-2 border-t border-[#F2F4F7] pt-2">
          <Link
            href="/exams"
            tabIndex={open ? undefined : -1}
            onClick={() => closeMenu()}
            className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[#6D28D9] transition hover:bg-[#F5F3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9]"
          >
            View All Exams
          </Link>
        </div>
      </div>
    </div>
  );
}

export function MobileExamNavigation({
  exams,
  language,
  pathname,
  onNavigate,
}: SharedProps & { onNavigate: () => void }) {
  const [expanded, setExpanded] = useState(() => isExamNavigationPath(pathname, exams));
  const active = isExamNavigationPath(pathname, exams);

  return (
    <div className="min-w-0">
      <div className={`flex min-h-11 min-w-0 items-stretch rounded-xl ${active ? 'bg-[#F5F3FF]' : ''}`}>
        <Link
          href="/exams"
          aria-current={pathname === '/exams' ? 'page' : undefined}
          onClick={onNavigate}
          className={`flex min-h-11 min-w-0 flex-1 items-center rounded-l-xl px-3 text-[15px] font-medium ${
            active ? 'text-[#5521BF]' : 'text-[#18181B] hover:bg-[#F5F3FF]'
          }`}
        >
          Exams
        </Link>
        <button
          type="button"
          aria-label={expanded ? 'Collapse available exams' : 'Expand available exams'}
          aria-expanded={expanded}
          aria-controls="mobile-exams-navigation"
          onClick={() => setExpanded((current) => !current)}
          className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-r-xl ${
            active ? 'text-[#5521BF]' : 'text-[#475569] hover:bg-[#F5F3FF]'
          }`}
        >
          <ChevronDown className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      </div>

      <div id="mobile-exams-navigation" hidden={!expanded}>
        <div className="ml-3 min-w-0 border-l border-violet-100 pb-1 pl-2 pt-1">
          <Link
            href="/exams"
            onClick={onNavigate}
            className={`flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold transition hover:bg-[#F5F3FF] ${
              pathname === '/exams' ? 'text-[#5521BF]' : 'text-[#475569]'
            }`}
          >
            All Exams
          </Link>
          {exams.map((exam) => {
            const current = isCurrentExamPath(pathname, exam);
            return (
              <Link
                key={exam.code}
                href={exam.canonicalPath}
                onClick={onNavigate}
                aria-current={pathname === exam.canonicalPath ? 'page' : undefined}
                aria-label={`${exam.shortName} syllabus and mock tests`}
                className={`flex min-h-11 min-w-0 flex-col justify-center rounded-xl px-3 py-2 text-sm transition hover:bg-[#F5F3FF] ${
                  current ? 'bg-[#F5F3FF] text-[#5521BF]' : 'text-[#18181B]'
                }`}
              >
                <span className="flex min-w-0 flex-wrap items-center gap-2 font-semibold">
                  <span>{exam.shortName}</span>
                  {exam.mockAvailable ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                      Mock Available
                    </span>
                  ) : null}
                </span>
                <span lang={language === 'hi' ? 'hi' : 'en'} className="mt-0.5 break-words text-xs leading-5 text-[#475569]">
                  {examTitle(exam, language)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
