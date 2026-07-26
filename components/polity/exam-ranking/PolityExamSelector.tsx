'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, Target, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/lib/LanguageContext';
import { JURISDICTION_GROUP_LABELS } from '@/lib/polity/examRankingLabels';
import { useCatalogText, pickCatalogText } from '@/lib/useCatalogText';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import type { PolityRankedExamOption } from '@/types/polityExamRankingV2';

type PolityExamSelectorProps = {
  exams: PolityRankedExamOption[];
  selectedExam: PolityRankedExamOption | null;
  onSelect: (examCode: string) => void;
  disabled?: boolean;
};

const COPY = {
  en: {
    label: 'Target Exam',
    placeholder: 'Search exams by name, state or stage…',
    noResults: 'No exams match your search.',
    choose: 'Choose your target exam',
    close: 'Close',
    stage: 'Stage',
    paper: 'Paper',
  },
  hi: {
    label: 'लक्ष्य परीक्षा',
    placeholder: 'नाम, राज्य या चरण से परीक्षा खोजें…',
    noResults: 'आपकी खोज से कोई परीक्षा नहीं मिली।',
    choose: 'अपनी लक्ष्य परीक्षा चुनें',
    close: 'बंद करें',
    stage: 'चरण',
    paper: 'पेपर',
  },
};

function formatExamMeta(exam: PolityRankedExamOption, language: 'en' | 'hi') {
  const parts = [
    exam.jurisdiction_name,
    exam.stage,
    exam.paper ? `${language === 'hi' ? 'पेपर' : 'Paper'} ${exam.paper}` : null,
  ].filter(Boolean);
  return parts.join(' · ');
}

