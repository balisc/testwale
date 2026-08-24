import { notFound, permanentRedirect, redirect } from 'next/navigation';
import supabase from '@/lib/supabase';
import ClientQuiz from '@/app/subjects/[subject]/[topicSlug]/ClientQuiz';
import QuestionDetailsClient from '@/app/question/QuestionDetailsClient';
import QuestionPractice from '@/components/practice/QuestionPractice';
import PracticeBreadcrumb from '@/components/practice/PracticeBreadcrumb';
import JsonLd from '@/components/JsonLd';
import { buildBreadcrumbListSchema } from '@/lib/breadcrumbSchema';
import {
  getSubjectByIdFromCache,
  getSubtopicByIdFromCache,
  getTopicByIdFromCache,
} from '@/lib/catalogCache';
import {
  buildQuestionLookupContext,
  decodeQuizTopicFromSlug,
  extractQuestionIdFromQuestionSlug,
  fetchQuestionById,
  getQuestionTextField,
  inferSubjectKeyFromTopicSlug,
  type QuestionRecord,
} from '@/lib/questionLookup';
import { getQuestionBatchBySubtopic } from '@/lib/polity';
import { getLocalizedText } from '@/lib/localizedText';
import { parseSourceMetadata } from '@/lib/questions/parseQuestionSources';
import { SUBJECT_TABLES } from '@/lib/subjects';
import { buildQuestionUrl, generateQuestionSlug, slugifySubject } from '@/lib/slugGenerator';
import { BASE_URL, canonical, absoluteUrl, SITE_NAME } from '@/lib/seo';
import { legacyColumnsForTable } from '@/lib/questionColumns';
import { MAX_QUIZ_CANDIDATE_ROWS, QUESTION_BATCH_PAGE_SIZE } from '@/lib/supabaseQueryLimits';
import { subCategoryMatches, topicMatches } from '@/lib/topicMatching';
import type { PublicQuestion } from '@/types/polity';
import { getSelectedExamLearning } from '@/lib/examLearningServer';
import ExamContentUnavailable from '@/components/ExamContentUnavailable';
import { resolvePracticeExamQuestionTag } from '@/lib/polity/practiceExamFilter';
import { entityIsIncluded } from '@/lib/examLearning';
import { getSscCglStageByCode, getSscCglSubtopicsHref, isSscCglExamCode } from '@/lib/sscCglSyllabus';
import {
  getSscCglMappedLearningHierarchy,
  getSscCglStageTaxonomy,
} from '@/lib/sscCglSyllabusServer';

export const revalidate = 3600;

type LocalizedText = string | { en?: string; hi?: string };
type OptionKey = 'A' | 'B' | 'C' | 'D' | 'E';

type SearchParams = {
  q?: string | string[];
  stage_code?: string | string[];
  stage_tag?: string | string[];
};

const SUBJECT_TABLE_MAP = SUBJECT_TABLES;

function getQuestionPath(params: { questionSlug?: string | string[] }) {
  const rawSlug = params.questionSlug;
  if (Array.isArray(rawSlug)) {
    return rawSlug.map((item) => {
      try {
        return decodeURIComponent(String(item)).trim();
      } catch {
        return '';
      }
    }).filter(Boolean);
  }
  if (typeof rawSlug === 'string') {
    try {
      return [decodeURIComponent(rawSlug).trim()].filter(Boolean);
    } catch {
      return [];
    }
  }
  return [];
}

function getText(value: LocalizedText | undefined, locale: 'en' | 'hi' = 'en'): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] || value.en || value.hi || '';
}

function getTextValue(value: LocalizedText | undefined, locale: 'en' | 'hi' = 'en'): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] || value.en || value.hi || '';
}

function firstSearchValue(value: string | string[] | undefined): string | null {
  const resolved = Array.isArray(value) ? value[0] : value;
  return resolved?.trim() || null;
}

function toPublicQuestion(row: QuestionRecord): PublicQuestion {
  const questionText = row.question_text ?? row.question ?? {};
  const meta = parseSourceMetadata(row.source_metadata);
  return {
    id: String(row.id),
    question_text:
      typeof questionText === 'string' ? { en: questionText, hi: questionText } : questionText,
    options: (row.options as PublicQuestion['options']) ?? {},
    difficulty: row.difficulty != null ? String(row.difficulty) : null,
    source: row.source != null ? String(row.source) : null,
    source_metadata: meta
      ? {
          primary_sources: meta.primary_sources,
          secondary_sources: meta.secondary_sources,
          ...(meta.evidence_locator ? { evidence_locator: meta.evidence_locator } : {}),
        }
      : null,
    year: typeof row.year === 'number' ? row.year : row.year != null ? Number(row.year) : null,
    pyq_exam_name: row.pyq_exam_name != null ? String(row.pyq_exam_name) : null,
    exam_tags: Array.isArray(row.exam_tags) ? row.exam_tags.map(String) : null,
    attempt_count: 0,
    correct_count: 0,
  };
}

