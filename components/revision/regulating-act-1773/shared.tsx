'use client';

import { ArrowUpRight } from 'lucide-react';
import { getSource, getSourceShortCode } from '@/content/revision/indian-polity/regulating-act-1773.sources';
import type { BiString } from '@/content/revision/indian-polity/regulating-act-1773.v1';
import { BiText, pick, type LangMode } from '@/app/demo/lib/bilingual';

export function SourceBadge({
  sourceId,
  className = '',
}: {
  sourceId: string;
  className?: string;
}) {
  const source = getSource(sourceId);
  const code = getSourceShortCode(sourceId);
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`ra-src-badge ${className}`.trim()}
      aria-label={`${source.title} — ${source.locator}`}
    >
      <ArrowUpRight className="h-3 w-3" aria-hidden />
      {code}
    </a>
  );
}

export function SourceLink({
  sourceId,
  mode,
  className = '',
}: {
  sourceId: string;
  mode: LangMode;
  className?: string;
}) {
  void mode;
  return <SourceBadge sourceId={sourceId} className={className} />;
}

export function ExamTip({ text, mode }: { text: BiString; mode: LangMode }) {
  return (
    <p className="ra-exam-tip">
      <span aria-hidden>📌</span>
      <span>
        <span className="font-semibold">Exam: </span>
        <BiText text={text} mode={mode} as="span" />
      </span>
    </p>
  );
}

export function SectionHeading({
  id,
  title,
  mode,
  className = '',
}: {
  id: string;
  title: BiString;
  mode: LangMode;
  className?: string;
}) {
  void mode;
  return (
    <header className={className}>
      <h2 id={id} className="ra-section-title">
        {pick(title, 'en')}
      </h2>
      <p className="ra-section-subtitle">
        {pick(title, 'hi')}
      </p>
    </header>
  );
}

export function RevisionCard({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} className={`ra-section-block ${className}`.trim()}>
      {children}
    </div>
  );
}

export function ExamWarning({
  text,
  hiSummary,
  sourceId,
}: {
  text: React.ReactNode;
  hiSummary: string;
  sourceId: string;
}) {
  return (
    <div className="ra-exam-warn">
      <span className="text-lg" aria-hidden>⚠️</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-amber-900">Exam Warning</p>
        <div className="mt-1 text-sm leading-relaxed text-amber-950">{text}</div>
        <p className="mt-1 text-xs text-amber-800">{hiSummary}</p>
        <div className="mt-2 flex justify-end">
          <SourceBadge sourceId={sourceId} />
        </div>
      </div>
    </div>
  );
}

export function estimateReadingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export { pick, BiText };
export type { LangMode };
