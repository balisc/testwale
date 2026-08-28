import type { Metadata } from 'next';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import QuestionPractice from '@/components/practice/QuestionPractice';
import {
  getExactExamQuestionBatchBySubtopic,
  getFreshExactExamQuestionBatchBySubtopic,
  resolveReadyExamProfileId,
} from '@/lib/exactExamQuestionsServer';
import { getLocalizedText } from '@/lib/localizedText';
import {
  findSscCglRouteNodes,
  findSscCglSubject,
  findSscCglTopic,
  getSscCglLegacyRedirect,
  getSscCglSubtopicsHref,
  parseSscCglRoute,
} from '@/lib/sscCglSyllabus';
import {
  getSscCglMappedLearningHierarchy,
  getSscCglScopedQuestionCounts,
  getSscCglStageTaxonomy,
} from '@/lib/sscCglSyllabusServer';
import { SSC_CGL_NODE_CONTENT_SLUGS } from '@/lib/sscCglContentLinks';
import { QUESTION_BATCH_PAGE_SIZE } from '@/lib/supabaseQueryLimits';
import { getAuthUserFromCookies } from '@/lib/authCookies';
import SscCglPracticeHeader from '../SscCglPracticeHeader';
import SscCglQuestionRecovery from '../SscCglQuestionRecovery';
import SscCglSubjectsPage from '../SscCglSubjectsPage';
import SscCglSubtopicsPage from '../SscCglSubtopicsPage';
import SscCglTopicsPage from '../SscCglTopicsPage';

type PageProps = { params: Promise<{ path: string[] }> };

export const dynamic = 'force-dynamic';

