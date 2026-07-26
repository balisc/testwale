'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import {
  buildPracticeHref,
  buildRankingProgressMaps,
} from '@/lib/polity/examRankingProgress';
import { usePolityExamSelection } from '@/lib/polity/usePolityExamSelection';
import type { UserProgressDashboard } from '@/lib/practiceAnalytics';
import type { PolityExamRankingBundle, PolityRankedExamOption } from '@/types/polityExamRankingV2';
import ExamRankingSummary from './ExamRankingSummary';
import PolityExamSelector from './PolityExamSelector';
import RankingEvidenceDrawer from './RankingEvidenceDrawer';
import RecommendedNextSection from './RecommendedNextSection';
import SubtopicRankingFilters, { type SubtopicFilterState } from './SubtopicRankingFilters';
import SubtopicRankingList from './SubtopicRankingList';
import TopicPriorityGrid, { type TopicFilter } from './TopicPriorityGrid';

type IndianPolityRankingShellProps = {
  subjectSlug: string;
  examOptions: PolityRankedExamOption[];
  initialBundle: PolityExamRankingBundle | null;
  initialExamCode: string | null;
  initialInvalidExam: boolean;
  fetchError?: boolean;
};

const TOPIC_FILTERS: TopicFilter[] = ['recommended', 'all', 'high', 'in_progress', 'completed'];

const COPY = {
  en: {
    home: 'Home',
    subjects: 'Subjects',
    chooseExam: 'Choose a target exam to see ranked topics and subtopics.',
    invalidExam: (code: string) => `"${code}" is not a valid ranked Polity exam code.`,
    invalidHint: 'Pick a supported exam from the selector below.',
    emptyRanking: 'Ranking data is not available for this exam yet.',
    loadError: 'Could not load ranking data.',
    retry: 'Retry',
    guestProgress: 'Sign in to track topic and subtopic progress.',
    signIn: 'Sign in',
    topicSection: 'Topic priority',
    subtopicSection: 'Subtopic ranking',
    filters: {
      recommended: 'Recommended',
      all: 'All topics',
      high: 'High priority',
      in_progress: 'In progress',
      completed: 'Completed',
    },
    stickyCta: 'Start Recommended Practice',
  },
  hi: {
    home: 'होम',
    subjects: 'विषय',
    chooseExam: 'रैंक किए विषय और उप-विषय देखने के लिए लक्ष्य परीक्षा चुनें।',
    invalidExam: (code: string) => `"${code}" एक मान्य रैंक किया Polity परीक्षा कोड नहीं है।`,
    invalidHint: 'नीचे से एक समर्थित परीक्षा चुनें।',
    emptyRanking: 'इस परीक्षा के लिए रैंकिंग डेटा अभी उपलब्ध नहीं है।',
    loadError: 'रैंकिंग डेटा लोड नहीं हो सका।',
    retry: 'पुनः प्रयास',
    guestProgress: 'विषय और उप-विषय प्रगति देखने के लिए साइन इन करें।',
    signIn: 'साइन इन',
    topicSection: 'विषय प्राथमिकता',
    subtopicSection: 'उप-विषय रैंकिंग',
    filters: {
      recommended: 'अनुशंसित',
      all: 'सभी विषय',
      high: 'उच्च प्राथमिकता',
      in_progress: 'प्रगति में',
      completed: 'पूर्ण',
    },
    stickyCta: 'अनुशंसित अभ्यास शुरू करें',
  },
};

const DEFAULT_SUBTOPIC_FILTERS: SubtopicFilterState = {
  query: '',
  importance: 'all',
  recommendedOnly: false,
  progress: 'all',
  depth: 'all',
};

