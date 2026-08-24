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
import { getSelectedExamLearning } from '@/lib/examLearningServer';
import ExamContentUnavailable from '@/components/ExamContentUnavailable';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import {
  findPublishedSyllabusSubject,
  findPublishedSyllabusTopic,
} from '@/lib/examSyllabus';
import { isSscCglExamCode } from '@/lib/sscCglSyllabus';

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

  const selected = await getSelectedExamLearning();
  if (selected.status === 'incomplete') {
    redirect(`/onboarding?returnTo=${encodeURIComponent(`/subjects/${routeSubject}/${topicSlug}`)}`);
  }
  if (selected.status === 'inactive') return <ExamContentUnavailable reason="inactive_exam" />;
  if (selected.status === 'error') return <ExamContentUnavailable reason="error" />;
  if (selected.status === 'ready') {
    if (isSscCglExamCode(selected.snapshot.exam.code)) redirect('/ssc-cgl');
    const scopedSubject = findPublishedSyllabusSubject(selected.snapshot.subjects, routeSubject);
    if (!scopedSubject) notFound();
    const scopedTopic = findPublishedSyllabusTopic(
      selected.snapshot.topics,
      scopedSubject.id,
      topicSlug,
    );
    if (!scopedTopic) notFound();
    const subjectSlug = scopedSubject.slug;
    const subject = { ...scopedSubject, is_active: true };
    const topic = { ...scopedTopic, is_active: true };
    const scopedSubtopics = selected.snapshot.subtopics
      .filter((row) => row.topic_id === scopedTopic.id)
      .map((row) => ({
        id: row.id,
        topic_id: row.topic_id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        scope: row.scope,
        sort_order: row.sort_order,
        question_count: row.question_count,
        is_active: true,
        exam_priority: row.priority ?? undefined,
        priority: row.priority ?? undefined,
        importance: row.importance,
        importance_label: row.importance_label,
        is_recommended: row.is_recommended,
        practiceHref: `/subjects/${subjectSlug}/${topicSlug}/practice/${row.slug}?exam=${encodeURIComponent(selected.snapshot.exam.code)}`,
        revisionHref: isRevisionPublished(subjectSlug, topicSlug, row.slug)
          ? `/subjects/${subjectSlug}/${topicSlug}/${row.slug}/revision?exam=${encodeURIComponent(selected.snapshot.exam.code)}`
          : null,
      }));
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
        <TopicPageContent
          subject={subject}
          topic={{ ...topic, subtopic_count: scopedTopic.subtopic_count, question_count: scopedTopic.question_count }}
          subtopics={scopedSubtopics}
          subjectSlug={subjectSlug}
          subjectHref={`/subjects/${subjectSlug}?exam=${encodeURIComponent(selected.snapshot.exam.code)}`}
          examParam={selected.snapshot.exam.code}
          mixedPracticeHref={`/subjects/${subjectSlug}/${topicSlug}/practice?exam=${encodeURIComponent(selected.snapshot.exam.code)}`}
        />
      </div>
    );
  }

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
      `/subjects/${subjectSlug}/${topicSlug}/practice/${subtopic.slug}`,
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
