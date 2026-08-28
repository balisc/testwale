import type { Metadata } from 'next';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import QuestionPractice from '@/components/practice/QuestionPractice';
import {
  getExactExamQuestionBatchBySubtopic,
  getFreshExactExamQuestionBatchBySubtopic,
} from '@/lib/exactExamQuestionsServer';
import { getAuthUserFromCookies } from '@/lib/authCookies';
import { getLocalizedText } from '@/lib/localizedText';
import {
  SSC_CHSL_EXAM_CODE,
  findSscChslSubject,
  findSscChslSubtopic,
  findSscChslTopic,
  getSscChslLegacyRedirect,
  getSscChslSubtopicsHref,
  parseSscChslRoute,
} from '@/lib/sscChsl';
import { getSscChslStageSnapshot } from '@/lib/sscChslServer';
import { QUESTION_BATCH_PAGE_SIZE } from '@/lib/supabaseQueryLimits';
import SscCglQuestionRecovery from '@/app/ssc-cgl/SscCglQuestionRecovery';
import {
  SscChslSubjectsPage,
  SscChslSubtopicsPage,
  SscChslTopicsPage,
} from '../SscChslHierarchyPages';
import SscChslPracticeHeader from '../SscChslPracticeHeader';

type PageProps = { params: Promise<{ path: string[] }> };

export const dynamic = 'force-dynamic';

function privateMetadata(title: string, description?: string): Metadata {
  return { title, ...(description ? { description } : {}), robots: { index: false, follow: true } };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const route = parseSscChslRoute((await params).path);
  if (!route) return privateMetadata('SSC CHSL page not found');
  if (route.kind === 'subjects') {
    return privateMetadata(
      `${getLocalizedText(route.stage.label, 'en')} Subjects — SSC CHSL`,
      `Choose a subject for the ${getLocalizedText(route.stage.label, 'en')} SSC CHSL syllabus.`,
    );
  }
  const data = await getSscChslStageSnapshot(route.stage);
  const subject = findSscChslSubject(data.snapshot, route.subjectSlug);
  if (!subject) return privateMetadata('SSC CHSL subject not found');
  if (route.kind === 'topics') {
    return privateMetadata(`${getLocalizedText(subject.title, 'en')} Topics — SSC CHSL`);
  }
  const topic = findSscChslTopic(data.snapshot, subject, route.topicSlug);
  if (!topic) return privateMetadata('SSC CHSL topic not found');
  if (route.kind === 'subtopics') {
    return privateMetadata(`${getLocalizedText(topic.title, 'en')} Subtopics — SSC CHSL`);
  }
  const subtopic = findSscChslSubtopic(data.snapshot, subject, topic, route.subtopicSlug);
  return subtopic
    ? privateMetadata(`${getLocalizedText(subtopic.title, 'en')} Questions — SSC CHSL`)
    : privateMetadata('SSC CHSL subtopic not found');
}

export default async function SscChslPathPage({ params }: PageProps) {
  const session = await getAuthUserFromCookies();
  if (!session) redirect('/exams/ssc-combined-higher-secondary-level-examination');

  const path = (await params).path;
  const route = parseSscChslRoute(path);
  if (!route) {
    const legacyRedirect = getSscChslLegacyRedirect(path);
    if (legacyRedirect) permanentRedirect(legacyRedirect);
    notFound();
  }

  const data = await getSscChslStageSnapshot(route.stage);
  if (route.kind === 'subjects') return <SscChslSubjectsPage data={data} />;

  const subject = findSscChslSubject(data.snapshot, route.subjectSlug);
  if (!subject) notFound();
  if (route.kind === 'topics') return <SscChslTopicsPage data={data} subject={subject} />;

  const topic = findSscChslTopic(data.snapshot, subject, route.topicSlug);
  if (!topic) notFound();
  if (route.kind === 'subtopics') {
    return <SscChslSubtopicsPage data={data} subject={subject} topic={topic} />;
  }

  const subtopic = findSscChslSubtopic(data.snapshot, subject, topic, route.subtopicSlug);
  if (!subtopic) notFound();
  const subtopicsHref = getSscChslSubtopicsHref(route.stage, subject.slug, topic.slug);
  const examProfileId = data.snapshot.exam.profile_id;
  let initialBatch = subtopic.content_id && examProfileId
    ? await getExactExamQuestionBatchBySubtopic({
        examProfileId,
        contentSubtopicId: subtopic.content_id,
        stageCodes: [route.stage.code],
        batchSize: QUESTION_BATCH_PAGE_SIZE,
      })
    : null;
  if (subtopic.content_id && examProfileId && !initialBatch?.questions.length) {
    initialBatch = await getFreshExactExamQuestionBatchBySubtopic({
      examProfileId,
      contentSubtopicId: subtopic.content_id,
      stageCodes: [route.stage.code],
      batchSize: QUESTION_BATCH_PAGE_SIZE,
    });
  }

  if (
    !subtopic.content_id
    || !subtopic.content_topic_id
    || !subtopic.content_subject_id
    || !examProfileId
    || !initialBatch?.questions.length
  ) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <SscChslPracticeHeader stage={route.stage} subject={subject} topic={topic} subtopic={subtopic} />
          <SscCglQuestionRecovery title={getLocalizedText(subtopic.title, 'en')} backHref={subtopicsHref} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <SscChslPracticeHeader stage={route.stage} subject={subject} topic={topic} subtopic={subtopic} />
      <h1 className="sr-only">{getLocalizedText(subtopic.title, 'en')} — MCQ Practice</h1>
      <QuestionPractice
        questions={[]}
        initialQuestions={initialBatch.questions}
        initialNextCursor={initialBatch.nextCursor}
        initialHasMore={initialBatch.hasMore}
        questionBatchScope="subtopic"
        questionBatchScopeId={subtopic.content_id}
        examCode={SSC_CHSL_EXAM_CODE}
        examProfileId={examProfileId}
        stageCode={route.stage.code}
        stageTag={route.stage.tag}
        backHref={subtopicsHref}
        backLabel="Back to all subtopics"
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
