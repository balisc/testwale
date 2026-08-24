'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { ChevronDown, Search, Target, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { normalizeExamCode, sortExamsForDisplay } from '@/lib/examCode';
import { JURISDICTION_GROUP_LABELS } from '@/lib/polity/examRankingLabels';
import { useLanguage } from '@/lib/LanguageContext';
import { pickCatalogText, useCatalogText } from '@/lib/useCatalogText';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import type { Exam } from '@/types/polity';
import type { PolityRankedExamOption } from '@/types/polityExamRankingV2';

type TargetExamSelectorProps = {
  subjectSlug: string;
  selectedExam: string | null;
  className?: string;
  navigateOnSelect?: boolean;
  onSelect?: (examCode: string | null) => void;
  /** Legacy catalog exams for non-polity subjects. */
  exams?: Exam[];
  /** Full ranked exam list from database (Indian Polity). */
  rankedExams?: PolityRankedExamOption[];
};

const COPY = {
  en: {
    label: 'Target Exam',
    placeholder: 'Search exams by name, state or stage…',
    choose: 'Choose your target exam',
    panelTitle: 'Choose your target exam',
    noResults: 'No exams match your search.',
    close: 'Close',
  },
  hi: {
    label: 'लक्ष्य परीक्षा',
    placeholder: 'नाम, राज्य या चरण से परीक्षा खोजें…',
    choose: 'अपनी लक्ष्य परीक्षा चुनें',
    panelTitle: 'अपनी लक्ष्य परीक्षा चुनें',
    noResults: 'आपकी खोज से कोई परीक्षा नहीं मिली।',
    close: 'बंद करें',
  },
};

function formatRankedMeta(exam: PolityRankedExamOption, language: 'en' | 'hi') {
  return [
    exam.jurisdiction_name,
    exam.stage,
    exam.paper ? `${language === 'hi' ? 'पेपर' : 'Paper'} ${exam.paper}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

function ExamListItem({
  label,
  sublabel,
  meta,
  active,
  onClick,
}: {
  label: string;
  sublabel?: string | null;
  meta?: string | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
        active
          ? 'border-brand bg-[#F5F3FF] shadow-sm'
          : 'border-slate-100 bg-white hover:border-[#DDD6FE] hover:bg-[#FAFAFF]'
      }`}
    >
      <div className="font-semibold text-slate-900">{label}</div>
      {meta && <div className="mt-0.5 text-xs text-slate-500">{meta}</div>}
      {sublabel && (
        <div className="mt-1 font-mono text-[10px] uppercase tracking-wide text-slate-400">{sublabel}</div>
      )}
    </button>
  );
}

function LegacySelectorPanel({
  exams,
  selectedCode,
  onPick,
  onClose,
  labelledBy,
}: {
  exams: Exam[];
  selectedCode: string | null;
  onPick: (code: string | null) => void;
  onClose: () => void;
  labelledBy: string;
}) {
  const { language } = useLanguage();
  const c = COPY[language];
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const allExamsLabel = pickCatalogText({ en: 'All Exams', hi: 'सभी परीक्षाएँ' }, language);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filteredExams = useMemo(() => {
    const sorted = sortExamsForDisplay(exams);
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((exam) => {
      const titleEn = pickCatalogText(exam.title, 'en').toLowerCase();
      const titleHi = pickCatalogText(exam.title, 'hi').toLowerCase();
      return titleEn.includes(q) || titleHi.includes(q) || exam.code.toLowerCase().includes(q);
    });
  }, [exams, query]);

  return (
    <SelectorPanelShell
      labelledBy={labelledBy}
      query={query}
      onQueryChange={setQuery}
      inputRef={inputRef}
      onClose={onClose}
    >
      {!query.trim() && (
        <ExamListItem
          label={allExamsLabel}
          active={!selectedCode}
          onClick={() => {
            onPick(null);
            onClose();
          }}
        />
      )}
      {filteredExams.length === 0 ? (
        <p className="px-2 py-6 text-center text-sm text-slate-500">{c.noResults}</p>
      ) : (
        filteredExams.map((exam) => {
          const title = pickCatalogText(exam.title, language);
          const active =
            selectedCode != null && normalizeExamCode(selectedCode) === normalizeExamCode(exam.code);
          return (
            <ExamListItem
              key={exam.id}
              label={title}
              sublabel={exam.code}
              active={active}
              onClick={() => {
                onPick(exam.code);
                onClose();
              }}
            />
          );
        })
      )}
    </SelectorPanelShell>
  );
}

function RankedExamGroup({
  groupKey,
  items,
  selectedCode,
  language,
  onPick,
  onClose,
}: {
  groupKey: 'national' | 'state' | 'union_territory';
  items: PolityRankedExamOption[];
  selectedCode: string | null;
  language: 'en' | 'hi';
  onPick: (code: string) => void;
  onClose: () => void;
}) {
  if (items.length === 0) return null;
  const groupLabel = pickCatalogText(JURISDICTION_GROUP_LABELS[groupKey], language);

  return (
    <section className="mb-5 last:mb-0">
      <h3 className="sticky top-0 z-10 mb-2 bg-white/95 px-1 py-1 text-xs font-bold uppercase tracking-wider text-brand backdrop-blur">
        {groupLabel}
      </h3>
      <div className="grid gap-2">
        {items.map((exam) => {
          const title = pickCatalogText(exam.title, language);
          const meta = formatRankedMeta(exam, language);
          const active =
            selectedCode != null &&
            normalizeExamCode(selectedCode) === normalizeExamCode(exam.exam_code);
          return (
            <ExamListItem
              key={exam.exam_code}
              label={title}
              meta={meta || null}
              sublabel={exam.exam_code}
              active={active}
              onClick={() => {
                onPick(exam.exam_code);
                onClose();
              }}
            />
          );
        })}
      </div>
    </section>
  );
}

