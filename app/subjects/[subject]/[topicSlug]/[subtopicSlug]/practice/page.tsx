import { notFound } from 'next/navigation';

import QuestionPractice from '@/components/practice/QuestionPractice';
import PracticeBreadcrumb from '@/components/practice/PracticeBreadcrumb';
import { getLocalizedText } from '@/lib/localizedText';
import {
  buildExamQuery,
  getAllExams,
  getQuestionBatchBySubtopic,
  getSubjectBySlug,
  getSubtopicBySlug,
  getTopicBySlug,
  resolveExamCodeFromDb,
} from '@/lib/polity';
import { resolveSubjectSlug } from '@/lib/subjectRoutes';
import { buildPracticeMetadata } from '@/lib/seo';
import JsonLd from '@/components/JsonLd';
import { buildBreadcrumbListSchema } from '@/lib/breadcrumbSchema';
import { QUESTION_BATCH_PAGE_SIZE } from '@/lib/supabaseQueryLimits';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ subject: string; topicSlug: string; subtopicSlug: string }>;
  searchParams: Promise<{ exam?: string | string[] }>;
};

function resolveExamParam(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() || null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subject: routeSubject, topicSlug, subtopicSlug } = await params;
  const subjectSlug = resolveSubjectSlug(routeSubject);
  const subject = await getSubjectBySlug(subjectSlug);
  if (!subject) return { title: 'Practice not found', robots: { index: false, follow: true } };
  const topic = await getTopicBySlug(subject.id, topicSlug);
  if (!topic) return { title: 'Practice not found', robots: { index: false, follow: true } };
  const subtopic = await getSubtopicBySlug(topic.id, subtopicSlug);
  if (!subtopic) return { title: 'Practice not found', robots: { index: false, follow: true } };

  const subtopicTitle = getLocalizedText(subtopic.title, 'en');
  const subjectTitle = getLocalizedText(subject.title, 'en');
  const practicePath = `/subjects/${subjectSlug}/${topicSlug}/${subtopicSlug}/practice`;

  return buildPracticeMetadata(subtopicTitle, subjectTitle, practicePath);
}

export default async function SubtopicPracticePage({ params, searchParams }: PageProps) {
  const { subject: routeSubject, topicSlug, subtopicSlug } = await params;
  const subjectSlug = resolveSubjectSlug(routeSubject);
  const resolvedSearchParams = await searchParams;
  const examParam = resolveExamParam(resolvedSearchParams.exam);

  const subject = await getSubjectBySlug(subjectSlug);
  if (!subject) notFound();

  const topic = await getTopicBySlug(subject.id, topicSlug);
  if (!topic) notFound();

  const subtopic = await getSubtopicBySlug(topic.id, subtopicSlug);
  if (!subtopic) notFound();

  const exams = await getAllExams();
  const examCode = buildExamQuery(examParam);
  const dbExamCode = examCode ? resolveExamCodeFromDb(exams, examCode) : undefined;

  const initialBatch = await getQuestionBatchBySubtopic(subtopic.id, dbExamCode, {
    batchSize: QUESTION_BATCH_PAGE_SIZE,
  });

  const backHref = examParam
    ? `/subjects/${subjectSlug}/${topicSlug}?exam=${encodeURIComponent(examParam)}`
    : `/subjects/${subjectSlug}/${topicSlug}`;

  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: 'Home', href: '/' },
    { name: getLocalizedText(subject.title, 'en'), href: `/subjects/${subjectSlug}` },
    { name: getLocalizedText(topic.title, 'en'), href: backHref },
    { name: getLocalizedText(subtopic.title, 'en') },
  ]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <JsonLd data={breadcrumbSchema} />
      <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        <PracticeBreadcrumb
          subjectSlug={subjectSlug}
          subjectTitle={subject.title}
          topicTitle={topic.title}
          topicHref={backHref}
          subtopicTitle={subtopic.title}
          currentLabel={{ en: 'Practice', hi: 'अभ्यास' }}
        />
      </div>

      <QuestionPractice
        questions={[]}
        initialQuestions={initialBatch.questions}
        initialNextCursor={initialBatch.nextCursor}
        initialHasMore={initialBatch.hasMore}
        questionBatchScope="subtopic"
        questionBatchScopeId={subtopic.id}
        examCode={dbExamCode}
        backHref={backHref}
        backLabel="Back to topic"
        titleLocalized={subtopic.title}
        seoTopic={topic.slug || topic.title}
        seoSubtopic={subtopic.slug || subtopic.title}
        subjectId={subject.id}
        topicId={topic.id}
        subtopicId={subtopic.id}
        totalQuestionCount={subtopic.question_count}
      />
    </div>
  );
}
