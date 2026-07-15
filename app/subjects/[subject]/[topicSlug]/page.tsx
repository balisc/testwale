import { notFound } from 'next/navigation';
import { getLocalizedText } from '@/lib/localizedText';
import TopicPageContent from './TopicPageContent';
import {
  buildExamQuery,
  getAllExams,
  getSubjectBySlug,
  getSubtopicsByTopic,
  getTopicBySlug,
  resolveExamCodeFromDb,
} from '@/lib/polity';
import { hasPublishedRevisionForTopic, isRevisionPublished } from '@/lib/revision/registry';
import { resolveSubjectSlug } from '@/lib/subjectRoutes';
import type { Metadata } from 'next';
import { buildCatalogTopicMetadata } from '@/lib/seo';
import JsonLd from '@/components/JsonLd';
import { buildBreadcrumbListSchema } from '@/lib/breadcrumbSchema';

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ subject: string; topicSlug: string }>;
  searchParams: Promise<{ exam?: string | string[] }>;
};

function resolveExamParam(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() || null;
}

function withExamQuery(path: string, examParam: string | null) {
  const examCode = buildExamQuery(examParam);
  if (!examCode) return path;
  return `${path}?exam=${encodeURIComponent(examCode)}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subject: routeSubject, topicSlug } = await params;
  const subjectSlug = resolveSubjectSlug(routeSubject);
  const subject = await getSubjectBySlug(subjectSlug);
  if (!subject) {
    return { title: 'Topic not found', robots: { index: false, follow: true } };
  }
  const topic = await getTopicBySlug(subject.id, topicSlug);
  if (!topic) {
    return { title: 'Topic not found', robots: { index: false, follow: true } };
  }

  const topicTitle = getLocalizedText(topic.title, 'en');
  const subjectTitle = getLocalizedText(subject.title, 'en');
  const topicDesc = getLocalizedText(topic.description, 'en');

  const metadata = buildCatalogTopicMetadata(
    topicTitle,
    subjectTitle,
    subjectSlug,
    topicSlug,
    topicDesc || undefined,
  );
  const hasSearchValue =
    Number(topic.question_count ?? 0) > 0 ||
    hasPublishedRevisionForTopic(subjectSlug, topicSlug);

  return hasSearchValue
    ? metadata
    : { ...metadata, robots: { index: false, follow: true } };
}

export default async function TopicPage({ params, searchParams }: PageProps) {
  const { subject: routeSubject, topicSlug } = await params;
  const subjectSlug = resolveSubjectSlug(routeSubject);
  const resolvedSearchParams = await searchParams;
  const examParam = resolveExamParam(resolvedSearchParams.exam);

  const subject = await getSubjectBySlug(subjectSlug);
  if (!subject) notFound();

  const topic = await getTopicBySlug(subject.id, topicSlug);
  if (!topic) notFound();

  const exams = await getAllExams();
  const normalizedExam = buildExamQuery(examParam);
  const dbExamCode = normalizedExam ? resolveExamCodeFromDb(exams, normalizedExam) : undefined;

  const subtopics = await getSubtopicsByTopic({
    topicId: topic.id,
    examCode: dbExamCode,
  });
  const subjectHref = withExamQuery(`/subjects/${subjectSlug}`, examParam);
  const mixedPracticeHref = withExamQuery(
    `/subjects/${subjectSlug}/${topicSlug}/practice`,
    examParam,
  );
  const subtopicsWithLinks = subtopics.map((subtopic) => ({
    ...subtopic,
    practiceHref: withExamQuery(
      `/subjects/${subjectSlug}/${topicSlug}/${subtopic.slug}/practice`,
      examParam,
    ),
    revisionHref: isRevisionPublished(subjectSlug, topicSlug, subtopic.slug)
      ? `/subjects/${subjectSlug}/${topicSlug}/${subtopic.slug}/revision`
      : null,
  }));

  const subjectTitle = getLocalizedText(subject.title, 'en');
  const topicTitle = getLocalizedText(topic.title, 'en');
  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: 'Home', href: '/' },
    { name: subjectTitle, href: `/subjects/${subjectSlug}` },
    { name: topicTitle },
  ]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <JsonLd data={breadcrumbSchema} />
      <TopicPageContent
        subject={subject}
        topic={topic}
        subtopics={subtopicsWithLinks}
        subjectSlug={subjectSlug}
        subjectHref={subjectHref}
        examParam={examParam}
        mixedPracticeHref={mixedPracticeHref}
      />
    </div>
  );
}
