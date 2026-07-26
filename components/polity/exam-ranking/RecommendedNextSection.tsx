'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { buildPracticeHref } from '@/lib/polity/examRankingProgress';
import { useCatalogText } from '@/lib/useCatalogText';
import type { PolitySubtopicRankingRow } from '@/types/polityExamRankingV2';

type RecommendedNextSectionProps = {
  subtopics: PolitySubtopicRankingRow[];
  subjectSlug: string;
  examCode: string;
};

const COPY = {
  en: {
    title: 'Recommended next',
    subtitle: 'Start with the highest-priority recommended subtopic for your exam.',
    start: 'Start now',
  },
  hi: {
    title: 'अगला अनुशंसित',
    subtitle: 'अपनी परीक्षा के लिए सर्वोच्च प्राथमिकता वाले उप-विषय से शुरू करें।',
    start: 'अभी शुरू करें',
  },
};

export default function RecommendedNextSection({
  subtopics,
  subjectSlug,
  examCode,
}: RecommendedNextSectionProps) {
  const { language } = useLanguage();
  const c = COPY[language];

  const next = subtopics.find((row) => row.is_recommended) ?? subtopics[0];
  const title = useCatalogText(next?.subtopic.title ?? null);
  const topicTitle = useCatalogText(next?.topic.title ?? null);
  const href = next
    ? buildPracticeHref(subjectSlug, next.topic.slug, next.subtopic.slug, examCode)
    : null;

  if (!next || !href) return null;

  return (
    <section className="rounded-2xl border border-[#DDD6FE] bg-[#FAF5FF] p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-sm">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">{c.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{c.subtitle}</p>
            <p className="mt-2 text-sm font-semibold text-brand">
              #{next.priority} · {title}
            </p>
            <p className="text-xs text-slate-500">{topicTitle}</p>
          </div>
        </div>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          {c.start}
        </Link>
      </div>
    </section>
  );
}
