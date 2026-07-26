'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  buildPracticeHref,
  buildRevisionHref,
} from '@/lib/polity/examRankingProgress';
import { getDepthLabel, getImportanceLabel } from '@/lib/polity/examRankingLabels';
import { isRevisionPublished } from '@/lib/revision/registry';
import { useLanguage } from '@/lib/LanguageContext';
import { pickCatalogText } from '@/lib/useCatalogText';
import type { PolityRankingProgressMaps } from '@/lib/polity/examRankingProgress';
import type { PolitySubtopicRankingRow } from '@/types/polityExamRankingV2';
import type { SubtopicFilterState } from './SubtopicRankingFilters';

type SubtopicRankingListProps = {
  subtopics: PolitySubtopicRankingRow[];
  progressMaps: PolityRankingProgressMaps;
  subjectSlug: string;
  examCode: string;
  filters: SubtopicFilterState;
};

const COPY = {
  en: {
    practice: 'Practice',
    revise: 'Revise',
    recommended: 'Recommended',
    questions: 'questions',
    noMatch: 'No subtopics match your filters.',
    rank: 'Rank',
  },
  hi: {
    practice: 'अभ्यास',
    revise: 'पुनरावृत्ति',
    recommended: 'अनुशंसित',
    questions: 'प्रश्न',
    noMatch: 'आपके फ़िल्टर से कोई उप-विषय नहीं मिला।',
    rank: 'क्रम',
  },
};

function matchesFilters(
  row: PolitySubtopicRankingRow,
  filters: SubtopicFilterState,
  progressMaps: PolityRankingProgressMaps,
): boolean {
  const q = filters.query.trim().toLowerCase();
  if (q) {
    const titleEn = pickCatalogText(row.subtopic.title, 'en').toLowerCase();
    const titleHi = pickCatalogText(row.subtopic.title, 'hi').toLowerCase();
    const topicEn = pickCatalogText(row.topic.title, 'en').toLowerCase();
    const topicHi = pickCatalogText(row.topic.title, 'hi').toLowerCase();
    if (![titleEn, titleHi, topicEn, topicHi].some((part) => part.includes(q))) {
      return false;
    }
  }

  if (filters.recommendedOnly && !row.is_recommended) return false;

  if (filters.importance !== 'all') {
    if ((row.importance ?? '').toLowerCase() !== filters.importance) return false;
  }

  if (filters.depth !== 'all') {
    if ((row.depth_level ?? '').toLowerCase() !== filters.depth) return false;
  }

  if (filters.progress !== 'all') {
    const progress = progressMaps.bySubtopicId.get(row.subtopic_id);
    if ((progress?.state ?? 'not_started') !== filters.progress) return false;
  }

  return true;
}

export default function SubtopicRankingList({
  subtopics,
  progressMaps,
  subjectSlug,
  examCode,
  filters,
}: SubtopicRankingListProps) {
  const { language } = useLanguage();
  const c = COPY[language];

  const grouped = useMemo(() => {
    const filtered = subtopics.filter((row) =>
      matchesFilters(row, filters, progressMaps),
    );

    const map = new Map<string, { topicTitle: string; rows: PolitySubtopicRankingRow[] }>();
    for (const row of filtered) {
      const topicTitle = pickCatalogText(row.topic.title, language);
      const existing = map.get(row.topic_id);
      if (existing) {
        existing.rows.push(row);
      } else {
        map.set(row.topic_id, { topicTitle, rows: [row] });
      }
    }
    return [...map.values()];
  }, [subtopics, filters, progressMaps, language]);

  if (grouped.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
        <p className="text-sm text-slate-500">{c.noMatch}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <section key={group.topicTitle} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-[#FAFAFF] px-4 py-3 sm:px-5">
            <h3 className="text-sm font-bold text-slate-900 sm:text-base">{group.topicTitle}</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {group.rows.map((row) => {
              const progress = progressMaps.bySubtopicId.get(row.subtopic_id) ?? {
                state: 'not_started' as const,
                attempted: 0,
                total: row.subtopic.question_count,
                percent: null,
              };
              const title = pickCatalogText(row.subtopic.title, language);
              const importance = pickCatalogText(getImportanceLabel(row.importance), language);
              const depth = pickCatalogText(getDepthLabel(row.depth_level), language);
              const practiceHref = buildPracticeHref(
                subjectSlug,
                row.topic.slug,
                row.subtopic.slug,
                examCode,
              );
              const revisionHref = buildRevisionHref(
                subjectSlug,
                row.topic.slug,
                row.subtopic.slug,
                examCode,
                isRevisionPublished(subjectSlug, row.topic.slug, row.subtopic.slug),
              );

              return (
                <article key={row.subtopic_id} className="px-4 py-4 sm:px-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-[#F3E8FF] px-2 py-0.5 text-[10px] font-bold text-brand">
                          #{row.priority}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 sm:text-base">{title}</h4>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {importance && (
                          <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                            {importance}
                          </span>
                        )}
                        {depth && (
                          <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                            {depth}
                          </span>
                        )}
                        {row.is_recommended && (
                          <span className="rounded-full border border-[#DDD6FE] bg-[#F5F3FF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                            {c.recommended}
                          </span>
                        )}
                      </div>
                      {(progress.total != null || progress.attempted > 0) && (
                        <div className="mt-3 max-w-xs">
                          {progress.percent != null && progress.total != null ? (
                            <>
                              <div className="mb-1 flex justify-between text-xs text-slate-500">
                                <span>
                                  {progress.attempted}/{progress.total} {c.questions}
                                </span>
                                <span>{progress.percent}%</span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-[#EDE9FE]">
                                <div
                                  className={`h-full rounded-full ${progress.state === 'completed' ? 'bg-emerald-500' : 'bg-brand'}`}
                                  style={{ width: `${progress.percent}%` }}
                                />
                              </div>
                            </>
                          ) : row.subtopic.question_count != null && row.subtopic.question_count > 0 ? (
                            <p className="text-xs text-slate-500">
                              {row.subtopic.question_count.toLocaleString()} {c.questions}
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link
                        href={practiceHref}
                        className="inline-flex items-center justify-center rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                      >
                        {c.practice}
                      </Link>
                      {revisionHref && (
                        <Link
                          href={revisionHref}
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                        >
                          {c.revise}
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