type QuestionItem = {
  id: string;
  exam?: LocalizedText | string;
  subject?: LocalizedText | string;
  topic?: LocalizedText | string;
  question: LocalizedText;
  options?: Record<OptionKey, LocalizedText>;
  answer?: OptionKey;
  explanation?: LocalizedText;
  year?: number | null;
};

function isQuestionVisible(row: any) {
  const status = typeof row?.status === 'string' ? row.status.trim().toLowerCase() : '';
  return !status || status === 'active' || status === 'published';
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ questionSlug?: string | string[] }>;
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const pathSegments = getQuestionPath(resolvedParams);
  if (pathSegments.length < 1 || pathSegments.length > 3) {
    return { title: 'Question not found', robots: { index: false, follow: true } };
  }

  const topicSlug = pathSegments.length >= 2 ? pathSegments[0] : '';
  const subtopicSlug = pathSegments.length === 3 ? pathSegments[1] : '';
  const currentSlug = pathSegments[pathSegments.length - 1];
  const questionId = extractQuestionIdFromQuestionSlug(currentSlug);
  if (!questionId) return { title: 'Question not found', robots: { index: false, follow: true } };

  const lookupContext = buildQuestionLookupContext({
    topicSlug,
    questionSlug: currentSlug,
    subjectKey: inferSubjectKeyFromTopicSlug(topicSlug),
  });
  const question = await fetchQuestionById(questionId, lookupContext);
  if (!question) return { title: 'Question not found', robots: { index: false, follow: true } };

  const questionText = getText(getQuestionTextField(question), 'en').trim();
  const shortTitle = `${questionText.slice(0, 60).trim()}${questionText.length > 60 ? '…' : ''}`;
  const examText = getText(question.exam, 'en');
  const topicText = getText(question.topic, 'en');
  const canonicalPath = buildQuestionUrl(
    question.topic_slug || question.topic || topicSlug || topicText,
    question.id,
    getQuestionTextField(question) ?? '',
    {
      subtopic: question.subtopic_slug || subtopicSlug || undefined,
    },
  );
  const title = `${shortTitle} - Practice question`;
  const description = `${examText ? `${examText}: ` : ''}Practice a question on ${topicText || 'competitive exams'} with answer and explanation.`;
  return {
    title,
    description,
    ...canonical(canonicalPath),
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: 'article',
      siteName: 'Questionwale',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    // Answer-gated practice surfaces stay out of the index. Substantial public
    // revision pages carry crawlable learning content and official citations.
    robots: { index: false, follow: true },
  };
}

