import QuestionPractice from '@/components/practice/QuestionPractice';
import PracticeBreadcrumb from '@/components/practice/PracticeBreadcrumb';
import { requireSubtopicByRouteSlugs, loadSubtopicByRouteSlugs, NOT_FOUND_METADATA } from '@/lib/catalogRouteGuards';
import { getLocalizedText } from '@/lib/localizedText';
import {
  buildExamQuery,
  getQuestionBatchBySubtopic,
} from '@/lib/polity';
import { resolvePracticeExamQuestionTag } from '@/lib/polity/practiceExamFilter';
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
  const row = await loadSubtopicByRouteSlugs(routeSubject, topicSlug, subtopicSlug);
  if (!row) return NOT_FOUND_METADATA;
  const { subject, subjectSlug, subtopic } = row;

  const subtopicTitle = getLocalizedText(subtopic.title, 'en');
  const subjectTitle = getLocalizedText(subject.title, 'en');
  const practicePath = `/subjects/${subjectSlug}/${topicSlug}/${subtopicSlug}/practice`;

  return buildPracticeMetadata(subtopicTitle, subjectTitle, practicePath);
}

export default async function SubtopicPracticePage({ params, searchParams }: PageProps) {
  const { subject: routeSubject, topicSlug, subtopicSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const examParam = resolveExamParam(resolvedSearchParams.exam);

  const { subject, subjectSlug, topic, subtopic } = await requireSubtopicByRouteSlugs(
    routeSubject,
    topicSlug,
    subtopicSlug,
  );

  const examCode = buildExamQuery(examParam);
  const practiceTag = examCode ? await resolvePracticeExamQuestionTag(examCode) : undefined;

  const initialBatch = await getQuestionBatchBySubtopic(subtopic.id, practiceTag, {
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
        <h1 className="sr-only">
          {getLocalizedText(subtopic.title, 'en')} — MCQ Practice
        </h1>
      </div>

      <QuestionPractice
        questions={[]}
        initialQuestions={initialBatch.questions}
        initialNextCursor={initialBatch.nextCursor}
        initialHasMore={initialBatch.hasMore}
        questionBatchScope="subtopic"
        questionBatchScopeId={subtopic.id}
        examCode={practiceTag}
        backHref={backHref}
        backLabel="Back to topic"
        titleLocalized={subtopic.title}
        seoTopic={topic.slug || topic.title}
        seoSubtopic={subtopic.slug || subtopic.title}
        subjectId={subject.id}
        topicId={topic.id}
        subtopicId={subtopic.id}
        subjectSlug={subjectSlug}
        topicSlug={topicSlug}
        subtopicSlug={subtopicSlug}
        totalQuestionCount={subtopic.question_count}
      />
    </div>
  );
}
