'use client';

import Link from 'next/link';
import { BookOpen, ListOrdered } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import type { PolityEntityProgress } from '@/types/polityExamRankingV2';
import type { PolityRankedExamOption } from '@/types/polityExamRankingV2';
import { useCatalogText } from '@/lib/useCatalogText';
import RankingEvidenceBadge from './RankingEvidenceBadge';

type ExamRankingSummaryProps = {
  exam: PolityRankedExamOption;
  topicCount: number;
  subtopicCount: number;
  overallProgress: PolityEntityProgress | null;
  recommendedPracticeHref: string | null;
  syllabusAnchorId?: string;
  onOpenEvidence: () => void;
  evidence: Parameters<typeof RankingEvidenceBadge>[0]['evidence'];
};

const COPY = {
  en: {
    title: (exam: string) => `Indian Polity for ${exam}`,
    topicsSubtopics: (topics: number, subtopics: number) => `${topics} topics • ${subtopics} subtopics`,
    progress: 'Overall progress',
    startRecommended: 'Start Recommended Practice',
    viewSyllabus: 'View Ranked Syllabus',
    guestHint: 'Sign in to track your progress across topics.',
    stage: 'Stage',
    paper: 'Paper',
  },
  hi: {
    title: (exam: string) => `${exam} के लिए भारतीय राजव्यवस्था`,
    topicsSubtopics: (topics: number, subtopics: number) => `${topics} विषय • ${subtopics} उप-विषय`,
    progress: 'कुल प्रगति',
    startRecommended: 'अनुशंसित अभ्यास शुरू करें',
    viewSyllabus: 'रैंक किया पाठ्यक्रम देखें',
    guestHint: 'विषय-वार प्रगति देखने के लिए साइन इन करें।',
    stage: 'चरण',
    paper: 'पेपर',
  },
};

export default function ExamRankingSummary({
  exam,
  topicCount,
  subtopicCount,
  overallProgress,
  recommendedPracticeHref,
  syllabusAnchorId = 'ranked-syllabus',
  onOpenEvidence,
  evidence,
}: ExamRankingSummaryProps) {
  const { language } = useLanguage();
  const c = COPY[language];
  const examTitle = useCatalogText(exam.title);
  const heading = c.title(examTitle);

  const metaParts = [exam.stage, exam.paper ? `${c.paper} ${exam.paper}` : null].filter(Boolean);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#EDE9FE] bg-gradient-to-br from-[#FAF5FF] via-white to-[#F5F3FF] px-5 py-7 shadow-sm sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute -right-10 top-0 h-48 w-48 rounded-full bg-brand/10 blur-3xl" />
      <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end">
        <div className="min-w-0 space-y-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              {heading}
            </h1>
            {metaParts.length > 0 && (
              <p className="mt-2 text-sm text-slate-600">{metaParts.join(' · ')}</p>
            )}
            <p className="mt-3 text-sm font-medium text-slate-700">
              {c.topicsSubtopics(topicCount, subtopicCount)}
            </p>
          </div>

          <RankingEvidenceBadge evidence={evidence} onOpenDetails={onOpenEvidence} />

          {overallProgress && overallProgress.total != null && overallProgress.percent != null && (
            <div className="max-w-md rounded-2xl border border-slate-100 bg-white/90 p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-slate-700">{c.progress}</span>
                <span className="font-bold text-brand">{overallProgress.percent}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EDE9FE]">
                <div
                  className="h-full rounded-full bg-brand transition-[width] motion-reduce:transition-none"
                  style={{ width: `${overallProgress.percent}%` }}
                  role="progressbar"
                  aria-valuenow={overallProgress.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          {recommendedPracticeHref ? (
            <Link
              href={recommendedPracticeHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(109,40,217,0.28)] transition hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <BookOpen className="h-4 w-4" />
              {c.startRecommended}
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-slate-200 px-5 py-3.5 text-sm font-bold text-slate-500"
            >
              <BookOpen className="h-4 w-4" />
              {c.startRecommended}
            </button>
          )}
          <a
            href={`#${syllabusAnchorId}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#DDD6FE] bg-white px-5 py-3.5 text-sm font-semibold text-brand transition hover:border-brand hover:bg-[#FAF5FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <ListOrdered className="h-4 w-4" />
            {c.viewSyllabus}
          </a>
        </div>
      </div>
    </section>
  );
}
