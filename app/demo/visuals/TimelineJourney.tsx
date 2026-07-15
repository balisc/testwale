'use client';

import type { LangMode } from '../lib/bilingual';
import { BiText, pick } from '../lib/bilingual';

const MILESTONES = [
  {
    year: '1928',
    title: { en: 'Draft', hi: 'मसौदा' },
    meaning: {
      en: 'Motilal Nehru-led constitutional draft',
      hi: 'मोतीलाल नेहरू-नेतृत्व वाला संवैधानिक मसौदा',
    },
    sketch: 'draft',
  },
  {
    year: '1931',
    title: { en: 'Karachi', hi: 'कराची' },
    meaning: { en: 'Karachi Resolution', hi: 'कराची प्रस्ताव' },
    sketch: 'resolution',
  },
  {
    year: '1935',
    title: { en: 'Institutional Act', hi: 'Institutional Act' },
    meaning: {
      en: 'GOI Act, 1935 & institutional experience',
      hi: 'भारत शासन अधिनियम, 1935 और संस्थागत अनुभव',
    },
    sketch: 'blocks',
  },
  {
    year: '1946',
    title: { en: 'Assembly', hi: 'सभा' },
    meaning: {
      en: 'Constituent Assembly first meets',
      hi: 'संविधान सभा की पहली बैठक',
    },
    sketch: 'hall',
  },
  {
    year: '1949',
    title: { en: 'Adopt', hi: 'अंगीकार' },
    meaning: {
      en: 'Adopted 26 November 1949',
      hi: '26 नवंबर 1949 को अंगीकृत',
    },
    sketch: 'signed',
  },
  {
    year: '1950',
    title: { en: 'Enforce', hi: 'लागू' },
    meaning: {
      en: 'In force 26 January 1950',
      hi: '26 जनवरी 1950 को लागू',
    },
    sketch: 'sunrise',
  },
] as const;

function MilestoneArt({ kind }: { kind: (typeof MILESTONES)[number]['sketch'] }) {
  const stroke = '#475569';
  switch (kind) {
    case 'draft':
      return (
        <svg viewBox="0 0 64 48" className="h-12 w-16" aria-hidden>
          <rect x="14" y="8" width="36" height="34" rx="2" fill="#F8FAFC" stroke={stroke} strokeWidth="2" />
          <path d="M22 18 H42 M22 26 H38 M22 34 H34" stroke="#94A3B8" strokeWidth="2" />
        </svg>
      );
    case 'resolution':
      return (
        <svg viewBox="0 0 64 48" className="h-12 w-16" aria-hidden>
          <path d="M12 36 L32 10 L52 36 Z" fill="#EEF2FF" stroke="#4338CA" strokeWidth="2" />
          <circle cx="32" cy="28" r="4" fill="#4338CA" />
        </svg>
      );
    case 'blocks':
      return (
        <svg viewBox="0 0 64 48" className="h-12 w-16" aria-hidden>
          <rect x="8" y="24" width="16" height="16" fill="#F0FDFA" stroke="#0F766E" strokeWidth="2" />
          <rect x="24" y="16" width="16" height="24" fill="#CCFBF1" stroke="#0F766E" strokeWidth="2" />
          <rect x="40" y="20" width="16" height="20" fill="#F0FDFA" stroke="#0F766E" strokeWidth="2" />
        </svg>
      );
    case 'hall':
      return (
        <svg viewBox="0 0 64 48" className="h-12 w-16" aria-hidden>
          <path d="M8 36 V18 L32 8 L56 18 V36" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="2" />
          <rect x="26" y="24" width="12" height="12" fill="#BFDBFE" stroke="#1D4ED8" strokeWidth="1.5" />
        </svg>
      );
    case 'signed':
      return (
        <svg viewBox="0 0 64 48" className="h-12 w-16" aria-hidden>
          <rect x="12" y="10" width="40" height="28" rx="2" fill="#F5F3FF" stroke="#7C3AED" strokeWidth="2" />
          <path d="M20 30 C28 22, 36 34, 44 26" fill="none" stroke="#7C3AED" strokeWidth="2" />
        </svg>
      );
    case 'sunrise':
      return (
        <svg viewBox="0 0 64 48" className="h-12 w-16" aria-hidden>
          <path d="M8 34 H56" stroke="#B45309" strokeWidth="2" />
          <path d="M16 34 A16 16 0 0 1 48 34" fill="#FEF3C7" stroke="#B45309" strokeWidth="2" />
          <circle cx="32" cy="26" r="5" fill="#F59E0B" />
        </svg>
      );
  }
}

export function TimelineJourney({ mode }: { mode: LangMode }) {
  return (
    <div>
      <p className="mb-4 break-words rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 font-mono text-[10px] leading-relaxed text-slate-700 min-[360px]:px-3 min-[360px]:text-xs sm:text-sm">
        28 Draft → 31 Karachi → 35 Institutional Act → 46 Assembly → 49 Adopt → 50 Enforce
      </p>

      {/* Desktop: alternating path */}
      {/* Tablet+: horizontal path (6 cols only when wide enough) */}
      <ol className="relative hidden lg:grid lg:grid-cols-6 lg:gap-3">
        <div
          className="pointer-events-none absolute left-4 right-4 top-[52px] h-0.5 bg-gradient-to-r from-violet-300 via-teal-300 to-amber-300"
          aria-hidden
        />
        {MILESTONES.map((m, i) => (
          <li key={m.year} className={`relative flex min-w-0 flex-col ${i % 2 === 1 ? 'mt-8' : ''}`}>
            <div className="flex h-full flex-col items-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm xl:p-3">
              <MilestoneArt kind={m.sketch} />
              <span className="mt-1 text-base font-bold text-brand xl:text-lg">{m.year}</span>
              <span className="text-center text-[11px] font-semibold text-slate-800 xl:text-xs">
                {pick(m.title, mode === 'both' ? 'en' : mode)}
              </span>
              <BiText text={m.meaning} mode={mode} className="mt-1 text-center text-[10px] leading-snug text-slate-600" />
            </div>
          </li>
        ))}
      </ol>

      {/* Mobile + tablet: vertical path */}
      <ol className="relative space-y-3 border-l-2 border-violet-200 pl-4 min-[360px]:pl-5 lg:hidden">
        {MILESTONES.map((m) => (
          <li key={m.year} className="relative min-w-0">
            <span
              className="absolute -left-[1.15rem] top-4 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand min-[360px]:-left-[1.4rem] min-[360px]:h-3 min-[360px]:w-3"
              aria-hidden
            />
            <div className="flex min-w-0 gap-2 rounded-2xl border border-slate-200 bg-white p-2.5 min-[360px]:gap-3 min-[360px]:p-3">
              <div className="shrink-0">
                <MilestoneArt kind={m.sketch} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-bold text-brand">
                  {m.year} · {pick(m.title, mode === 'both' ? 'en' : mode)}
                </p>
                <BiText text={m.meaning} mode={mode} className="mt-0.5 text-xs text-slate-600" />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
