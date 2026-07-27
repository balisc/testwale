'use client';

import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { getExamCountdownParts } from '@/lib/examCountdown';
import type { ProfileCopy } from '../profileCopy';

type ExamCountdownBadgeProps = {
  examDate: string;
  copy: ProfileCopy;
  language: 'en' | 'hi';
};

export default function ExamCountdownBadge({ examDate, copy, language }: ExamCountdownBadgeProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const parts = getExamCountdownParts(examDate, nowMs);
  if (!parts) return null;

  if (parts.expired) {
    return (
      <div
        className="inline-flex w-full max-w-full items-center gap-2.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 sm:w-auto sm:px-4 sm:py-3"
        aria-live="polite"
        title={copy.examCountdownTitle}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FEE2E2]">
          <Calendar className="h-5 w-5 text-[#DC2626]" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#DC2626]">
            {copy.examCountdownLabel}
          </p>
          <p className="text-lg font-bold leading-tight text-[#991B1B] sm:text-xl">{copy.examDayReached}</p>
        </div>
      </div>
    );
  }

  const dayWord = parts.days === 1 ? copy.day : copy.days;
  const daysLabel = `${parts.days} ${dayWord} ${copy.examLeft}`;
  const timeLabel = `${parts.hours} ${copy.examHr} ${parts.minutes} ${copy.examMin} ${copy.examRemaining}`;

  return (
    <div
      className="inline-flex w-full max-w-full items-center gap-2.5 rounded-xl border border-[#E9D5FF] bg-[#FAF5FF] px-3 py-2.5 sm:w-auto sm:max-w-[min(100%,220px)] sm:gap-3 sm:px-4 sm:py-3 md:max-w-none"
      aria-live="polite"
      title={copy.examCountdownTitle}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F3E8FF]">
        <Calendar className="h-5 w-5 text-[#9333EA]" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9333EA]">
          {copy.examCountdownLabel}
        </p>
        <p className="text-base font-bold leading-tight text-[#0F172A] sm:text-lg md:text-xl">{daysLabel}</p>
        <p className="text-xs leading-snug text-[#64748B] sm:text-sm">{timeLabel}</p>
      </div>
    </div>
  );
}
