import QuestionPractice from '@/components/practice/QuestionPractice';
import PracticeBreadcrumb from '@/components/practice/PracticeBreadcrumb';
import { requireTopicByRouteSlugs, loadTopicByRouteSlugs, NOT_FOUND_METADATA } from '@/lib/catalogRouteGuards';
import { getLocalizedText } from '@/lib/localizedText';
import {
  buildExamQuery,
  getMixedQuestionsByTopic,
} from '@/lib/polity';
import { resolvePracticeExamQuestionTag } from '@/lib/polity/practiceExamFilter';
import type { Metadata } from 'next';
import { buildPracticeMetadata } from '@/lib/seo';
import JsonLd from '@/components/JsonLd';
import { buildBreadcrumbListSchema } from '@/lib/breadcrumbSchema';
import { getSelectedExamLearning } from '@/lib/examLearningServer';
import ExamContentUnavailable from '@/components/ExamContentUnavailable';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { findPublishedSyllabusSubject, findPublishedSyllabusTopic } from '@/lib/examSyllabus';
import { isSscCglExamCode } from '@/lib/sscCglSyllabus';

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
  const row = await loadTopicByRouteSlugs(routeSubject, topicSlug);
  if (!row) return NOT_FOUND_METADATA;
  const { subject, subjectSlug, topic } = row;

  const topicTitle = getLocalizedText(topic.title, 'en');
  const subjectTitle = getLocalizedText(subject.title, 'en');

  const practicePath = `/subjects/${subjectSlug}/${topicSlug}/practice`;
  return buildPracticeMetadata(topicTitle, subjectTitle, practicePath);
}

export default async function MixedTopicPracticePage({ params, searchParams }: PageProps) {
  const { subject: routeSubject, topicSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const examParam = resolveExamParam(resolvedSearchParams.exam);

  const selected = await getSelectedExamLearning();
  if (selected.status === 'incomplete') redirect(`/onboarding?returnTo=${encodeURIComponent(`/subjects/${routeSubject}/${topicSlug}/practice`)}`);
  if (selected.status === 'inactive') return <ExamContentUnavailable reason="inactive_exam" />;
  if (selected.status === 'error') return <ExamContentUnavailable reason="error" />;
  if (selected.status === 'ready') {
    if (isSscCglExamCode(selected.snapshot.exam.code)) redirect('/ssc-cgl');
    const scopedSubject = findPublishedSyllabusSubject(selected.snapshot.subjects, routeSubject);
    if (!scopedSubject) notFound();
    const scopedTopic = findPublishedSyllabusTopic(selected.snapshot.topics, scopedSubject.id, topicSlug);
    if (!scopedTopic) notFound();
    return <ExamContentUnavailable reason="questions_coming" />;
  }
  const { subject, subjectSlug, topic } = await requireTopicByRouteSlugs(routeSubject, topicSlug);
  const examCode = buildExamQuery(examParam);
  const practiceTag = examCode ? await resolvePracticeExamQuestionTag(examCode) : undefined;
  const questions = await getMixedQuestionsByTopic(topic.id, practiceTag);
  const effectiveExam = examParam;
  const backHref = effectiveExam
    ? `/subjects/${subjectSlug}/${topicSlug}?exam=${encodeURIComponent(effectiveExam)}`
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
        seoTopic={topic.slug || topic.title}
        subjectId={subject.id}
        topicId={topic.id}
        examCode={practiceTag}
      />
    </div>
  );
}