function ExamGroupSection({
  groupKey,
  items,
  selectedExam,
  onSelect,
}: {
  groupKey: 'national' | 'state' | 'union_territory';
  items: PolityRankedExamOption[];
  selectedExam: PolityRankedExamOption | null;
  onSelect: (code: string) => void;
}) {
  const { language } = useLanguage();
  if (items.length === 0) return null;
  const groupLabel = pickCatalogText(JURISDICTION_GROUP_LABELS[groupKey], language);

  return (
    <section className="mb-5 last:mb-0">
      <h3 className="sticky top-0 z-10 mb-2 bg-white/95 px-1 py-1 text-xs font-bold uppercase tracking-wider text-brand backdrop-blur">
        {groupLabel}
      </h3>
      <div className="grid gap-2">
        {items.map((exam) => (
          <ExamOptionButton
            key={exam.exam_code}
            exam={exam}
            active={selectedExam?.exam_code === exam.exam_code}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}

function ExamOptionButton({
  exam,
  active,
  onSelect,
}: {
  exam: PolityRankedExamOption;
  active: boolean;
  onSelect: (code: string) => void;
}) {
  const { language } = useLanguage();
  const title = useCatalogText(exam.title);
  const meta = formatExamMeta(exam, language);

  return (
    <button
      type="button"
      onClick={() => onSelect(exam.exam_code)}
      className={`w-full rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
        active
          ? 'border-brand bg-[#F5F3FF] shadow-sm'
          : 'border-slate-100 bg-white hover:border-[#DDD6FE] hover:bg-[#FAFAFF]'
      }`}
    >
      <div className="font-semibold text-slate-900">{title}</div>
      {meta && <div className="mt-0.5 text-xs text-slate-500">{meta}</div>}
      <div className="mt-1 font-mono text-[10px] uppercase tracking-wide text-slate-400">
        {exam.exam_code}
      </div>
    </button>
  );
}

function SelectorPanel({
  exams,
  selectedExam,
  onSelect,
  onClose,
  labelledBy,
}: {
  exams: PolityRankedExamOption[];
  selectedExam: PolityRankedExamOption | null;
  onSelect: (code: string) => void;
  onClose: () => void;
  labelledBy: string;
}) {
  const { language } = useLanguage();
  const c = COPY[language];
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? exams.filter((exam) => {
          const titleEn = pickCatalogText(exam.title, 'en').toLowerCase();
          const titleHi = pickCatalogText(exam.title, 'hi').toLowerCase();
          const haystack = [
            titleEn,
            titleHi,
            exam.exam_code.toLowerCase(),
            exam.jurisdiction_name?.toLowerCase() ?? '',
            exam.stage?.toLowerCase() ?? '',
            exam.paper?.toLowerCase() ?? '',
          ];
          return haystack.some((part) => part.includes(q));
        })
      : exams;

    const groups: Record<'national' | 'state' | 'union_territory', PolityRankedExamOption[]> = {
      national: [],
      state: [],
      union_territory: [],
    };

    for (const exam of filtered) {
      groups[exam.jurisdictionGroup].push(exam);
    }

    return groups;
  }, [exams, query]);

  const totalMatches =
    grouped.national.length + grouped.state.length + grouped.union_territory.length;

  return (
    <div className="flex max-h-[min(78dvh,640px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 id={labelledBy} className="text-base font-bold text-slate-900">
          {c.choose}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-label={c.close}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-slate-100 px-4 py-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={c.placeholder}
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-[#EDE9FE]"
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4">
        {totalMatches === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-slate-500">{c.noResults}</p>
        ) : (
          (['national', 'state', 'union_territory'] as const).map((groupKey) => (
            <ExamGroupSection
              key={groupKey}
              groupKey={groupKey}
              items={grouped[groupKey]}
              selectedExam={selectedExam}
              onSelect={(code) => {
                onSelect(code);
                onClose();
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function PolityExamSelector({
  exams,
  selectedExam,
  onSelect,
  disabled = false,
}: PolityExamSelectorProps) {
  const { language } = useLanguage();
  const c = COPY[language];
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const titleId = 'polity-exam-selector-title';

  useBodyScrollLock(open && isMobile);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const selectedTitle = useCatalogText(selectedExam?.title ?? null);
  const selectedMeta = selectedExam ? formatExamMeta(selectedExam, language) : null;

  const trigger = (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setOpen(true)}
      aria-haspopup="dialog"
      aria-expanded={open}
      className="flex w-full items-center gap-3 rounded-2xl border border-[#DDD6FE] bg-white px-4 py-3.5 text-left shadow-sm transition hover:border-brand hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-xl"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-brand">
        <Target className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold uppercase tracking-wide text-brand">
          {c.label}
        </span>
        <span className="mt-0.5 block truncate text-sm font-bold text-slate-900 sm:text-base">
          {selectedTitle || c.choose}
        </span>
        {selectedMeta && <span className="mt-0.5 block truncate text-xs text-slate-500">{selectedMeta}</span>}
      </span>
      <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
    </button>
  );

  const panel = (
    <SelectorPanel
      exams={exams}
      selectedExam={selectedExam}
      onSelect={onSelect}
      onClose={() => setOpen(false)}
      labelledBy={titleId}
    />
  );

  return (
    <>
      {trigger}
      {open && mounted
        ? createPortal(
            isMobile ? (
              <div className="fixed inset-0 z-[320] flex flex-col justify-end" role="presentation">
                <button
                  type="button"
                  aria-label={c.close}
                  className="absolute inset-0 bg-slate-900/50 motion-reduce:transition-none"
                  onClick={() => setOpen(false)}
                />
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={titleId}
                  className="relative z-10 max-h-[88dvh] w-full rounded-t-3xl bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(15,23,42,0.18)] motion-reduce:transition-none"
                >
                  {panel}
                </div>
              </div>
            ) : (
              <div className="fixed inset-0 z-[320] flex items-start justify-center p-4 pt-[10vh]" role="presentation">
                <button
                  type="button"
                  aria-label={c.close}
                  className="absolute inset-0 bg-slate-900/50"
                  onClick={() => setOpen(false)}
                />
                <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative z-10 w-full max-w-lg">
                  {panel}
                </div>
              </div>
            ),
            document.body,
          )
        : null}
    </>
  );
}
