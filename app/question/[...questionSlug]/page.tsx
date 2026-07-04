import { notFound, permanentRedirect } from 'next/navigation';
import supabase from '@/lib/supabase';
import ClientQuiz from '@/app/subjects/[subject]/[topicSlug]/ClientQuiz';
import QuestionDetailsClient from '@/app/question/QuestionDetailsClient';
import {
  buildQuestionLookupContext,
  decodeQuizTopicFromSlug,
  extractQuestionIdFromQuestionSlug,
  fetchQuestionById,
  inferSubjectKeyFromTopicSlug,
} from '@/lib/questionLookup';
import { SUBJECT_TABLES } from '@/lib/subjects';
import { buildQuestionUrl, generateQuestionSlug, slugifySubject } from '@/lib/slugGenerator';
import { BASE_URL, canonical, absoluteUrl, SITE_NAME } from '@/lib/seo';
import JsonLd from '@/components/JsonLd';

export const revalidate = 3600;

type LocalizedText = string | { en?: string; hi?: string };
type OptionKey = 'A' | 'B' | 'C' | 'D' | 'E';

type SearchParams = {
  q?: string | string[];
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

import { subCategoryMatches, topicMatches } from '@/lib/topicMatching';
import { HISTORY_QUESTION_COLUMNS, PUBLIC_QUESTION_COLUMNS } from '@/lib/questionColumns';

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
  if (pathSegments.length < 1 || pathSegments.length > 2) {
    return { title: 'Question not found', robots: { index: false, follow: true } };
  }

  const topicSlug = pathSegments.length === 2 ? pathSegments[0] : '';
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

  const questionText = getText(question.question, 'en').trim();
  const shortTitle = `${questionText.slice(0, 60).trim()}${questionText.length > 60 ? '…' : ''}`;
  const examText = getText(question.exam, 'en');
  const topicText = getText(question.topic, 'en');
  const canonicalPath = buildQuestionUrl(question.topic ?? topicText, question.id, question.question);
  const title = `${shortTitle} - Practice question`;
  const description = `${examText ? `${examText}: ` : ''}Practice a question on ${topicText || 'competitive exams'} with answer and explanation.`;
  const hasQuizQuery = resolvedSearchParams.q !== undefined;

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
    robots: hasQuizQuery ? { index: false, follow: true } : undefined,
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
  const pathSegments = getQuestionPath(resolvedParams);
  if (pathSegments.length < 1 || pathSegments.length > 2) {
    notFound();
  }

  const topicSlug = pathSegments.length === 2 ? pathSegments[0] : '';
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

  if (question && !isQuizMode) {
    const decodedTopic = getText(question.topic, 'en').trim();
    const canonicalSlug = generateQuestionSlug(question.question, question.id).trim();
    const canonicalTopicSlug = decodedTopic ? slugifySubject(decodedTopic) : '';
    const canonicalPath = canonicalTopicSlug ? `/question/${canonicalTopicSlug}/${canonicalSlug}` : `/question/${canonicalSlug}`;

    if (currentSlug !== canonicalSlug || topicSlug !== canonicalTopicSlug) {
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

  const resolvedQuestion = question as QuestionItem;
  const questionText = getText(resolvedQuestion.question, 'en').trim();
  const topicText = getText(resolvedQuestion.topic, 'en').trim();
  const canonicalPath = buildQuestionUrl(resolvedQuestion.topic ?? topicText, resolvedQuestion.id, resolvedQuestion.question);
  const options = resolvedQuestion.options
    ? Object.entries(resolvedQuestion.options).map(([key, value]) => ({
        '@type': 'Answer',
        name: key,
        text: getTextValue(value as LocalizedText, 'en'),
      }))
    : [];
  const correctAnswer = resolvedQuestion.answer && resolvedQuestion.options?.[resolvedQuestion.answer]
    ? getTextValue(resolvedQuestion.options[resolvedQuestion.answer], 'en')
    : getTextValue(resolvedQuestion.explanation, 'en');
  const orgAuthor = {
    '@type': 'Organization' as const,
    name: SITE_NAME,
    url: BASE_URL,
  };
  const questionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: questionText,
      text: questionText,
      url: absoluteUrl(canonicalPath),
      datePublished: resolvedQuestion.year
        ? `${resolvedQuestion.year}-01-01`
        : new Date().toISOString().slice(0, 10),
      author: orgAuthor,
      answerCount: options.length,
      suggestedAnswer: options.map((option) => ({
        '@type': 'Answer',
        name: option.name,
        text: option.text,
        author: orgAuthor,
      })),
      acceptedAnswer: correctAnswer
        ? {
            '@type': 'Answer',
            text: correctAnswer,
            author: orgAuthor,
          }
        : undefined,
    },
  };

  return (
    <>
      <JsonLd data={questionJsonLd} />
      <QuestionDetailsClient
        initialQuestion={resolvedQuestion}
        initialQuestionId={questionId}
        initialQuestionSlug={currentSlug}
        initialTopic={topicSlug}
      />
    </>
  );
}

const SUPABASE_FETCH_LIMIT = 3000;
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

  const tableNames = tableName ? [tableName, 'questions'] : ['questions'];
  const escapedTopic = escapeForLike(normalizedTopic);
  const historySubCategoryKey = subjectKey === 'history' ? getHistorySubCategoryKey(normalizedTopic) : '';

  for (const table of tableNames) {
    try {
      const columns = table === 'history_questions' ? HISTORY_QUESTION_COLUMNS : PUBLIC_QUESTION_COLUMNS;
      let query = supabase.from(table).select(columns).order('id', { ascending: true });

      if (historySubCategoryKey && table === 'history_questions') {
        const hiValue = HISTORY_SUBCATEGORY_HI[historySubCategoryKey];
        query = query.or(
          `sub_category->>en.eq.${historySubCategoryKey},sub_category->>en.ilike.%${historySubCategoryKey}%,sub_category->>hi.ilike.%${hiValue}%`
        );
      } else {
        query = query.or(`topic->>en.ilike.%${escapedTopic}%,topic->>hi.ilike.%${escapedTopic}%`);
      }

      const { data, error } = await query.range(0, SUPABASE_FETCH_LIMIT - 1);

      if (error) {
        console.error('SUPABASE ERROR:', error.message ?? error);
        continue;
      }

      const questions = (data ?? []).filter((row: any) => questionMatchesTopic(row, normalizedTopic));
      if (questions.length) {
        return { questions, fetchError: null };
      }
    } catch (err) {
      console.error(`QUIZ FETCH ERROR for table ${table}:`, err);
    }
  }

  return { questions: [], fetchError: `No quiz questions found for ${normalizedTopic}.` };
}