export default function IndianPolityRankingShell({
  subjectSlug,
  examOptions,
  initialBundle,
  initialExamCode,
  initialInvalidExam,
  fetchError = false,
}: IndianPolityRankingShellProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const c = COPY[language];

  const { selectedExam, selectedExamCode, isInvalidExam, invalidExamCode, selectExam } =
    usePolityExamSelection({
      examOptions,
      initialExamCode,
      initialInvalid: initialInvalidExam,
    });

  const [topicFilter, setTopicFilter] = useState<TopicFilter>('recommended');
  const [subtopicFilters, setSubtopicFilters] = useState<SubtopicFilterState>(DEFAULT_SUBTOPIC_FILTERS);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [dashboard, setDashboard] = useState<UserProgressDashboard | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);

  const bundle =
    selectedExamCode && initialBundle?.examCode === selectedExamCode ? initialBundle : null;

  const topics = useMemo(() => bundle?.topics ?? [], [bundle]);
  const subtopics = useMemo(() => bundle?.subtopics ?? [], [bundle]);
  const evidenceRow = topics[0] ?? subtopics[0] ?? null;

  useEffect(() => {
    if (!user) {
      setDashboard(null);
      return;
    }

    setProgressLoading(true);
    fetch('/api/practice/dashboard', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error('failed');
        return (await res.json()) as UserProgressDashboard;
      })
      .then(setDashboard)
      .catch(() => {
        setDashboard(null);
      })
      .finally(() => setProgressLoading(false));
  }, [user, selectedExamCode]);

  const progressMaps = useMemo(
    () => buildRankingProgressMaps(dashboard, topics, subtopics),
    [dashboard, topics, subtopics],
  );

  const recommendedPracticeHref = useMemo(() => {
    if (!selectedExamCode || subtopics.length === 0) return null;
    const next = subtopics.find((row) => row.is_recommended) ?? subtopics[0];
    return buildPracticeHref(subjectSlug, next.topic.slug, next.subtopic.slug, selectedExamCode);
  }, [selectedExamCode, subtopics, subjectSlug]);

  const showInvalid = isInvalidExam && invalidExamCode;
  const showChooseExam = !selectedExam && !showInvalid;
  const showEmptyRanking = selectedExam && !fetchError && topics.length === 0;

  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      <nav className="mb-5 text-sm text-slate-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="transition hover:text-brand">
              {c.home}
            </Link>
          </li>
          <li aria-hidden className="text-slate-300">
            /
          </li>
          <li>
            <Link href="/subjects" className="transition hover:text-brand">
              {c.subjects}
            </Link>
          </li>
          <li aria-hidden className="text-slate-300">
            /
          </li>
          <li className="font-medium text-slate-700">
            {language === 'hi' ? 'भारतीय राजव्यवस्था' : 'Indian Polity'}
          </li>
        </ol>
      </nav>

      <div className="mb-6">
        <PolityExamSelector
          exams={examOptions}
          selectedExam={selectedExam}
          onSelect={selectExam}
        />
      </div>

      {fetchError && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-red-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">{c.loadError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold underline"
            >
              <RefreshCw className="h-4 w-4" />
              {c.retry}
            </button>
          </div>
        </div>
      )}

      {showInvalid && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-900">
          <p className="font-semibold">{c.invalidExam(invalidExamCode ?? '')}</p>
          <p className="mt-1 text-sm">{c.invalidHint}</p>
        </div>
      )}

      {showChooseExam && (
        <div className="rounded-2xl border border-dashed border-[#DDD6FE] bg-white px-6 py-12 text-center">
          <p className="text-sm text-slate-600">{c.chooseExam}</p>
        </div>
      )}

      {selectedExam && evidenceRow && !showEmptyRanking && (
        <>
          <ExamRankingSummary
            exam={selectedExam}
            topicCount={topics.length}
            subtopicCount={subtopics.length}
            overallProgress={progressMaps.overall}
            recommendedPracticeHref={recommendedPracticeHref}
            onOpenEvidence={() => setEvidenceOpen(true)}
            evidence={evidenceRow}
          />

          {!user && (
            <p className="mt-4 text-sm text-slate-500">
              {c.guestProgress}{' '}
              <Link href="/login" className="font-semibold text-brand hover:underline">
                {c.signIn}
              </Link>
            </p>
          )}

          {user && progressLoading && (
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-brand" />
              …
            </div>
          )}

          <div className="mt-8">
            <RecommendedNextSection
              subtopics={subtopics}
              subjectSlug={subjectSlug}
              examCode={selectedExamCode!}
            />
          </div>

          <section id="ranked-syllabus" className="mt-10 scroll-mt-24">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{c.topicSection}</h2>
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {TOPIC_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setTopicFilter(filter)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                      topicFilter === filter
                        ? 'bg-brand text-white'
                        : 'border border-slate-200 bg-white text-slate-600 hover:border-[#DDD6FE]'
                    }`}
                  >
                    {c.filters[filter]}
                  </button>
                ))}
              </div>
            </div>

            <TopicPriorityGrid
              topics={topics}
              subtopics={subtopics}
              progressMaps={progressMaps}
              subjectSlug={subjectSlug}
              examCode={selectedExamCode!}
              filter={topicFilter}
            />
          </section>

          <section className="mt-12">
            <h2 className="mb-4 text-xl font-bold text-slate-900 sm:text-2xl">{c.subtopicSection}</h2>
            <SubtopicRankingFilters value={subtopicFilters} onChange={setSubtopicFilters} />
            <div className="mt-4">
              <SubtopicRankingList
                subtopics={subtopics}
                progressMaps={progressMaps}
                subjectSlug={subjectSlug}
                examCode={selectedExamCode!}
                filters={subtopicFilters}
              />
            </div>
          </section>

          <RankingEvidenceDrawer
            open={evidenceOpen}
            onClose={() => setEvidenceOpen(false)}
            evidence={evidenceRow}
            examTitle={selectedExam.title.en ?? selectedExam.exam_code}
          />
        </>
      )}

      {showEmptyRanking && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-sm text-slate-500">{c.emptyRanking}</p>
        </div>
      )}

      {recommendedPracticeHref && selectedExam && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
          <Link
            href={recommendedPracticeHref}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white"
          >
            {c.stickyCta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