function RankedSelectorPanel({
  exams,
  selectedCode,
  onPick,
  onClose,
  labelledBy,
}: {
  exams: PolityRankedExamOption[];
  selectedCode: string | null;
  onPick: (code: string | null) => void;
  onClose: () => void;
  labelledBy: string;
}) {
  const { language } = useLanguage();
  const c = COPY[language];
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const allExamsLabel = pickCatalogText({ en: 'All Exams', hi: 'सभी परीक्षाएँ' }, language);

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
    <SelectorPanelShell
      labelledBy={labelledBy}
      query={query}
      onQueryChange={setQuery}
      inputRef={inputRef}
      onClose={onClose}
    >
      {!query.trim() && (
        <ExamListItem
          label={allExamsLabel}
          active={!selectedCode}
          onClick={() => {
            onPick(null);
            onClose();
          }}
        />
      )}
      {totalMatches === 0 ? (
        <p className="px-2 py-6 text-center text-sm text-slate-500">{c.noResults}</p>
      ) : (
        (['national', 'state', 'union_territory'] as const).map((groupKey) => (
          <RankedExamGroup
            key={groupKey}
            groupKey={groupKey}
            items={grouped[groupKey]}
            selectedCode={selectedCode}
            language={language}
            onPick={(code) => onPick(code)}
            onClose={onClose}
          />
        ))
      )}
    </SelectorPanelShell>
  );
}

function SelectorPanelShell({
  labelledBy,
  query,
  onQueryChange,
  inputRef,
  onClose,
  children,
}: {
  labelledBy: string;
  query: string;
  onQueryChange: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  children: ReactNode;
}) {
  const { language } = useLanguage();
  const c = COPY[language];

  return (
    <div className="flex max-h-[min(78dvh,640px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 id={labelledBy} className="text-base font-bold text-slate-900">
          {c.panelTitle}
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
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={c.placeholder}
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-[#EDE9FE]"
          />
        </label>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4">
        {children}
      </div>
    </div>
  );
}

export default function TargetExamSelector({
  subjectSlug,
  exams = [],
  rankedExams,
  selectedExam,
  className = '',
  navigateOnSelect = true,
  onSelect,
}: TargetExamSelectorProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const c = COPY[language];
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const titleId = 'target-exam-selector-title';
  const useRanked = Boolean(rankedExams && rankedExams.length > 0);

  useBodyScrollLock(open && isMobile);

  const activeCode =
    selectedExam && selectedExam.toUpperCase() !== 'ALL' ? normalizeExamCode(selectedExam) : null;

  const matchedRankedExam = useMemo(
    () =>
      rankedExams?.find((exam) => normalizeExamCode(exam.exam_code) === activeCode) ?? null,
    [rankedExams, activeCode],
  );

  const matchedLegacyExam = useMemo(
    () => exams.find((exam) => normalizeExamCode(exam.code) === activeCode) ?? null,
    [exams, activeCode],
  );

  const selectedTitle = useCatalogText(
    matchedRankedExam?.title ?? matchedLegacyExam?.title ?? null,
  );

  const selectedMeta = matchedRankedExam ? formatRankedMeta(matchedRankedExam, language) : null;

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

  const handlePick = (code: string | null) => {
    if (onSelect) onSelect(code);
    if (!navigateOnSelect) return;

    if (!code) {
      router.push(`/subjects/${subjectSlug}`);
      return;
    }
    router.push(`/subjects/${subjectSlug}?exam=${encodeURIComponent(normalizeExamCode(code))}`);
  };

  const panel = useRanked ? (
    <RankedSelectorPanel
      exams={rankedExams!}
      selectedCode={activeCode}
      onPick={handlePick}
      onClose={() => setOpen(false)}
      labelledBy={titleId}
    />
  ) : (
    <LegacySelectorPanel
      exams={exams}
      selectedCode={activeCode}
      onPick={handlePick}
      onClose={() => setOpen(false)}
      labelledBy={titleId}
    />
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex w-full items-center gap-3 rounded-2xl border border-[#DDD6FE] bg-white px-4 py-3.5 text-left shadow-sm transition hover:border-brand hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:max-w-xl ${className}`}
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
          {selectedMeta && (
            <span className="mt-0.5 block truncate text-xs text-slate-500">{selectedMeta}</span>
          )}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && mounted
        ? createPortal(
            isMobile ? (
              <div className="fixed inset-0 z-[320] flex flex-col justify-end" role="presentation">
                <button
                  type="button"
                  aria-label={c.close}
                  className="absolute inset-0 bg-slate-900/50"
                  onClick={() => setOpen(false)}
                />
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={titleId}
                  className="relative z-10 max-h-[88dvh] w-full rounded-t-3xl bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(15,23,42,0.18)]"
                >
                  {panel}
                </div>
              </div>
            ) : (
              <div
                className="fixed inset-0 z-[320] flex items-start justify-center p-4 pt-[10vh]"
                role="presentation"
              >
                <button
                  type="button"
                  aria-label={c.close}
                  className="absolute inset-0 bg-slate-900/50"
                  onClick={() => setOpen(false)}
                />
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={titleId}
                  className="relative z-10 w-full max-w-lg"
                >
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
