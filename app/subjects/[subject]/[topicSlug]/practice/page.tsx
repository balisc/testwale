import { notFound } from 'next/navigation';
import QuestionPractice from '@/components/practice/QuestionPractice';
import PracticeBreadcrumb from '@/components/practice/PracticeBreadcrumb';
import { getLocalizedText } from '@/lib/localizedText';
import {
  buildExamQuery,
  getAllExams,
  getMixedQuestionsByTopic,
  getSubjectBySlug,
  getTopicBySlug,
  resolveExamCodeFromDb,
} from '@/lib/polity';
import { resolveSubjectSlug } from '@/lib/subjectRoutes';
import type { Metadata } from 'next';
import { buildPracticeMetadata } from '@/lib/seo';
import JsonLd from '@/components/JsonLd';
import { buildBreadcrumbListSchema } from '@/lib/breadcrumbSchema';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ subject: string; topicSlug: string }>;
  searchParams: Promise<{ exam?: string | string[] }>;
};

function resolveExamParam(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() || null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subject: routeSubject, topicSlug } = await params;
  const subjectSlug = resolveSubjectSlug(routeSubject);
  const subject = await getSubjectBySlug(subjectSlug);
  if (!subject) return { title: 'Practice not found', robots: { index: false, follow: true } };
  const topic = await getTopicBySlug(subject.id, topicSlug);
  if (!topic) return { title: 'Practice not found', robots: { index: false, follow: true } };

  const topicTitle = getLocalizedText(topic.title, 'en');
  const subjectTitle = getLocalizedText(subject.title, 'en');

  const practicePath = `/subjects/${subjectSlug}/${topicSlug}/practice`;
  return buildPracticeMetadata(topicTitle, subjectTitle, practicePath);
}

export default async function MixedTopicPracticePage({ params, searchParams }: PageProps) {
  const { subject: routeSubject, topicSlug } = await params;
  const subjectSlug = resolveSubjectSlug(routeSubject);
  const resolvedSearchParams = await searchParams;
  const examParam = resolveExamParam(resolvedSearchParams.exam);

  const subject = await getSubjectBySlug(subjectSlug);
  if (!subject) notFound();

  const topic = await getTopicBySlug(subject.id, topicSlug);
  if (!topic) notFound();

  const exams = await getAllExams();
  const examCode = buildExamQuery(examParam);
  const dbExamCode = examCode ? resolveExamCodeFromDb(exams, examCode) : undefined;
  const questions = await getMixedQuestionsByTopic(topic.id, dbExamCode);
  const backHref = examParam
    ? `/subjects/${subjectSlug}/${topicSlug}?exam=${encodeURIComponent(examParam)}`
    : `/subjects/${subjectSlug}/${topicSlug}`;

  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: 'Home', href: '/' },
    { name: getLocalizedText(subject.title, 'en'), href: `/subjects/${subjectSlug}` },
    { name: getLocalizedText(topic.title, 'en'), href: backHref },
    { name: 'Practice' },
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
          currentLabel={{ en: 'Mixed Practice', hi: 'मिश्रित अभ्यास' }}
        />
      </div>

      <QuestionPractice
        questions={questions}
        backHref={backHref}
        backLabel="Back to topic"
        titleLocalized={{
          en: `${getLocalizedText(topic.title, 'en')} — Mixed Practice`,
          hi: `${getLocalizedText(topic.title, 'hi')} — मिश्रित अभ्यास`,
        }}
        subjectId={subject.id}
        topicId={topic.id}
      />
    </div>
  );
}