export default async function QuestionPage({
  params,
  searchParams,
}: {
  params: Promise<{ questionSlug?: string | string[] }>;
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const requestedStageCode = firstSearchValue(resolvedSearchParams.stage_code);
  const requestedStageTag = firstSearchValue(resolvedSearchParams.stage_tag);
  const pathSegments = getQuestionPath(resolvedParams);
  if (pathSegments.length < 1 || pathSegments.length > 3) {
    notFound();
  }

  const topicSlug = pathSegments.length >= 2 ? pathSegments[0] : '';
  const subtopicSlug = pathSegments.length === 3 ? pathSegments[1] : '';
  const currentSlug = pathSegments[pathSegments.length - 1];
  const questionId = extractQuestionIdFromQuestionSlug(currentSlug);
  if (!questionId) notFound();

  const qParam = Array.isArray(resolvedSearchParams.q) ? resolvedSearchParams.q[0] : resolvedSearchParams.q;
  const qIndex = qParam !== undefined ? Number.parseInt(String(qParam), 10) : NaN;
  const isQuizMode = !Number.isNaN(qIndex);

  const lookupContext = buildQuestionLookupContext({
    topicSlug,
    questionSlug: currentSlug,
    subjectKey: inferSubjectKeyFromTopicSlug(topicSlug),
  });
  const question = await fetchQuestionById(questionId, lookupContext);

  const selected = await getSelectedExamLearning();
  if (selected.status === 'incomplete') {
    redirect(`/onboarding?returnTo=${encodeURIComponent(`/question/${pathSegments.join('/')}`)}`);
  }
  if (selected.status === 'inactive') return <ExamContentUnavailable reason="inactive_exam" />;
  if (selected.status === 'error') return <ExamContentUnavailable reason="error" />;
  const selectedQuestionTag = selected.status === 'ready'
    ? selected.snapshot.exam.question_tag
      ?? await resolvePracticeExamQuestionTag(selected.snapshot.exam.code)
    : undefined;
  if (selected.status === 'ready' && !selectedQuestionTag) {
    return <ExamContentUnavailable reason="error" />;
  }
  if (selected.status === 'ready' && question) {
    const tags = Array.isArray(question.exam_tags) ? question.exam_tags.map(String) : [];
    if (!tags.includes(selectedQuestionTag!)) {
      return <ExamContentUnavailable reason="not_in_exam" />;
    }
  }

  // Catalog questions: keep the same practice UI on refresh / shared links.
  if (question && !isQuizMode && question.subtopic_id) {
    const questionTextField = getQuestionTextField(question);
    const canonicalSlug = generateQuestionSlug(questionTextField ?? '', question.id).trim();
    const [subject, topic, subtopic] = await Promise.all([
      question.subject_id ? getSubjectByIdFromCache(String(question.subject_id)) : null,
      question.topic_id ? getTopicByIdFromCache(String(question.topic_id)) : null,
      getSubtopicByIdFromCache(String(question.subtopic_id)),
    ]);

    const canonicalTopicSlug = topic?.slug || question.topic_slug || topicSlug;
    const canonicalSubtopicSlug = subtopic?.slug || question.subtopic_slug || subtopicSlug;
    const canonicalPath = buildQuestionUrl(canonicalTopicSlug || 'question', question.id, questionTextField ?? '', {
      subtopic: canonicalSubtopicSlug || undefined,
    });

    const requestedStage = (selected.status !== 'ready' || isSscCglExamCode(selected.snapshot.exam.code))
      ? getSscCglStageByCode(requestedStageCode)
      : null;
    const stageContext = requestedStage?.tag === requestedStageTag
      ? await (async () => {
          const stageTaxonomy = await getSscCglStageTaxonomy(requestedStage);
          const mappedStageSubtopic = (await getSscCglMappedLearningHierarchy(stageTaxonomy))
            .subtopics.find((row) => row.content_id === String(question.subtopic_id));
          const stageSubject = stageTaxonomy.subjects.find((row) => row.id === mappedStageSubtopic?.subject_id);
          const stageTopic = stageSubject?.topics.find((row) => row.id === mappedStageSubtopic?.topic_id);
          return mappedStageSubtopic && stageSubject && stageTopic
            ? {
                stage: requestedStage,
                href: getSscCglSubtopicsHref(requestedStage, stageSubject.slug, stageTopic.slug),
              }
            : null;
        })()
      : null;
    const canonicalStagePath = stageContext
      ? `${canonicalPath}?${new URLSearchParams({ stage_code: stageContext.stage.code, stage_tag: stageContext.stage.tag }).toString()}`
      : canonicalPath;

    if (
      currentSlug !== canonicalSlug ||
      (canonicalTopicSlug && topicSlug && topicSlug !== canonicalTopicSlug) ||
      (canonicalSubtopicSlug && subtopicSlug && subtopicSlug !== canonicalSubtopicSlug) ||
      (canonicalSubtopicSlug && !subtopicSlug)
    ) {
      return permanentRedirect(canonicalStagePath);
    }

    if (subject && topic && subtopic) {
      if (selected.status === 'ready' && !entityIsIncluded(selected.snapshot, 'subtopic', subtopic.id)) {
        return <ExamContentUnavailable reason="not_in_exam" />;
      }
      const selectedExamCode = selected.status === 'ready' ? selectedQuestionTag : undefined;
      const initialBatch = await getQuestionBatchBySubtopic(subtopic.id, selectedExamCode, {
        batchSize: QUESTION_BATCH_PAGE_SIZE,
      });
      const linkedQuestion = toPublicQuestion(question);
      const initialQuestions = initialBatch.questions.some((item) => item.id === linkedQuestion.id)
        ? initialBatch.questions
        : [linkedQuestion, ...initialBatch.questions];

      const backHref = stageContext?.href
        ?? `/subjects/${subject.slug}/${topic.slug}${selectedExamCode ? `?exam=${encodeURIComponent(selectedExamCode)}` : ''}`;
      const breadcrumbSchema = buildBreadcrumbListSchema([
        { name: 'Home', href: '/' },
        { name: getLocalizedText(subject.title, 'en'), href: `/subjects/${subject.slug}` },
        { name: getLocalizedText(topic.title, 'en'), href: backHref },
        { name: getLocalizedText(subtopic.title, 'en') },
      ]);

      return (
        <div className="min-h-screen bg-[#F8FAFC]">
          <JsonLd data={breadcrumbSchema} />
          <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
            <PracticeBreadcrumb
              subjectSlug={subject.slug}
              subjectTitle={subject.title}
              topicTitle={topic.title}
              topicHref={backHref}
              subtopicTitle={subtopic.title}
              currentLabel={{ en: 'Practice', hi: 'अभ्यास' }}
            />
          </div>

          <QuestionPractice
            questions={[]}
            initialQuestions={initialQuestions}
            initialNextCursor={initialBatch.nextCursor}
            initialHasMore={initialBatch.hasMore}
            questionBatchScope="subtopic"
            questionBatchScopeId={subtopic.id}
            examCode={selectedExamCode}
            stageCode={stageContext?.stage.code}
            stageTag={stageContext?.stage.tag}
            backHref={backHref}
            backLabel="Back to topic"
            titleLocalized={subtopic.title}
            seoTopic={topic.slug || topic.title}
            seoSubtopic={subtopic.slug || subtopic.title}
            initialQuestionId={question.id}
            subjectId={subject.id}
            topicId={topic.id}
            subtopicId={subtopic.id}
            subjectSlug={subject.slug}
            topicSlug={topic.slug}
            subtopicSlug={subtopic.slug}
            totalQuestionCount={selected.status === 'ready'
              ? selected.snapshot.subtopics.find((row) => row.id === subtopic.id || row.content_id === subtopic.id)?.question_count ?? 0
              : subtopic.question_count}
          />
        </div>
      );
    }
  }

  if (question && !isQuizMode) {
    const questionTextField = getQuestionTextField(question);
    const canonicalSlug = generateQuestionSlug(questionTextField ?? '', question.id).trim();
    const canonicalTopicSlug =
      (typeof question.topic_slug === 'string' && question.topic_slug) ||
      (getText(question.topic, 'en').trim() ? slugifySubject(getText(question.topic, 'en')) : '') ||
      topicSlug;
    const canonicalSubtopicSlug =
      (typeof question.subtopic_slug === 'string' && question.subtopic_slug) || subtopicSlug || undefined;
    const canonicalPath = buildQuestionUrl(
      canonicalTopicSlug || 'question',
      question.id,
      questionTextField ?? '',
      { subtopic: canonicalSubtopicSlug },
    );

    if (
      currentSlug !== canonicalSlug ||
      (canonicalTopicSlug && topicSlug && topicSlug !== canonicalTopicSlug) ||
      (canonicalSubtopicSlug && subtopicSlug && subtopicSlug !== canonicalSubtopicSlug) ||
      (canonicalSubtopicSlug && !subtopicSlug)
    ) {
      return permanentRedirect(canonicalPath);
    }
  }

  if (isQuizMode) {
    if (!question) {
      notFound();
    }

    const subjectKey =
      slugifySubject(question.subject ?? '') ||
      inferSubjectKeyFromTopicSlug(topicSlug) ||
      'history';
    const quizTopic = topicSlug
      ? decodeQuizTopicFromSlug(topicSlug)
      : getText(question.topic, 'en').trim();
    const tableName = SUBJECT_TABLE_MAP[subjectKey];
    const { questions, fetchError } = await fetchTopicQuestions(tableName, quizTopic, subjectKey);
    const finalQuestions = questions.length ? questions : [question];
    return (
      <ClientQuiz
        questions={finalQuestions}
        decodedTopic={quizTopic}
        subject={subjectKey}
        fetchError={questions.length ? fetchError : null}
        initialQuestionSlug={currentSlug}
        initialQuestionId={questionId}
      />
    );
  }

  if (!question) {
    notFound();
  }

  const resolvedQuestion = question as QuestionItem & QuestionRecord;
  const questionTextField = getQuestionTextField(resolvedQuestion);
  const questionText = getText(questionTextField, 'en').trim();
  const topicText = getText(resolvedQuestion.topic, 'en').trim();
  const canonicalPath = buildQuestionUrl(
    resolvedQuestion.topic_slug || resolvedQuestion.topic || topicSlug || topicText,
    resolvedQuestion.id,
    questionTextField ?? '',
    {
      subtopic: resolvedQuestion.subtopic_slug || subtopicSlug || undefined,
    },
  );
  const options = resolvedQuestion.options
    ? Object.entries(resolvedQuestion.options).map(([key, value]) => ({
        '@type': 'Answer',
        name: key,
        text: getTextValue(value as LocalizedText, 'en'),
      }))
    : [];
  const orgAuthor = {
    '@type': 'Organization' as const,
    name: SITE_NAME,
    url: BASE_URL,
  };
  // Never put correct answers in public JSON-LD — answers are server-gated until submit.
  const questionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: questionText,
    description: topicText
      ? `${questionText} — practice MCQ for ${topicText} on ${SITE_NAME}.`
      : `${questionText} — practice MCQ on ${SITE_NAME}.`,
    url: absoluteUrl(canonicalPath),
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: BASE_URL,
    },
    about: {
      '@type': 'Question',
      name: questionText,
      text: questionText,
      // Multiple choice options as suggested answers (distractors + key), without marking correctness.
      suggestedAnswer: options.map((option) => ({
        '@type': 'Answer',
        name: option.name,
        text: option.text,
        author: orgAuthor,
      })),
    },
  };

  const {
    answer: _answer,
    explanation: _explanation,
    correct_option: _correctOption,
    correct_answer: _correctAnswer,
    ...publicQuestionFields
  } = resolvedQuestion as QuestionItem &
    QuestionRecord & {
      answer?: unknown;
      explanation?: unknown;
      correct_option?: unknown;
      correct_answer?: unknown;
    };

  return (
    <>
      <JsonLd data={questionJsonLd} />
      <QuestionDetailsClient
        initialQuestion={{
          ...publicQuestionFields,
          question: questionTextField ?? resolvedQuestion.question,
          source: resolvedQuestion.source ?? null,
          source_metadata: resolvedQuestion.source_metadata ?? null,
        }}
        initialQuestionId={questionId}
        initialQuestionSlug={currentSlug}
        initialTopic={topicSlug}
      />
    </>
  );
}

