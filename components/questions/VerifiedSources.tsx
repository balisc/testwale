'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ExternalLink, ShieldCheck } from 'lucide-react';
import {
  hasOfficialDisplaySource,
  resolveDisplaySources,
  type DisplayQuestionSource,
} from '@/lib/questions/parseQuestionSources';

export type VerifiedSourcesProps = {
  source?: string | null;
  sourceMetadata?: unknown;
  questionId?: string | null;
  isVerified?: boolean;
  language?: 'en' | 'hi';
  className?: string;
};

const COPY = {
  en: {
    heading: 'Verified Sources',
    supporting: 'Check the references used to verify this answer',
    officialBadge: 'Official source',
    referenceBadge: 'Reference',
    secondaryBadge: 'Secondary source',
    officiallyVerified: 'Officially verified',
    reviewedReference: 'Reviewed reference',
    openSource: 'Open source',
    institution: 'Institution',
    citation: 'Citation',
    referenceLocation: 'Reference location',
  },
  hi: {
    heading: 'सत्यापन स्रोत',
    supporting: 'इस उत्तर के सत्यापन में उपयोग किए गए संदर्भ देखें',
    officialBadge: 'आधिकारिक स्रोत',
    referenceBadge: 'संदर्भ',
    secondaryBadge: 'द्वितीयक स्रोत',
    officiallyVerified: 'आधिकारिक स्रोत से सत्यापित',
    reviewedReference: 'समीक्षित संदर्भ',
    openSource: 'स्रोत खोलें',
    institution: 'संस्थान',
    citation: 'उद्धरण',
    referenceLocation: 'संदर्भ स्थान',
  },
} as const;

function badgeLabel(item: DisplayQuestionSource, language: 'en' | 'hi'): string {
  const c = COPY[language];
  if (item.type === 'secondary') return c.secondaryBadge;
  if (item.kind === 'official' && item.url) return c.officialBadge;
  return c.referenceBadge;
}

function SourceRow({
  item,
  language,
}: {
  item: DisplayQuestionSource;
  language: 'en' | 'hi';
}) {
  const c = COPY[language];
  const badge = badgeLabel(item, language);
  const isLink = Boolean(item.url);

  const body = (
    <>
      <span className="mt-0.5 h-4 w-4 shrink-0">
        {item.kind === 'official' && item.url ? (
          <ShieldCheck className="h-4 w-4 text-brand" aria-hidden />
        ) : (
          <BookOpen className="h-4 w-4 text-slate-400" aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-[#F3E8FF] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
            {badge}
          </span>
        </span>
        <span className="mt-1.5 block text-sm font-semibold text-slate-900">{item.title}</span>
        {item.institution ? (
          <span className="mt-1 block text-xs text-slate-600">
            <span className="font-medium text-slate-500">{c.institution}: </span>
            {item.institution}
          </span>
        ) : item.hostname && !item.institution ? (
          <span className="mt-1 block truncate text-[11px] text-slate-500">{item.hostname}</span>
        ) : null}
        {item.citation ? (
          <span className="mt-1 block text-xs leading-5 text-slate-600">
            <span className="font-medium text-slate-500">{c.citation}: </span>
            {item.citation}
          </span>
        ) : null}
        {item.locator ? (
          <span className="mt-1 block text-xs leading-5 text-slate-600">
            <span className="font-medium text-slate-500">{c.referenceLocation}: </span>
            {item.locator}
          </span>
        ) : null}
        {isLink ? (
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand">
            {c.openSource}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </span>
        ) : null}
      </span>
    </>
  );

  if (isLink && item.url) {
    return (
      <li className="min-w-0">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex min-w-0 items-start gap-2.5 rounded-xl border border-[#EDE9FE] bg-white px-3 py-2.5 transition hover:border-[#DDD6FE] hover:bg-[#FAF5FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
        >
          {body}
        </a>
      </li>
    );
  }

  return (
    <li className="min-w-0">
      <div className="flex min-w-0 items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        {body}
      </div>
    </li>
  );
}

/**
 * Collapsible source card shown below answer explanations.
 * Prefers structured source_metadata; falls back to legacy source-text URL parsing.
 */
export default function VerifiedSources({
  source,
  sourceMetadata,
  questionId = null,
  isVerified = false,
  language = 'en',
  className = '',
}: VerifiedSourcesProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const c = COPY[language];

  const resolved = useMemo(
    () => resolveDisplaySources(source, sourceMetadata),
    [source, sourceMetadata],
  );

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    console.info(
      '[VerifiedSources]',
      JSON.stringify({
        questionId: questionId ?? null,
        hasSourceMetadata: resolved.hasSourceMetadata,
        primarySourceCount: resolved.primarySourceCount,
        secondarySourceCount: resolved.secondarySourceCount,
        renderedSourceCount: resolved.items.length,
      }),
    );
  }, [
    questionId,
    resolved.hasSourceMetadata,
    resolved.primarySourceCount,
    resolved.secondarySourceCount,
    resolved.items.length,
  ]);

  const items = resolved.items;
  if (items.length === 0) return null;

  const hasOfficial = hasOfficialDisplaySource(source, sourceMetadata);
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
                key={`${item.type ?? item.kind}:${item.url ?? item.title}:${item.institution ?? ''}`}
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
