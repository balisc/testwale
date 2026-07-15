'use client';

import { useState } from 'react';
import { SOURCE_VISUAL, type SourceKey } from '../lib/revisionVisualTokens';
import type { LangMode } from '../lib/bilingual';
import { pick } from '../lib/bilingual';

type Strip = {
  key: SourceKey;
  sentence: { en: string; hi: string };
  chips: { en: string; hi: string }[];
};

const STRIPS: Strip[] = [
  {
    key: 'britain',
    sentence: {
      en: 'British Parliament → Speaker → Law → FPTP → Rule',
      hi: 'British Parliament → Speaker → Law → FPTP → Rule',
    },
    chips: [
      { en: 'Parliament', hi: 'Parliament' },
      { en: 'Speaker', hi: 'Speaker' },
      { en: 'Law', hi: 'Law' },
      { en: 'FPTP', hi: 'FPTP' },
      { en: 'Rule', hi: 'Rule' },
    ],
  },
  {
    key: 'usa',
    sentence: {
      en: 'Rights → Independent Judiciary → Judicial Review',
      hi: 'Rights → Independent Judges → Review',
    },
    chips: [
      { en: 'Rights', hi: 'Rights' },
      { en: 'Independent Judiciary', hi: 'Independent Judiciary' },
      { en: 'Judicial Review', hi: 'Judicial Review' },
    ],
  },
  {
    key: 'ireland',
    sentence: { en: 'IRELAND gives DIRECTION', hi: 'IRELAND gives DIRECTION' },
    chips: [{ en: 'Directive Principles', hi: 'Directive Principles' }],
  },
  {
    key: 'france',
    sentence: {
      en: 'France = LEF: Liberty, Equality, Fraternity',
      hi: 'फ्रांस = LEF: स्वतंत्रता, समानता, बंधुता',
    },
    chips: [
      { en: 'Liberty', hi: 'Liberty' },
      { en: 'Equality', hi: 'Equality' },
      { en: 'Fraternity', hi: 'Fraternity' },
    ],
  },
  {
    key: 'canada',
    sentence: {
      en: 'Canada = Centre strong + remaining powers',
      hi: 'Canada = Centre strong + बची powers',
    },
    chips: [
      { en: 'Strong Centre', hi: 'Strong Centre' },
      { en: 'Residuary powers', hi: 'Residuary powers' },
    ],
  },
];

function MiniGlyph({ source }: { source: SourceKey }) {
  const c = SOURCE_VISUAL[source].hex;
  if (source === 'ireland') {
    return (
      <svg viewBox="0 0 48 32" className="h-7 w-10 shrink-0 sm:h-8 sm:w-12" aria-hidden>
        <rect x="8" y="4" width="6" height="24" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5" />
        <path d="M14 8 H40 L34 16 L40 24 H14 Z" fill={c} opacity="0.15" stroke={c} strokeWidth="1.5" />
      </svg>
    );
  }
  if (source === 'france') {
    return (
      <svg viewBox="0 0 48 32" className="h-7 w-10 shrink-0 sm:h-8 sm:w-12" aria-hidden>
        <path d="M24 4 L42 28 H6 Z" fill="none" stroke={c} strokeWidth="1.8" />
      </svg>
    );
  }
  if (source === 'canada') {
    return (
      <svg viewBox="0 0 48 32" className="h-7 w-10 shrink-0 sm:h-8 sm:w-12" aria-hidden>
        <circle cx="20" cy="16" r="10" fill={c} opacity="0.15" stroke={c} strokeWidth="1.8" />
        <circle cx="38" cy="10" r="6" fill="none" stroke={c} strokeWidth="1.5" strokeDasharray="2 1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 32" className="h-7 w-10 shrink-0 sm:h-8 sm:w-12" aria-hidden>
      <rect x="4" y="8" width="40" height="16" rx="4" fill={c} opacity="0.12" stroke={c} strokeWidth="1.8" />
      <circle cx="12" cy="16" r="3" fill={c} />
      <circle cx="24" cy="16" r="3" fill={c} />
      <circle cx="36" cy="16" r="3" fill={c} />
    </svg>
  );
}

/** Cover-and-recall: blur chips until revealed — no quiz scoring. */
export function CoverRecallStrip({
  mode,
  highlight,
}: {
  mode: LangMode;
  highlight?: SourceKey | null;
}) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  return (
    <div className="w-full min-w-0 space-y-3">
      {STRIPS.map((strip) => {
        const v = SOURCE_VISUAL[strip.key];
        const open = revealed[strip.key];
        const active = highlight === strip.key;
        return (
          <div
            key={strip.key}
            id={`mnemonic-${strip.key}`}
            className="w-full min-w-0 overflow-hidden rounded-2xl border p-2.5 transition sm:p-3"
            style={{
              borderColor: active ? v.hex : v.border,
              background: active ? v.soft : '#fff',
              boxShadow: active ? `0 0 0 2px ${v.hex}55` : undefined,
            }}
          >
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <MiniGlyph source={strip.key} />
                <span
                  className="max-w-full truncate rounded-md px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                  style={{ background: v.hex }}
                >
                  {pick(v.label, mode === 'both' ? 'en' : mode)}
                </span>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:px-2.5 sm:text-[11px]"
                onClick={() => setRevealed((r) => ({ ...r, [strip.key]: !r[strip.key] }))}
                aria-expanded={open}
              >
                {open ? (mode === 'hi' ? 'ढकें' : 'Cover') : mode === 'hi' ? 'याद करें' : 'Recall'}
              </button>
            </div>

            {/* Memory path as wrapping steps — avoids long single-line overflow */}
            <ol className="mt-2.5 flex min-w-0 flex-wrap items-center gap-1">
              {strip.chips.map((chip, i) => (
                <li key={chip.en} className="flex min-w-0 max-w-full items-center gap-1">
                  {i > 0 ? (
                    <span className="shrink-0 text-[10px] font-bold text-slate-400" aria-hidden>
                      →
                    </span>
                  ) : null}
                  <span
                    className="max-w-full break-words rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-snug text-slate-700 sm:text-[11px]"
                    style={{ borderColor: v.border, background: '#fff' }}
                  >
                    {pick(chip, mode === 'both' ? 'en' : mode)}
                  </span>
                </li>
              ))}
            </ol>

            <p className="mt-2 break-words text-[11px] leading-snug text-slate-600 sm:text-xs">
              {pick(strip.sentence, mode)}
            </p>

            <div
              className="mt-2 grid min-w-0 grid-cols-2 gap-1.5 sm:grid-cols-3"
              aria-hidden={!open}
            >
              {strip.chips.map((chip) => (
                <span
                  key={`recall-${chip.en}`}
                  className={`min-w-0 truncate rounded-lg border px-2 py-1.5 text-center text-[10px] font-semibold transition sm:text-[11px] ${
                    open
                      ? 'border-transparent text-white'
                      : 'border-slate-200 text-transparent blur-[5px] select-none'
                  }`}
                  style={open ? { background: v.hex } : { background: v.soft }}
                  title={open ? pick(chip, mode === 'both' ? 'en' : mode) : undefined}
                >
                  {pick(chip, mode === 'both' ? 'en' : mode)}
                </span>
              ))}
            </div>

            {!open ? (
              <p className="mt-1.5 break-words text-[10px] text-slate-500">
                {mode === 'hi'
                  ? 'Recall दबाकर labels चेक करें — कोई अंक नहीं।'
                  : 'Tap Recall to self-check labels — no score.'}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
