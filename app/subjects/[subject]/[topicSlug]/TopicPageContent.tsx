'use client';

import Link from 'next/link';
import { BookOpen, ChevronRight, FileText, Layers, Rocket } from 'lucide-react';
import IconByKey from '@/components/IconByKey';
import { useLanguage } from '@/lib/LanguageContext';
import { useCatalogText } from '@/lib/useCatalogText';
import type { LocalizedText, Subject, SubtopicWithExamPriority, Topic } from '@/types/polity';
import { meaningfulCatalogDescription } from '@/lib/catalogDescription';

const IMPORTANCE_LABELS: Record<string, LocalizedText> = {
  high: { en: 'High', hi: 'उच्च' },
  medium: { en: 'Medium', hi: 'मध्यम' },
  low: { en: 'Low', hi: 'कम' },
};

function resolveImportanceLabel(subtopic: SubtopicWithExamPriority): LocalizedText | string | null {
  if (subtopic.importance_label?.en || subtopic.importance_label?.hi) {
    return subtopic.importance_label;
  }
  const key = subtopic.importance?.toLowerCase();
  if (key && IMPORTANCE_LABELS[key]) return IMPORTANCE_LABELS[key];
  return subtopic.importance ?? null;
}

const COPY = {
  en: {
    home: 'Home',
    subtopics: 'Subtopics',
    subtopicsHint: 'Pick a subtopic to start focused MCQ practice.',
    subtopicsExamHint: (exam: string) => `Subtopics ordered by ${exam} exam priority.`,
    noSubtopics: 'No subtopics available for this topic yet.',
    tryMixed: 'Try mixed practice instead',
    startMixed: 'Start Mixed Practice',
    startPractice: 'Start Practice',
    reviseSubtopic: 'Revise Subtopic',
    comingSoon: 'Coming soon',
    subtopicsLabel: 'subtopics',
    questionsLabel: 'questions',
    scope: 'Scope',
    topicFallback: (topic: string) => `Browse published subtopics and available practice questions for ${topic}.`,
    subtopicFallback: (subtopic: string) => `Focused MCQ practice for ${subtopic}.`,
  },
  hi: {
    home: 'होम',
    subtopics: 'उप-विषय',
    subtopicsHint: 'केंद्रित MCQ अभ्यास के लिए उप-विषय चुनें।',
    subtopicsExamHint: (exam: string) => `${exam} परीक्षा प्राथमिकता के अनुसार उप-विषय।`,
    noSubtopics: 'इस विषय के लिए अभी कोई उप-विषय उपलब्ध नहीं है।',
    tryMixed: 'इसके बजाय मिश्रित अभ्यास करें',
    startMixed: 'मिश्रित अभ्यास शुरू करें',
    startPractice: 'अभ्यास शुरू करें',
    reviseSubtopic: 'उप-विषय पुनरावृत्ति',
    comingSoon: 'जल्द उपलब्ध',
    subtopicsLabel: 'उप-विषय',
    questionsLabel: 'प्रश्न',
    scope: 'दायरा',
    topicFallback: (topic: string) => `${topic} के प्रकाशित उप-विषय और उपलब्ध अभ्यास प्रश्न देखें।`,
    subtopicFallback: (subtopic: string) => `${subtopic} के लिए केंद्रित MCQ अभ्यास।`,
  },
};

type SubtopicWithPracticeHref = SubtopicWithExamPriority & {
  practiceHref: string;
  revisionHref: string | null;
};

type TopicPageContentProps = {
  subject: Subject;
  topic: Topic;
  subtopics: SubtopicWithPracticeHref[];
  subjectSlug: string;
  subjectHref: string;
  examParam: string | null;
  mixedPracticeHref: string;
};

