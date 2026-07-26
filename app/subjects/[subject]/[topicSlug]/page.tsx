import { getLocalizedText } from '@/lib/localizedText';
import { requireTopicByRouteSlugs, loadTopicByRouteSlugs, NOT_FOUND_METADATA } from '@/lib/catalogRouteGuards';
import TopicPageContent from './TopicPageContent';
import {
  buildExamQuery,
  getAllExams,
  getSubtopicsByTopic,
  normalizeExamCode,
} from '@/lib/polity';
import { hasPublishedRevisionForTopic, isRevisionPublished } from '@/lib/revision/registry';
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
  const row = await loadTopicByRouteSlugs(routeSubject, topicSlug);
  if (!row) return NOT_FOUND_METADATA;
  const { subject, subjectSlug, topic } = row;

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
  const resolvedSearchParams = await searchParams;
  const examParam = resolveExamParam(resolvedSearchParams.exam);

  const { subject, subjectSlug, topic } = await requireTopicByRouteSlugs(routeSubject, topicSlug);

  const exams = await getAllExams();
  const normalizedExam = buildExamQuery(examParam);
  const legacyExamMatch = normalizedExam
    ? exams.find((exam) => normalizeExamCode(exam.code) === normalizeExamCode(normalizedExam))
    : null;

  const subtopics = await getSubtopicsByTopic({
    topicId: topic.id,
    examCode: legacyExamMatch?.code,
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
      ? withExamQuery(
          `/subjects/${subjectSlug}/${topicSlug}/${subtopic.slug}/revision`,
          examParam,
        )
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
        examParam={legacyExamMatch ? examParam : null}
        mixedPracticeHref={mixedPracticeHref}
      />
    </div>
  );
}