const HISTORY_SUBCATEGORY_HI: Record<string, string> = {
  ancient: 'प्राचीन',
  medieval: 'मध्यकालीन',
  modern: 'आधुनिक',
};

function escapeForLike(value: string) {
  return value.replace(/([%_\\])/g, '\\$1');
}

function getHistorySubCategoryKey(topic: string) {
  const normalizedTopic = topic.trim().toLowerCase();
  if (normalizedTopic.includes('modern')) return 'modern';
  if (normalizedTopic.includes('medieval')) return 'medieval';
  if (normalizedTopic.includes('ancient')) return 'ancient';
  return '';
}

function questionMatchesTopic(row: any, topic: string) {
  const candidateValues = [row.topic, row.sub_category];
  for (const value of candidateValues) {
    if (topicMatches(value, topic)) {
      return true;
    }
  }

  return subCategoryMatches(row.sub_category, topic);
}

async function fetchTopicQuestions(
  tableName: string | undefined,
  topic: string,
  subjectKey: string
) {
  const normalizedTopic = topic.trim();
  if (!normalizedTopic) {
    return { questions: [], fetchError: 'No topic provided.' };
  }

  if (!tableName) {
    return { questions: [], fetchError: `No quiz questions found for ${normalizedTopic}.` };
  }

  const escapedTopic = escapeForLike(normalizedTopic);
  const historySubCategoryKey = subjectKey === 'history' ? getHistorySubCategoryKey(normalizedTopic) : '';

  try {
    const columns = legacyColumnsForTable(tableName);
    let query = supabase.from(tableName).select(columns).order('id', { ascending: true });

    if (historySubCategoryKey && tableName === 'history_questions') {
      const hiValue = HISTORY_SUBCATEGORY_HI[historySubCategoryKey];
      query = query.or(
        `sub_category->>en.eq.${historySubCategoryKey},sub_category->>en.ilike.%${historySubCategoryKey}%,sub_category->>hi.ilike.%${hiValue}%`
      );
    } else {
      query = query.or(`topic->>en.ilike.%${escapedTopic}%,topic->>hi.ilike.%${escapedTopic}%`);
    }

    const { data, error } = await query.range(0, MAX_QUIZ_CANDIDATE_ROWS - 1);

    if (error) {
      console.error('SUPABASE ERROR:', error.message ?? error);
      return { questions: [], fetchError: error.message ?? 'Query failed.' };
    }

    const questions = (data ?? []).filter((row: any) => questionMatchesTopic(row, normalizedTopic));
    if (questions.length) {
      return { questions, fetchError: null };
    }
  } catch (err) {
    console.error(`QUIZ FETCH ERROR for table ${tableName}:`, err);
  }

  return { questions: [], fetchError: `No quiz questions found for ${normalizedTopic}.` };
}
