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
