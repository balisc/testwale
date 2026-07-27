'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronRight, ShieldCheck, Sparkles, User } from 'lucide-react';
import ModalPortal from '@/components/ModalPortal';
import CountdownUnitCards from '@/components/CountdownUnitCards';
import { useLanguage } from '@/lib/LanguageContext';
import {
  QUALITY_UPGRADE_COMPLETED_LABEL,
  QUALITY_UPGRADE_TARGET_DATE_LABEL,
  acknowledgeQualityUpgradeNotice,
  getQualityUpgradeCountdown,
  shouldShowQualityUpgradeNotice,
} from '@/lib/qualityUpgradeAnnouncement';

const COPY = {
  en: {
    earlyAccess: 'EARLY ACCESS',
    title: 'QuestionWale is getting even better.',
    body: "Over the next 30 days, we're reviewing and upgrading our question bank with high-quality, exam-relevant questions aligned with the latest patterns.",
    upgradeLabel: '30-DAY QUALITY UPGRADE',
    targetDate: QUALITY_UPGRADE_TARGET_DATE_LABEL,
    thankYouTitle: 'A special thank-you to our early learners',
    thankYouBody: 'Your early support is helping us build a better QuestionWale.',
    continue: 'Continue with QuestionWale',
    footerNote: 'You can continue using all available features during this upgrade.',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    countdownAria: 'Time remaining until the quality upgrade target date on 26 August 2026',
    completed: QUALITY_UPGRADE_COMPLETED_LABEL,
  },
  hi: {
    earlyAccess: 'EARLY ACCESS',
    title: 'QuestionWale is getting even better.',
    body: "Over the next 30 days, we're reviewing and upgrading our question bank with high-quality, exam-relevant questions aligned with the latest patterns.",
    upgradeLabel: '30-DAY QUALITY UPGRADE',
    targetDate: QUALITY_UPGRADE_TARGET_DATE_LABEL,
    thankYouTitle: 'A special thank-you to our early learners',
    thankYouBody: 'Your early support is helping us build a better QuestionWale.',
    continue: 'Continue with QuestionWale',
    footerNote: 'You can continue using all available features during this upgrade.',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    countdownAria: 'Time remaining until the quality upgrade target date on 26 August 2026',
    completed: QUALITY_UPGRADE_COMPLETED_LABEL,
  },
} as const;

const EARLY_LEARNERS = ['Raj Chidar', 'Shivani Panwar'] as const;

type ModalPhase = 'checking' | 'open' | 'closed';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function QualityUpgradeAnnouncement() {
  const { language } = useLanguage();
  const c = COPY[language];
  const [phase, setPhase] = useState<ModalPhase>('checking');
  const [nowMs, setNowMs] = useState(0);
  const continueRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    setPhase(shouldShowQualityUpgradeNotice() ? 'open' : 'closed');
  }, []);

  useEffect(() => {
    if (phase !== 'open') return;
    setNowMs(Date.now());
    const intervalMs = prefersReducedMotion ? 60_000 : 1000;
    const id = window.setInterval(() => setNowMs(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [phase, prefersReducedMotion]);

  const countdown = useMemo(
    () => (phase === 'open' ? getQualityUpgradeCountdown(nowMs || Date.now()) : null),
    [phase, nowMs],
  );

  const handleContinue = useCallback(() => {
    acknowledgeQualityUpgradeNotice();
    setPhase('closed');
  }, []);

  useEffect(() => {
    if (phase !== 'open') return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusTimer = window.setTimeout(() => {
      continueRef.current?.focus();
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusables = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
      );
      if (focusables.length === 0) return;

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [phase]);

  if (phase !== 'open' || !countdown) return null;

  return (
    <ModalPortal
      open
      onClose={() => undefined}
      labelledBy="quality-upgrade-title"
      describedBy="quality-upgrade-description"
      closeOnBackdropClick={false}
      closeOnEscape={false}
      zClassName="z-[400]"
      backdropClassName="bg-slate-900/55 backdrop-blur-[3px] motion-reduce:backdrop-blur-none"
      panelClassName="max-w-[min(100%,780px)] rounded-2xl border border-[#E9D5FF] bg-white p-5 shadow-[0_24px_64px_rgba(15,23,42,0.18)] sm:p-7 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
    >
      <div ref={panelRef} className="px-0.5 sm:px-1">
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DDD6FE] bg-[#F5F3FF] px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-brand">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {c.earlyAccess}
          </span>
        </div>

        <h2
          id="quality-upgrade-title"
          className="mt-5 text-center font-heading text-[1.35rem] font-bold leading-tight text-[#0F172A] sm:text-[1.75rem]"
        >
          {c.title}
        </h2>
        <p
          id="quality-upgrade-description"
          className="mx-auto mt-3 max-w-[640px] text-center text-sm leading-relaxed text-slate-600 sm:text-[15px]"
        >
          {c.body}
        </p>

        <div className="mt-7 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#E2E8F0]" aria-hidden />
          <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-brand">
            {c.upgradeLabel}
          </span>
          <div className="h-px flex-1 bg-[#E2E8F0]" aria-hidden />
        </div>

        <div className="mt-4">
          {countdown.expired ? (
            <p
              className="rounded-xl border border-[#DDD6FE] bg-[#FAF5FF] px-4 py-6 text-center text-base font-semibold text-brand sm:text-lg"
              role="status"
            >
              {c.completed}
            </p>
          ) : (
            <CountdownUnitCards
              days={countdown.days}
              hours={countdown.hours}
              minutes={countdown.minutes}
              seconds={countdown.seconds}
              labels={{ days: c.days, hours: c.hours, minutes: c.minutes, seconds: c.seconds }}
              ariaLabel={c.countdownAria}
              size="md"
            />
          )}
        </div>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500 sm:text-sm">
          <Calendar className="h-4 w-4 shrink-0 text-brand" aria-hidden />
          {c.targetDate}
        </p>

        <div className="mt-7 rounded-2xl border border-[#EDE9FE] bg-[#FAFAFF] px-4 py-5 sm:px-5">
          <p className="text-center text-sm font-semibold text-[#0F172A] sm:text-[15px]">{c.thankYouTitle}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {EARLY_LEARNERS.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#DDD6FE] bg-white px-3 py-1.5 text-xs font-medium text-brand sm:text-sm"
              >
                <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {name}
              </span>
            ))}
          </div>
          <p className="mt-3 text-center text-xs leading-relaxed text-slate-600 sm:text-sm">{c.thankYouBody}</p>
        </div>

        <div className="mt-7 flex justify-center">
          <button
            ref={continueRef}
            type="button"
            onClick={handleContinue}
            className="inline-flex min-h-[48px] w-full max-w-md items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-[#6D28D9] hover:to-[#6D28D9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none sm:w-auto sm:min-w-[280px]"
          >
            {c.continue}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <p className="mt-5 flex items-start justify-center gap-1.5 border-t border-[#F1F5F9] pt-4 text-center text-[11px] leading-relaxed text-slate-500 sm:text-xs">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
          {c.footerNote}
        </p>
      </div>
    </ModalPortal>
  );
}
