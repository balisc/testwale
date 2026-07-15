'use client';

import { ExternalLink, BookMarked } from 'lucide-react';
import type { RevisionSourceCard } from '@/content/revision/indian-polity/sources-of-indian-constitution.v1';
import type { LangMode } from '../lib/bilingual';
import { BiText, pick } from '../lib/bilingual';

const SPINE = [
  { accent: '#7C3AED', short: 'IX' },
  { accent: '#4338CA', short: 'XI' },
  { accent: '#0F172A', short: 'COI' },
];

export function SourceBookshelf({
  cards,
  mode,
  onOpen,
}: {
  cards: RevisionSourceCard[];
  mode: LangMode;
  onOpen: (url: string) => void;
}) {
  return (
    <div>
      <div
        className="mb-4 flex h-24 items-end justify-center gap-1.5 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 px-2 pb-2 min-[360px]:h-28 min-[360px]:gap-2 min-[360px]:px-4 min-[360px]:pb-3"
        role="img"
        aria-label="Illustrated shelf with three document spines: NCERT Class IX, NCERT Class XI and Constitution of India"
      >
        {SPINE.map((s) => (
          <div
            key={s.short}
            className="flex h-[72px] w-10 flex-col items-center justify-between rounded-t-md border border-b-0 px-0.5 py-1.5 shadow-sm min-[360px]:h-[88px] min-[360px]:w-14 min-[360px]:px-1 min-[360px]:py-2"
            style={{ background: `${s.accent}14`, borderColor: `${s.accent}55` }}
            aria-hidden
          >
            <BookMarked className="h-4 w-4" style={{ color: s.accent }} />
            <span className="text-[10px] font-bold" style={{ color: s.accent }}>
              {s.short}
            </span>
            <span className="h-1 w-6 rounded-full min-[360px]:w-8" style={{ background: s.accent }} />
          </div>
        ))}
        <div className="absolute" />
      </div>

      <ul className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => {
          const spine = SPINE[i] ?? SPINE[0];
          return (
            <li
              key={card.id}
              className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 min-[360px]:p-4"
            >
              <span
                className="mb-2 inline-flex w-fit rounded-md px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                style={{ background: spine.accent }}
              >
                {spine.short}
              </span>
              <BiText text={card.title} mode={mode} as="h3" className="text-sm font-semibold text-slate-900" />
              {card.chapter ? (
                <BiText text={card.chapter} mode={mode} className="mt-1 text-xs text-slate-600" />
              ) : null}
              <p className="mt-2 text-[11px] text-slate-500">
                <BiText text={card.edition} mode={mode} as="span" />
              </p>
              <p className="mt-1 text-[11px] text-slate-600">
                <BiText text={card.locator} mode={mode} as="span" />
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                {mode === 'hi' ? 'सत्यापन: ' : 'Verified: '}
                <BiText text={card.verificationDate} mode={mode} as="span" />
              </p>
              <a
                href={card.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onOpen(card.url)}
                aria-label={pick(card.accessibleName, mode === 'both' ? 'en' : mode)}
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: spine.accent }}
              >
                {pick(card.buttonLabel, mode === 'both' ? 'en' : mode)}
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
