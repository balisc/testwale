'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { StructuredTopicGroup } from '@/lib/geography/physicalGeographyData';
import { computeStructuredTopicCounts, splitBilingualText } from '@/lib/topicStructure';
import { slugifySubject } from '@/lib/slugGenerator';

type TopicItem = { en: string; hi: string; count: number };

type StructuredTopicGroupsProps = {
  subjectKey: string;
  topicGroups: StructuredTopicGroup[];
  topics: TopicItem[];
  lang: 'en' | 'hi';
  sectionLabel: { en: string; hi: string };
  questionsAvailableLabel: string;
  defaultOpenId?: number | null;
};

export default function StructuredTopicGroups({
  subjectKey,
  topicGroups,
  topics,
  lang,
  sectionLabel,
  questionsAvailableLabel,
  defaultOpenId = null,
}: StructuredTopicGroupsProps) {
  const [openCardId, setOpenCardId] = useState<number | null>(defaultOpenId ?? topicGroups[0]?.id ?? null);

  const counts = useMemo(() => computeStructuredTopicCounts(topicGroups, topics), [topicGroups, topics]);

  return (
    <div className="space-y-4">
      {topicGroups.map((topicGroup) => {
        const isOpen = openCardId === topicGroup.id;
        const parsedTitle = splitBilingualText(topicGroup.title);
        const displayTitle = lang === 'hi' ? parsedTitle.hi : parsedTitle.en;

        return (
          <div key={topicGroup.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setOpenCardId((prev) => (prev === topicGroup.id ? null : topicGroup.id))}
              className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
                  {lang === 'hi' ? sectionLabel.hi : sectionLabel.en}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{displayTitle}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {lang === 'hi'
                    ? 'उपविषयों को खोलने और प्रश्न संख्या देखने के लिए क्लिक करें।'
                    : 'Click to open the subtopics and review question counts.'}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  {lang === 'hi'
                    ? `${topicGroup.subtopics.length} उपविषय · ${(counts.groupTotals.get(topicGroup.id) ?? 0).toLocaleString()} कुल प्रश्न`
                    : `${topicGroup.subtopics.length} subtopics · ${(counts.groupTotals.get(topicGroup.id) ?? 0).toLocaleString()} questions total`}
                </p>
              </div>
              <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
                <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </span>
            </button>

            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="space-y-3 px-6 pb-5">
                  {topicGroup.subtopics.map((subtopic, index) => {
                    const parsedSubtopic = splitBilingualText(subtopic);
                    const displaySubtopic = lang === 'hi' ? parsedSubtopic.hi : parsedSubtopic.en;
                    const realCount = counts.subtopicCounts.get(`${topicGroup.id}-${index}`) ?? 0;
                    const topicHref = `/${subjectKey}/topics/${slugifySubject(parsedSubtopic.en || displaySubtopic)}`;

                    return (
                      <Link
                        key={`${topicGroup.id}-${index}`}
                        href={topicHref}
                        className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-purple-300 hover:bg-white"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {lang === 'hi'
                                ? `उपविषय ${index + 1}: ${displaySubtopic}`
                                : `Subtopic ${index + 1}: ${displaySubtopic}`}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">{`${realCount.toLocaleString()} ${questionsAvailableLabel}`}</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
