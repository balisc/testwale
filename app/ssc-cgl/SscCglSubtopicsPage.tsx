'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { QUESTION_BATCH_CACHE_VERSION } from '@/lib/questionBatchCache';
import {
  getSscCglQuestionsHref,
  getSscCglTopicsHref,
  type SscCglStageTaxonomy,
  type SscCglSubject,
  type SscCglTopic,
} from '@/lib/sscCglSyllabus';
import { pickCatalogText } from '@/lib/useCatalogText';
import SscCglPageHeader from './SscCglPageHeader';

export default function SscCglSubtopicsPage({
  taxonomy,
  subject,
  topic,
  questionCounts,
  questionBackedSubtopicIds,
}: {
  taxonomy: SscCglStageTaxonomy;
  subject: SscCglSubject;
  topic: SscCglTopic;
  questionCounts: Record<string, number>;
  questionBackedSubtopicIds: string[];
}) {
  const router = useRouter();
  const staleCountRefreshAttempted = useRef(false);
  const { language } = useLanguage();
  const { stage } = taxonomy;
  const stageName = pickCatalogText(stage.label, language);
  const subjectName = pickCatalogText(subject.title, language) || subject.code;
  const topicName = pickCatalogText(topic.title, language) || topic.code;
  const topicDescription = pickCatalogText(topic.description, language);
  const topicsHref = getSscCglTopicsHref(stage, subject.slug);
  const questionBackedSubtopics = new Set(questionBackedSubtopicIds);
  const hasPositiveQuestionCount = topic.subtopics.some(
    (subtopic) => (questionCounts[subtopic.id] ?? 0) > 0,
  );

  useEffect(() => {
    if (
      staleCountRefreshAttempted.current
      || questionBackedSubtopicIds.length === 0
      || hasPositiveQuestionCount
    ) return;
    staleCountRefreshAttempted.current = true;
    router.refresh();
  }, [hasPositiveQuestionCount, questionBackedSubtopicIds.length, router]);

  const copy = language === 'hi'
    ? {
        home: 'होम',
        exams: 'परीक्षाएँ',
        back: 'सभी टॉपिक',
        choose: 'उपविषय चुनें',
        instruction: 'प्रश्न अभ्यास शुरू करने के लिए एक उपविषय चुनें।',
        start: 'अभ्यास शुरू करें',
        questions: 'प्रश्न',
        soon: 'जल्द उपलब्ध',
        empty: 'इस टॉपिक के लिए अभी कोई उपविषय उपलब्ध नहीं है।',
      }
    : {
        home: 'Home',
        exams: 'Exams',
        back: 'Back to Topics',
        choose: 'Choose a Subtopic',
        instruction: 'Select one subtopic to start question practice.',
        start: 'Start Practice',
        questions: 'Questions',
        soon: 'Coming soon',
        empty: 'No subtopics are available for this topic yet.',
      };

  return (
    <main className="min-h-screen w-full min-w-0 max-w-full bg-[#F8FAFC] px-4 py-6 text-slate-900 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-6xl">
        <SscCglPageHeader
          activeStep={4}
          breadcrumbs={[
            { label: copy.home, href: '/' },
            { label: copy.exams },
            { label: 'SSC CGL', href: '/ssc-cgl' },
            { label: stageName, href: stage.href },
            { label: subject.title, href: topicsHref },
            { label: topic.title },
          ]}
          backHref={topicsHref}
          backLabel={copy.back}
          context={subject.title}
        />
        <section className="mt-6 w-full min-w-0 max-w-full">
          <p className="text-sm font-bold text-violet-700">{subjectName}</p>
          <h1 className="mt-1 break-words text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{topicName}</h1>
          {topicDescription ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{topicDescription}</p> : null}
          <div className="mt-7">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">{copy.choose}</h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">{copy.instruction}</p>
          </div>
          {topic.subtopics.length === 0 ? (
            <EmptyState message={copy.empty} />
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {topic.subtopics.map((subtopic) => {
                const description = pickCatalogText(subtopic.description, language);
                const questionCount = questionCounts[subtopic.id] ?? 0;
                const hasPublishedQuestionMapping = questionBackedSubtopics.has(subtopic.id);
                // contentGenerationAllowed governs authoring, not visibility of
                // verified questions that are already present in the database.
                // The stable mapping is a verified question-backed allowlist and
                // keeps a stale client-side count payload from locking the card.
                const isAvailable = questionCount > 0 || hasPublishedQuestionMapping;
                const content = (
                  <>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><CheckCircle2 className="h-6 w-6" aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words font-extrabold text-slate-950">{pickCatalogText(subtopic.title, language) || subtopic.code}</span>
                      {description ? <span className="mt-1 block break-words text-sm leading-5 text-slate-600">{description}</span> : null}
                      {questionCount > 0 ? <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{questionCount} {copy.questions}</span> : null}
                      {questionCount === 0 && hasPublishedQuestionMapping ? <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Questions available</span> : null}
                    </span>
                    <span className={`hidden min-h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-bold sm:inline-flex ${isAvailable ? 'bg-violet-700 text-white' : 'bg-slate-100 text-slate-500'}`}>{isAvailable ? copy.start : copy.soon}{isAvailable ? <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" /> : null}</span>
                    {isAvailable ? <ChevronRight className="h-5 w-5 shrink-0 text-violet-600 sm:hidden" aria-hidden="true" /> : null}
                  </>
                );
                return isAvailable ? (
                  <Link key={subtopic.id} data-ssc-cgl-subtopic-card prefetch={false} href={`${getSscCglQuestionsHref(stage, subject.slug, topic.slug, subtopic.slug)}?qb=${QUESTION_BATCH_CACHE_VERSION}`} className="group flex min-h-24 w-full min-w-0 max-w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-300 hover:bg-violet-50/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 sm:gap-4 sm:p-5">{content}</Link>
                ) : (
                  <div key={subtopic.id} data-ssc-cgl-subtopic-card aria-disabled="true" className="flex min-h-24 w-full min-w-0 max-w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-80 sm:gap-4 sm:p-5">{content}</div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">{message}</div>;
}
