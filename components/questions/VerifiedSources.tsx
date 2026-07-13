'use client';

import { useId, useState } from 'react';
import { BookOpen, ChevronDown, ExternalLink, ShieldCheck } from 'lucide-react';
import {
  hasOfficialParsedSource,
  parseQuestionSources,
  type DisplayQuestionSource,
} from '@/lib/questions/parseQuestionSources';

export type VerifiedSourcesProps = {
  source?: string | null;
  isVerified?: boolean;
  language?: 'en' | 'hi';
  className?: string;
};

const COPY = {
  en: {
    heading: 'Verified sources',
    supporting: 'Check the references used to verify this answer',
    officialBadge: 'Official',
    referenceBadge: 'Reference',
    officiallyVerified: 'Officially verified',
    reviewedReference: 'Reviewed reference',
  },
  hi: {
    heading: 'सत्यापन स्रोत',
    supporting: 'इस उत्तर के सत्यापन में उपयोग किए गए संदर्भ देखें',
    officialBadge: 'आधिकारिक',
    referenceBadge: 'संदर्भ',
    officiallyVerified: 'आधिकारिक स्रोत से सत्यापित',
    reviewedReference: 'समीक्षित संदर्भ',
  },
} as const;

function SourceRow({
  item,
  language,
}: {
  item: DisplayQuestionSource;
  language: 'en' | 'hi';
}) {
  const c = COPY[language];
  const isOfficialLink = item.kind === 'official' && Boolean(item.url);

  if (isOfficialLink && item.url) {
    return (
      <li className="min-w-0">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex min-w-0 items-start gap-2.5 rounded-xl border border-[#EDE9FE] bg-white px-3 py-2.5 transition hover:border-[#DDD6FE] hover:bg-[#FAF5FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
        >
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-semibold text-slate-900">{item.title}</span>
              <span className="rounded-full bg-[#F3E8FF] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                {c.officialBadge}
              </span>
              <ExternalLink
                className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:text-brand"
                aria-hidden
              />
            </span>
            {item.hostname ? (
              <span className="mt-0.5 block truncate text-[11px] text-slate-500">{item.hostname}</span>
            ) : null}
            {item.locator ? (
              <span className="mt-0.5 block text-[11px] text-slate-500">{item.locator}</span>
            ) : null}
          </span>
        </a>
      </li>
    );
  }

  return (
    <li className="min-w-0">
      <div className="flex min-w-0 items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-medium text-slate-800">{item.title}</span>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
              {c.referenceBadge}
            </span>
          </span>
          {item.locator ? (
            <span className="mt-0.5 block text-[11px] text-slate-500">{item.locator}</span>
          ) : null}
        </span>
      </div>
    </li>
  );
}

/**
 * Collapsible source card shown below answer explanations.
 * Renders nothing when parsing yields no safe display sources.
 */
export default function VerifiedSources({
  source,
  isVerified = false,
  language = 'en',
  className = '',
}: VerifiedSourcesProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const c = COPY[language];

  const items = parseQuestionSources(source);
  if (items.length === 0) return null;

  const hasOfficial = hasOfficialParsedSource(source);
  const statusLabel =
    isVerified === true
      ? hasOfficial
        ? c.officiallyVerified
        : c.reviewedReference
      : null;

  return (
    <div
      className={`rounded-2xl border border-[#EDE9FE] bg-[#FAF5FF]/70 ${className}`.trim()}
    >
      <button
        type="button"
        className="flex w-full items-start gap-3 px-3.5 py-3 text-left transition hover:bg-[#F5F3FF]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 sm:px-4"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{c.heading}</span>
            {statusLabel ? (
              <span className="rounded-full border border-[#DDD6FE] bg-white px-2 py-0.5 text-[10px] font-semibold text-brand">
                {statusLabel}
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block text-xs leading-5 text-slate-500">{c.supporting}</span>
        </span>
        <ChevronDown
          className={`mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      <div
        id={panelId}
        role="region"
        hidden={!open}
        className={open ? 'border-t border-[#EDE9FE] px-3.5 pb-3.5 pt-3 sm:px-4 sm:pb-4' : undefined}
      >
        {open ? (
          <ul className="space-y-2">
            {items.map((item) => (
              <SourceRow
                key={`${item.kind}:${item.url ?? item.title}`}
                item={item}
                language={language}
              />
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
