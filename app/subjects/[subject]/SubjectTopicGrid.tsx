'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import IconByKey from '@/components/IconByKey';
import PracticePathBuilder from '@/components/PracticePathBuilder';
import { useLanguage } from '@/lib/LanguageContext';
import { useCatalogText } from '@/lib/useCatalogText';
import { normalizeExamCode } from '@/lib/examCode';
import type { Exam, Topic, TopicWithPriority } from '@/types/polity';
import type { PolityRankedExamOption } from '@/types/polityExamRankingV2';
import { topicMatchesSearch } from './SubjectPageContent';

type SubjectTopicGridProps = {
  subjectSlug: string;
  subjectTitle: string;
  topics: Topic[] | TopicWithPriority[];
  examCode: string | null;
  exams: Exam[];
  rankedExams?: PolityRankedExamOption[];
  examLocked?: boolean;
};

function isPriorityTopic(topic: Topic | TopicWithPriority): topic is TopicWithPriority {
  return 'priority' in topic;
}

function buildTopicHref(subjectSlug: string, topicSlug: string, examCode: string | null) {
  const base = `/subjects/${subjectSlug}/${topicSlug}`;
  if (!examCode || examCode.toUpperCase() === 'ALL') return base;
  return `${base}?exam=${encodeURIComponent(normalizeExamCode(examCode))}`;
}

function TopicCard({
  topic,
  subjectSlug,
  examCode,
  isExamPath,
  index,
  c,
}: {
  topic: Topic | TopicWithPriority;
  subjectSlug: string;
  examCode: string | null;
  isExamPath: boolean;
  index: number;
  c: {
    viewSubtopics: string;
    subtopics: string;
    questions: string;
    scope: string;
  };
}) {
  const title = useCatalogText(topic.title);
  const scope = useCatalogText(topic.scope ?? topic.description);
  // Always call hook — never inside ternary (Rules of Hooks)
  const importanceText = useCatalogText(isPriorityTopic(topic) ? topic.importance : null);
  const importance = isPriorityTopic(topic) && importanceText ? importanceText : null;
  const priority = isPriorityTopic(topic) ? topic.priority : index + 1;
  const href = buildTopicHref(subjectSlug, topic.slug, examCode);

  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-brand sm:h-11 sm:w-11">
          <IconByKey iconKey={topic.icon_key} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-base font-bold leading-snug text-slate-900 group-hover:text-brand">{title}</h3>
            {isExamPath && (
              <span className="shrink-0 rounded-md bg-[#F3E8FF] px-2 py-0.5 text-[10px] font-bold text-brand">
                #{priority}
              </span>
            )}
          </div>
          {importance && (
            <span className="mt-1 inline-flex rounded-full border border-[#DDD6FE] bg-[#FAF5FF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
              {importance}
            </span>
          )}
        </div>
      </div>

      {scope && (
        <p className="mt-3 line-clamp-3 flex-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
          <span className="font-semibold text-slate-700">{c.scope}: </span>
          {scope}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          {(topic.subtopic_count ?? 0) > 0 && (
            <span>
              {topic.subtopic_count} {c.subtopics}
            </span>
          )}
          {(topic.question_count ?? 0) > 0 && (
            <span>
              {topic.question_count?.toLocaleString()} {c.questions}
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
          {c.viewSubtopics}
          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

const COPY = {
  en: {
    chooseTopic: 'Choose a Topic',
    recommendedPath: (exam: string) => `Recommended ${exam} Practice Path`,
    examOrder: (exam: string) => `Topics ordered by ${exam} exam priority.`,
    selectTopic: (subject: string) => `Select a topic in ${subject} to view subtopics.`,
    searchPh: 'Search topics...',
    noTopics: 'No topics available for this subject yet.',
    noMatch: 'No topics match your search.',
    viewSubtopics: 'View Subtopics',
    subtopics: 'subtopics',
    questions: 'questions',
    scope: 'Scope',
  },
  hi: {
    chooseTopic: 'एक विषय चुनें',
    recommendedPath: (exam: string) => `अनुशंसित ${exam} अभ्यास पथ`,
    examOrder: (exam: string) => `${exam} परीक्षा प्राथमिकता के अनुसार विषय।`,
    selectTopic: (subject: string) => `${subject} में उप-विषय देखने के लिए विषय चुनें।`,
    searchPh: 'विषय खोजें...',
    noTopics: 'इस विषय के लिए अभी कोई टॉपिक उपलब्ध नहीं है।',
    noMatch: 'आपकी खोज से कोई विषय नहीं मिला।',
    viewSubtopics: 'उप-विषय देखें',
    subtopics: 'उप-विषय',
    questions: 'प्रश्न',
    scope: 'दायरा',
  },
};

export default function SubjectTopicGrid({
  subjectSlug,
  subjectTitle,
  topics,
  examCode,
  exams,
  rankedExams,
  examLocked = false,
}: SubjectTopicGridProps) {
  const { language } = useLanguage();
  const c = COPY[language];
  const [search, setSearch] = useState('');
  const isExamPath = Boolean(examCode && examCode.toUpperCase() !== 'ALL');
  const matchedRankedExam = rankedExams?.find(
    (exam) => examCode && normalizeExamCode(exam.exam_code) === normalizeExamCode(examCode),
  );
  const matchedExam = exams.find(
    (exam) => examCode && normalizeExamCode(exam.code) === normalizeExamCode(examCode),
  );
  const localizedExamTitle = useCatalogText(
    matchedRankedExam?.title ?? matchedExam?.title ?? (isExamPath ? examCode : null),
  );

  const filteredTopics = useMemo(() => {
    if (!search.trim()) return topics;
    return topics.filter((topic) => topicMatchesSearch(topic, search));
  }, [topics, search]);

  const sectionTitle = isExamPath && localizedExamTitle
    ? c.recommendedPath(localizedExamTitle)
    : c.chooseTopic;

  return (
    <>
      <section id="subject-topics" className="mt-10 sm:mt-12 scroll-mt-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{sectionTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {isExamPath && localizedExamTitle
                ? c.examOrder(localizedExamTitle)
                : c.selectTopic(subjectTitle)}
            </p>
          </div>
          <label className="relative w-full sm:w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={c.searchPh}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-[#EDE9FE]"
            />
          </label>
        </div>

        {filteredTopics.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-sm text-slate-500">{topics.length === 0 ? c.noTopics : c.noMatch}</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 md:gap-5">
            {filteredTopics.map((topic, index) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                subjectSlug={subjectSlug}
                examCode={examCode}
                isExamPath={isExamPath}
                index={index}
                c={c}
              />
            ))}
          </div>
        )}
      </section>

      {!examLocked ? (
        <PracticePathBuilder
          subjectSlug={subjectSlug}
          exams={exams}
          rankedExams={rankedExams}
          selectedExam={examCode}
        />
      ) : null}
    </>
  );
}
