import { notFound } from 'next/navigation';
import { getLocalizedText } from '@/lib/localizedText';
import SubjectPageContent from './SubjectPageContent';
import {
  buildExamQuery,
  getAllExams,
  getExamWiseTopics,
  getSubjectBySlug,
  getTopicsBySubject,
  resolveExamCodeFromDb,
} from '@/lib/polity';
import { resolveSubjectSlug } from '@/lib/subjectRoutes';
import type { Metadata } from 'next';
import { buildCatalogSubjectMetadata } from '@/lib/seo';
import JsonLd from '@/components/JsonLd';
import { buildBreadcrumbListSchema } from '@/lib/breadcrumbSchema';

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ subject: string }>;
  searchParams: Promise<{ exam?: string | string[] }>;
};

function resolveExamParam(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() || null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subject: routeSubject } = await params;
  const subjectSlug = resolveSubjectSlug(routeSubject);
  const subject = await getSubjectBySlug(subjectSlug);

  if (!subject) {
    return {
      title: 'Subject not found',
      description: 'The requested subject does not exist.',
      robots: { index: false, follow: true },
    };
  }

  const titleEn = getLocalizedText(subject.title, 'en');
  const descEn = getLocalizedText(subject.description, 'en');

  return buildCatalogSubjectMetadata(titleEn, subjectSlug, descEn || undefined);
}

export default async function SubjectSlugPage({ params, searchParams }: PageProps) {
  const { subject: routeSubject } = await params;
  const subjectSlug = resolveSubjectSlug(routeSubject);
  const resolvedSearchParams = await searchParams;
  const examParam = resolveExamParam(resolvedSearchParams.exam);
  const examCode = buildExamQuery(examParam);

  const [subject, exams] = await Promise.all([getSubjectBySlug(subjectSlug), getAllExams()]);

  if (!subject) {
    notFound();
  }

  const dbExamCode = examCode ? resolveExamCodeFromDb(exams, examCode) : undefined;
  const topics = dbExamCode
    ? await getExamWiseTopics(subject.id, dbExamCode)
    : await getTopicsBySubject(subject.id);

  const topicCount = subject.topic_count ?? topics.length;
  const questionCount = subject.question_count ?? 0;
  const titleEn = getLocalizedText(subject.title, 'en');

  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: 'Home', href: '/' },
    { name: 'Subjects', href: '/subjects' },
    { name: titleEn },
  ]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <JsonLd data={breadcrumbSchema} />
      <SubjectPageContent
        subject={subject}
        subjectSlug={subjectSlug}
        topics={topics}
        exams={exams}
        examCode={examParam}
        topicCount={topicCount}
        questionCount={questionCount}
      />
    </div>
  );
}