function SubtopicCard({
  subtopic,
  practiceHref,
  revisionHref,
  isExamPath,
  c,
}: {
  subtopic: SubtopicWithExamPriority;
  practiceHref: string;
  revisionHref: string | null;
  isExamPath: boolean;
  c: (typeof COPY)['en'];
}) {
  const title = useCatalogText(subtopic.title);
  const storedScope = useCatalogText(subtopic.scope ?? subtopic.description);
  const authoredScope = meaningfulCatalogDescription(storedScope);
  const scope = authoredScope ?? c.subtopicFallback(title);
  const importanceLabel = useCatalogText(resolveImportanceLabel(subtopic));
  const questionCount = Math.max(0, Number(subtopic.question_count ?? 0));

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-purple-300 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        {isExamPath && subtopic.priority != null && (
          <span className="shrink-0 rounded-md bg-[#F3E8FF] px-2 py-0.5 text-[10px] font-bold text-brand">
            #{subtopic.priority}
          </span>
        )}
      </div>
      {importanceLabel && isExamPath && (
        <span className="mt-2 inline-flex w-fit rounded-full border border-[#DDD6FE] bg-[#FAF5FF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
          {importanceLabel}
        </span>
      )}
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">
        {authoredScope ? <span className="font-semibold text-slate-700">{c.scope}: </span> : null}
        {scope}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="text-xs font-medium text-slate-500">
          {questionCount.toLocaleString()} {c.questionsLabel}
        </span>
        <div className="flex flex-wrap gap-2">
          {revisionHref ? (
            <Link
              href={revisionHref}
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-[#DDD6FE] bg-white px-4 py-2 text-xs font-semibold text-brand transition hover:border-brand hover:bg-[#FAF5FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <BookOpen className="h-4 w-4" aria-hidden />
              {c.reviseSubtopic}
            </Link>
          ) : null}
          {questionCount > 0 ? (
            <Link
              href={practiceHref}
              className="inline-flex min-h-11 items-center gap-1 rounded-full bg-[#F3E8FF] px-4 py-2 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              {c.startPractice}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <span className="inline-flex min-h-11 items-center rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-500">
              {c.comingSoon}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function TopicPageContent({
  subject,
  topic,
  subtopics,
  subjectHref,
  examParam,
  mixedPracticeHref,
}: TopicPageContentProps) {
  const { language } = useLanguage();
  const c = COPY[language];
  const subjectTitle = useCatalogText(subject.title);
  const topicTitle = useCatalogText(topic.title);
  const storedTopicScope = useCatalogText(topic.scope ?? topic.description);
  const authoredTopicScope = meaningfulCatalogDescription(storedTopicScope);
  const topicScope = authoredTopicScope ?? c.topicFallback(topicTitle);
  const isExamPath = Boolean(examParam && examParam.toUpperCase() !== 'ALL');
  const examDisplayName = isExamPath ? examParam!.toUpperCase() : null;
  const topicQuestionCount = Math.max(0, Number(topic.question_count ?? 0));

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
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
            <Link href={subjectHref} className="transition hover:text-brand">
              {subjectTitle}
            </Link>
          </li>
          <li aria-hidden className="text-slate-300">
            /
          </li>
          <li className="font-medium text-slate-700">{topicTitle}</li>
        </ol>
      </nav>

      <section className="rounded-3xl border border-[#EDE9FE] bg-gradient-to-br from-white via-[#FAF5FF] to-[#F5F3FF] px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3E8FF] text-brand">
                <IconByKey iconKey={topic.icon_key} className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">{subjectTitle}</p>
                <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{topicTitle}</h1>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              {authoredTopicScope ? <span className="font-semibold text-slate-800">{c.scope}: </span> : null}
              {topicScope}
            </p>
            <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2">
                <Layers className="h-4 w-4 text-brand" />
                {(topic.subtopic_count ?? subtopics.length).toLocaleString()} {c.subtopicsLabel}
              </span>
              <span className="inline-flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand" />
                {topicQuestionCount.toLocaleString()} {c.questionsLabel}
              </span>
            </div>
          </div>

          {topicQuestionCount > 0 ? (
            <Link
              href={mixedPracticeHref}
              className="inline-flex w-fit shrink-0 items-center gap-2 self-start rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(124,58,237,0.28)] transition hover:bg-[#6D28D9]"
            >
              <Rocket className="h-4 w-4" />
              {c.startMixed}
            </Link>
          ) : (
            <span className="inline-flex w-fit shrink-0 rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-500">
              {c.comingSoon}
            </span>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{c.subtopics}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {isExamPath && examDisplayName ? c.subtopicsExamHint(examDisplayName) : c.subtopicsHint}
        </p>

        {subtopics.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-sm text-slate-500">{c.noSubtopics}</p>
            {topicQuestionCount > 0 ? (
              <Link
                href={mixedPracticeHref}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
              >
                {c.tryMixed}
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {subtopics.map((subtopic) => (
              <SubtopicCard
                key={subtopic.id}
                subtopic={subtopic}
                practiceHref={subtopic.practiceHref}
                revisionHref={subtopic.revisionHref}
                isExamPath={isExamPath}
                c={c}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
