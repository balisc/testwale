import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import QuestionPractice from '@/components/practice/QuestionPractice';
import {
  getExactExamQuestionBatchBySubtopic,
  getFreshExactExamQuestionBatchBySubtopic,
} from '@/lib/exactExamQuestionsServer';
import {
  findPublishedSyllabusSubject,
  findPublishedSyllabusSubtopic,
  findPublishedSyllabusTopic,
} from '@/lib/examSyllabus';
import { withExamStageQuery } from '@/lib/examPreference';
import { getLocalizedText } from '@/lib/localizedText';
import { getPublicExamSyllabusStrict } from '@/lib/publicExamExplorer';
import { buildPageMetadata } from '@/lib/seo';
import { QUESTION_BATCH_PAGE_SIZE } from '@/lib/supabaseQueryLimits';
import SyllabusBreadcrumb from '../../../SyllabusBreadcrumb';

type PageProps = {
  params: Promise<{
    examSlug: string;
    subjectSlug: string;
    topicSlug: string;
    subtopicSlug: string;
  }>;
  searchParams: Promise<{ stage?: string | string[] }>;
};

export const dynamic = 'force-dynamic';

function selectedStage(value: string | string[] | undefined): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

async function resolvePage(params: Awaited<PageProps['params']>, stageCode: string | null) {
  const snapshot = await getPublicExamSyllabusStrict(params.examSlug, stageCode);
  if (!snapshot) return null;
  const subject = findPublishedSyllabusSubject(snapshot.subjects, params.subjectSlug);
  if (!subject) return null;
  const topic = findPublishedSyllabusTopic(snapshot.topics, subject.id, params.topicSlug);
  if (!topic) return null;
  const subtopic = findPublishedSyllabusSubtopic(snapshot.subtopics, topic.id, params.subtopicSlug);
  if (!subtopic) return null;
  return { snapshot, subject, topic, subtopic };
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const route = await params;
  const resolved = await resolvePage(route, selectedStage((await searchParams).stage));
  if (!resolved) notFound();
  const name = getLocalizedText(resolved.subtopic.title, 'en') || resolved.subtopic.slug;
  const subjectName = getLocalizedText(resolved.subject.title, 'en') || resolved.subject.slug;
  return buildPageMetadata({
    title: `${name} Questions — ${resolved.snapshot.exam.code.replaceAll('_', ' ')}`,
    description: `Practice available ${name} questions for ${subjectName} in ${resolved.snapshot.exam.code.replaceAll('_', ' ')}.`,
    path: `/exams/${route.examSlug}/${resolved.subject.slug}/${resolved.topic.slug}/${resolved.subtopic.slug}`,
    type: 'article',
    noIndex: true,
  });
}

export default async function PublicExamSubtopicPage({ params, searchParams }: PageProps) {
  const route = await params;
  const stageCode = selectedStage((await searchParams).stage);
  const resolved = await resolvePage(route, stageCode);
  if (!resolved) notFound();
  const { snapshot, subject, topic, subtopic } = resolved;
  const examHref = withExamStageQuery(`/exams/${route.examSlug}`, stageCode);
  const subjectHref = withExamStageQuery(`/exams/${route.examSlug}/${subject.slug}`, stageCode);
  const topicHref = withExamStageQuery(`/exams/${route.examSlug}/${subject.slug}/${topic.slug}`, stageCode);
  const subjectName = getLocalizedText(subject.title, 'en') || subject.slug;
  const topicName = getLocalizedText(topic.title, 'en') || topic.slug;
  const subtopicName = getLocalizedText(subtopic.title, 'en') || subtopic.slug;
  let initialBatch = subtopic.content_id && snapshot.exam.profile_id
    ? await getExactExamQuestionBatchBySubtopic({
        examProfileId: snapshot.exam.profile_id,
        contentSubtopicId: subtopic.content_id,
        stageCodes: stageCode ? [stageCode] : undefined,
        batchSize: QUESTION_BATCH_PAGE_SIZE,
      })
    : null;
  if (subtopic.content_id && snapshot.exam.profile_id && !initialBatch?.questions.length) {
    initialBatch = await getFreshExactExamQuestionBatchBySubtopic({
      examProfileId: snapshot.exam.profile_id,
      contentSubtopicId: subtopic.content_id,
      stageCodes: stageCode ? [stageCode] : undefined,
      batchSize: QUESTION_BATCH_PAGE_SIZE,
    });
  }

  if (!subtopic.content_id || !subtopic.content_topic_id || !subtopic.content_subject_id || !initialBatch?.questions.length) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <SyllabusBreadcrumb items={[
            { label: 'Home', href: '/' },
            { label: snapshot.exam.code.replaceAll('_', ' '), href: examHref },
            { label: subjectName, href: subjectHref },
            { label: topicName, href: topicHref },
            { label: subtopicName },
          ]} />
          <section className="rounded-3xl border border-violet-100 bg-white p-8 text-center shadow-sm sm:p-12">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700"><AlertCircle className="h-7 w-7" aria-hidden="true" /></span>
            <h1 className="mt-5 text-2xl font-bold">{subtopicName}</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">This subtopic is part of the published syllabus. Questions are being added and will appear here automatically when available.</p>
            <Link href={topicHref} className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 font-semibold text-white transition hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to subtopics</Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        <SyllabusBreadcrumb items={[
          { label: 'Home', href: '/' },
          { label: snapshot.exam.code.replaceAll('_', ' '), href: examHref },
          { label: subjectName, href: subjectHref },
          { label: topicName, href: topicHref },
          { label: subtopicName },
        ]} />
        <h1 className="sr-only">{subtopicName} — MCQ Practice</h1>
      </div>
      <QuestionPractice
        questions={[]}
        initialQuestions={initialBatch.questions}
        initialNextCursor={initialBatch.nextCursor}
        initialHasMore={initialBatch.hasMore}
        questionBatchScope="subtopic"
        questionBatchScopeId={subtopic.content_id}
        examCode={snapshot.exam.code}
        examProfileId={snapshot.exam.profile_id}
        stageCode={stageCode ?? undefined}
        backHref={topicHref}
        backLabel="Back to subtopics"
        titleLocalized={subtopic.title}
        seoTopic={topic.slug || topic.title}
        seoSubtopic={subtopic.slug || subtopic.title}
        subjectId={subtopic.content_subject_id}
        topicId={subtopic.content_topic_id}
        subtopicId={subtopic.content_id}
        subjectSlug={subject.slug}
        topicSlug={topic.slug}
        subtopicSlug={subtopic.slug}
        totalQuestionCount={subtopic.question_count}
      />
    </main>
  );
}
