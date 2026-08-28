import { getLocalizedText } from '@/lib/localizedText';
import { requireSubjectByRouteSlug, loadSubjectByRouteSlug, NOT_FOUND_METADATA } from '@/lib/catalogRouteGuards';
import SubjectPageContent from './SubjectPageContent';
import {
  buildExamQuery,
  getAllExams,
  getExamWiseTopics,
  getTopicsBySubject,
  resolveExamCodeFromDb,
} from '@/lib/polity';
import {
  getExamWiseTopicsV2,
  listRankedExamOptions,
  validateRankedExamCode,
} from '@/lib/polity/examRankingV2';
import type { Metadata } from 'next';
import { buildCatalogSubjectMetadata } from '@/lib/seo';
import JsonLd from '@/components/JsonLd';
import { buildBreadcrumbListSchema } from '@/lib/breadcrumbSchema';
import { hasPublishedRevisionForSubject } from '@/lib/revision/registry';
import { getSelectedExamLearning } from '@/lib/examLearningServer';
import ExamContentUnavailable from '@/components/ExamContentUnavailable';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { findPublishedSyllabusSubject } from '@/lib/examSyllabus';
import { isSscCglExamCode } from '@/lib/sscCglSyllabus';
import { isSscChslExamCode } from '@/lib/sscChsl';

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
  const row = await loadSubjectByRouteSlug(routeSubject);
  if (!row) return NOT_FOUND_METADATA;
  const { subject, subjectSlug } = row;

  const titleEn = getLocalizedText(subject.title, 'en');
  const descEn = getLocalizedText(subject.description, 'en');

  const metadata = buildCatalogSubjectMetadata(titleEn, subjectSlug, descEn || undefined);
  const hasSearchValue =
    Number(subject.question_count ?? 0) > 0 || hasPublishedRevisionForSubject(subjectSlug);
  return hasSearchValue
    ? metadata
    : { ...metadata, robots: { index: false, follow: true } };
}

export default async function SubjectSlugPage({ params, searchParams }: PageProps) {
  const { subject: routeSubject } = await params;
  const resolvedSearchParams = await searchParams;
  const examParam = resolveExamParam(resolvedSearchParams.exam);
  const examCode = buildExamQuery(examParam);

  const selected = await getSelectedExamLearning();
  if (selected.status === 'incomplete') {
    redirect(`/onboarding?returnTo=${encodeURIComponent(`/subjects/${routeSubject}`)}`);
  }
  if (selected.status === 'inactive') return <ExamContentUnavailable reason="inactive_exam" />;
  if (selected.status === 'error') return <ExamContentUnavailable reason="error" />;
  if (selected.status === 'ready') {
    if (isSscCglExamCode(selected.snapshot.exam.code)) redirect('/ssc-cgl');
    if (isSscChslExamCode(selected.snapshot.exam.code)) redirect('/ssc-chsl');
    const scopedSubject = findPublishedSyllabusSubject(selected.snapshot.subjects, routeSubject);
    if (!scopedSubject) notFound();
    const subjectSlug = scopedSubject.slug;
    const subject = {
      ...scopedSubject,
      topic_count: scopedSubject.topic_count,
      question_count: scopedSubject.question_count,
      is_active: true,
    };
    const exams = await getAllExams();
    const topics = selected.snapshot.topics
      .filter((row) => row.subject_id === scopedSubject.id)
      .map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        scope: row.scope,
        icon_key: row.icon_key,
        subtopic_count: row.subtopic_count,
        question_count: row.question_count,
        priority: row.priority ?? 999,
        importance: row.importance,
        is_recommended: row.is_recommended,
      }));
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
        <SubjectPageContent
          subject={subject}
          subjectSlug={subjectSlug}
          topics={topics}
          exams={exams}
          examCode={selected.snapshot.exam.code}
          topicCount={scopedSubject.topic_count}
          questionCount={scopedSubject.question_count}
          examLocked
        />
      </div>
    );
  }

  const { subject, subjectSlug } = await requireSubjectByRouteSlug(routeSubject);
  const exams = await getAllExams();

  if (subjectSlug === 'indian-polity') {
    const rankedExams = await listRankedExamOptions();
    const validation = validateRankedExamCode(rankedExams, examCode);
    const topics =
      validation.valid && validation.normalized
        ? await getExamWiseTopicsV2(subject.id, validation.normalized)
        : await getTopicsBySubject(subject.id);

    const topicCount = validation.valid ? topics.length : (subject.topic_count ?? topics.length);
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
          rankedExams={rankedExams}
          examCode={examParam}
          topicCount={topicCount}
          questionCount={questionCount}
        />
      </div>
    );
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
