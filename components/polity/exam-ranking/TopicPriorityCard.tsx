'use client';

import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import IconByKey from '@/components/IconByKey';
import {
  buildPracticeHref,
  buildTopicHref,
  resolveTopicActionLabel,
} from '@/lib/polity/examRankingProgress';
import { getImportanceLabel, normalizeImportanceKey } from '@/lib/polity/examRankingLabels';
import { useLanguage } from '@/lib/LanguageContext';
import { useCatalogText } from '@/lib/useCatalogText';
import type { PolityEntityProgress, PolityTopicRankingRow } from '@/types/polityExamRankingV2';

type TopicPriorityCardProps = {
  row: PolityTopicRankingRow;
  progress: PolityEntityProgress;
  subjectSlug: string;
  examCode: string;
  expanded: boolean;
  onToggleExpand: () => void;
  firstSubtopicSlug?: string | null;
};

const IMPORTANCE_STYLES = {
  high: 'border-l-[#7C3AED] bg-gradient-to-r from-[#FAF5FF] to-white',
  medium: 'border-l-amber-400 bg-gradient-to-r from-amber-50/70 to-white',
  low: 'border-l-slate-300 bg-white',
  completed: 'border-l-emerald-500',
};

const COPY = {
  en: {
    recommended: 'Recommended',
    questions: 'questions',
    expand: 'View subtopics',
    collapse: 'Hide subtopics',
  },
  hi: {
    recommended: 'अनुशंसित',
    questions: 'प्रश्न',
    expand: 'उप-विषय देखें',
    collapse: 'उप-विषय छिपाएँ',
  },
};

export default function TopicPriorityCard({
  row,
  progress,
  subjectSlug,
  examCode,
  expanded,
  onToggleExpand,
  firstSubtopicSlug,
}: TopicPriorityCardProps) {
  const { language } = useLanguage();
  const c = COPY[language];
  const title = useCatalogText(row.topic.title);
  const importance = useCatalogText(getImportanceLabel(row.importance));
  const importanceKey = normalizeImportanceKey(row.importance) ?? 'low';
  const actionLabel = resolveTopicActionLabel(progress, language);

  const accentKey =
    progress.state === 'completed'
      ? 'completed'
      : importanceKey === 'high' || importanceKey === 'medium' || importanceKey === 'low'
        ? importanceKey
        : 'low';

  const topicHref = buildTopicHref(subjectSlug, row.topic.slug, examCode);
  const practiceHref = buildPracticeHref(
    subjectSlug,
    row.topic.slug,
    firstSubtopicSlug ?? null,
    examCode,
  );

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-slate-100 border-l-4 shadow-sm transition hover:shadow-md ${IMPORTANCE_STYLES[accentKey]}`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-brand">
            <IconByKey iconKey={row.topic.icon_key} className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-bold text-brand shadow-sm">
                    #{row.priority}
                  </span>
                  <h3 className="text-base font-bold leading-snug text-slate-900 sm:text-lg">{title}</h3>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {importance && (
                    <span className="inline-flex rounded-full border border-slate-200 bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                      {importance}
                    </span>
                  )}
                  {row.is_recommended && (
                    <span className="inline-flex rounded-full border border-[#DDD6FE] bg-[#F5F3FF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                      {c.recommended}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {(progress.total != null || progress.attempted > 0) && (
              <div className="mt-3">
                {progress.percent != null && progress.total != null ? (
                  <>
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                      <span>{progress.attempted}/{progress.total}</span>
                      <span>{progress.percent}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#EDE9FE]">
                      <div
                        className={`h-full rounded-full ${progress.state === 'completed' ? 'bg-emerald-500' : 'bg-brand'}`}
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                  </>
                ) : progress.attempted > 0 ? (
                  <p className="text-xs text-slate-500">
                    {progress.attempted} {language === 'hi' ? 'प्रश्न का प्रयास' : 'questions attempted'}
                  </p>
                ) : null}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {row.topic.question_count != null && row.topic.question_count > 0 && (
                <span>
                  {row.topic.question_count.toLocaleString()} {c.questions}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <Link
            href={practiceHref}
            className="inline-flex items-center justify-center rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:text-sm"
          >
            {actionLabel}
          </Link>
          <Link
            href={topicHref}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:text-sm"
          >
            {language === 'hi' ? 'विषय देखें' : 'Open topic'}
          </Link>
          <button
            type="button"
            onClick={onToggleExpand}
            className="inline-flex items-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold text-brand transition hover:bg-[#F5F3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-expanded={expanded}
          >
            {expanded ? c.collapse : c.expand}
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </article>
  );
}