function privateMetadata(title: string, description?: string): Metadata {
  return {
    title,
    ...(description ? { description } : {}),
    robots: { index: false, follow: true },
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const route = parseSscCglRoute((await params).path);
  if (!route) return privateMetadata('SSC CGL page not found');
  if (route.kind === 'subjects') {
    return privateMetadata(
      `${getLocalizedText(route.stage.label, 'en')} Subjects — SSC CGL`,
      `Choose a subject for the ${getLocalizedText(route.stage.label, 'en')} SSC CGL syllabus.`,
    );
  }

  const taxonomy = await getSscCglStageTaxonomy(route.stage);
  const subject = findSscCglSubject(taxonomy, route.subjectSlug);
  if (!subject) return privateMetadata('SSC CGL subject not found');
  if (route.kind === 'topics') {
    return privateMetadata(`${getLocalizedText(subject.title, 'en')} Topics — SSC CGL`);
  }

  const topic = findSscCglTopic(subject, route.topicSlug);
  if (!topic) return privateMetadata('SSC CGL topic not found');
  if (route.kind === 'subtopics') {
    return privateMetadata(`${getLocalizedText(topic.title, 'en')} Subtopics — SSC CGL`);
  }

  const nodes = findSscCglRouteNodes(taxonomy, route);
  if (!nodes) return privateMetadata('SSC CGL subtopic not found');
  return privateMetadata(`${getLocalizedText(nodes.subtopic.title, 'en')} Questions — SSC CGL`);
}

export default async function SscCglPathPage({ params }: PageProps) {
  const session = await getAuthUserFromCookies();
  if (!session) redirect('/exams/ssc-cgl');

  const path = (await params).path;
  const route = parseSscCglRoute(path);
  if (!route) {
    const legacyRedirect = getSscCglLegacyRedirect(path);
    if (legacyRedirect) permanentRedirect(legacyRedirect);
    notFound();
  }

  const taxonomy = await getSscCglStageTaxonomy(route.stage);
  if (route.kind === 'subjects') {
    return <SscCglSubjectsPage key={route.stage.code} taxonomy={taxonomy} />;
  }

  const subject = findSscCglSubject(taxonomy, route.subjectSlug);
  if (!subject) notFound();
  if (route.kind === 'topics') {
    return <SscCglTopicsPage key={`${route.stage.code}:${subject.id}`} taxonomy={taxonomy} subject={subject} />;
  }

  const topic = findSscCglTopic(subject, route.topicSlug);
  if (!topic) notFound();
  if (route.kind === 'subtopics') {
    const questionCounts = await getSscCglScopedQuestionCounts(route.stage, subject.id, topic.id);
    const questionBackedSubtopicIds = topic.subtopics
      .filter((subtopic) => Object.hasOwn(SSC_CGL_NODE_CONTENT_SLUGS, subtopic.code))
      .map((subtopic) => subtopic.id);
    return (
      <SscCglSubtopicsPage
        key={`${route.stage.code}:${subject.id}:${topic.id}`}
        taxonomy={taxonomy}
        subject={subject}
        topic={topic}
        questionCounts={questionCounts}
        questionBackedSubtopicIds={questionBackedSubtopicIds}
      />
    );
  }

  const nodes = findSscCglRouteNodes(taxonomy, route);
  if (!nodes) notFound();
  const [mapped, examProfileId, questionCounts] = await Promise.all([
    getSscCglMappedLearningHierarchy(taxonomy),
    resolveReadyExamProfileId({ examCode: 'SSC_CGL' }),
    getSscCglScopedQuestionCounts(route.stage, nodes.subject.id, nodes.topic.id),
  ]);
  const mappedSubtopic = mapped.subtopics.find((row) => row.id === nodes.subtopic.id);
  const subtopicsHref = getSscCglSubtopicsHref(route.stage, nodes.subject.slug, nodes.topic.slug);
  let initialBatch = mappedSubtopic?.content_id && examProfileId
    ? await getExactExamQuestionBatchBySubtopic({
        examProfileId,
        contentSubtopicId: mappedSubtopic.content_id,
        stageCodes: [route.stage.code],
        batchSize: QUESTION_BATCH_PAGE_SIZE,
      })
    : null;

  if (mappedSubtopic?.content_id && examProfileId && !initialBatch?.questions.length) {
    initialBatch = await getFreshExactExamQuestionBatchBySubtopic({
      examProfileId,
      contentSubtopicId: mappedSubtopic.content_id,
      stageCodes: [route.stage.code],
      batchSize: QUESTION_BATCH_PAGE_SIZE,
    });
  }

  if (
    !mappedSubtopic?.content_id ||
    !mappedSubtopic.content_topic_id ||
    !mappedSubtopic.content_subject_id ||
    !examProfileId ||
    !initialBatch?.questions.length
  ) {
    return (
      <main className="min-h-screen w-full min-w-0 max-w-full bg-[#F8FAFC] px-4 py-8 text-slate-900 sm:px-6">
        <div className="mx-auto w-full min-w-0 max-w-3xl">
          <SscCglPracticeHeader stage={route.stage} {...nodes} />
          <SscCglQuestionRecovery
            title={getLocalizedText(nodes.subtopic.title, 'en')}
            backHref={subtopicsHref}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <SscCglPracticeHeader stage={route.stage} {...nodes} />
      <h1 className="sr-only">{getLocalizedText(nodes.subtopic.title, 'en')} — MCQ Practice</h1>
      <QuestionPractice
        questions={[]}
        initialQuestions={initialBatch.questions}
        initialNextCursor={initialBatch.nextCursor}
        initialHasMore={initialBatch.hasMore}
        questionBatchScope="subtopic"
        questionBatchScopeId={mappedSubtopic.content_id}
        examCode="SSC_CGL"
        examProfileId={examProfileId}
        stageCode={route.stage.code}
        stageTag={route.stage.tag}
        backHref={subtopicsHref}
        backLabel="Back to all subtopics"
        titleLocalized={nodes.subtopic.title}
        seoTopic={nodes.topic.slug || nodes.topic.title}
        seoSubtopic={nodes.subtopic.slug || nodes.subtopic.title}
        subjectId={mappedSubtopic.content_subject_id}
        topicId={mappedSubtopic.content_topic_id}
        subtopicId={mappedSubtopic.content_id}
        subjectSlug={nodes.subject.slug}
        topicSlug={nodes.topic.slug}
        subtopicSlug={nodes.subtopic.slug}
        totalQuestionCount={questionCounts[nodes.subtopic.id] ?? 0}
      />
    </main>
  );
}
