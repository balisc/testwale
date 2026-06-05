/*import { notFound, redirect } from 'next/navigation';
import questionsData from '@/data/questions.json';
import supabase from '@/lib/supabase';
import { buildQuestionUrl, extractQuestionIdFromSlug, generateQuestionSlug, slugifySubject } from '@/lib/slugGenerator';

export const dynamic = 'force-dynamic';

type LocalizedText = string | { en?: string; hi?: string };
type OptionKey = 'A' | 'B' | 'C' | 'D' | 'E';

type QuestionItem = {
  id: string;
  exam?: LocalizedText | string;
  subject?: LocalizedText | string;
  topic?: LocalizedText | string;
  question: LocalizedText;
  options?: Record<OptionKey, LocalizedText>;
  answer?: OptionKey;
  explanation?: LocalizedText;
};

const SUBJECT_TABLES = [
  'questions', 'history_questions', 'science_questions', 'polity_questions',
  'economics_questions', 'geography_questions', 'general_knowledge_questions',
  'math_questions', 'current_affairs_questions', 'reasoning_questions',
] as const;

function getText(value: LocalizedText | undefined, locale: 'en' | 'hi' = 'en'): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] || value.en || value.hi || '';
}

async function fetchQuestionById(questionId: string): Promise<QuestionItem | null> {
  for (const tableName of SUBJECT_TABLES) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', questionId)
        .maybeSingle();

      if (data && !error) return data as QuestionItem;
    } catch (err) {
      console.error(`Fetch failed for table ${tableName}:`, err);
    }
  }
  const fallbackQuestion = (questionsData as QuestionItem[]).find((item) => item.id === questionId);
  return fallbackQuestion ?? null;
}

function getTextValue(value: LocalizedText | undefined, locale: 'en' | 'hi' = 'en'): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] || value.en || value.hi || '';
}

export async function generateMetadata({ params }: { params: { subject: string; questionSlug: string } }) {
  const resolvedParams = await params;
  const questionId = extractQuestionIdFromSlug(resolvedParams.questionSlug);
  if (!questionId) return { title: 'Question not found' };

  const question = await fetchQuestionById(questionId);
  if (!question) return { title: 'Question not found' };

  const questionText = getText(question.question, 'en').trim();
  const shortTitle = `${questionText.slice(0, 60).trim()}${questionText.length > 60 ? '…' : ''}`;
  const examText = getText(question.exam, 'en');
  const topicText = getText(question.topic, 'en');
  return {
    title: `${shortTitle} — Practice question`,
    description: `${examText}: practice a question on ${topicText}`,
  };
}

export default async function QuestionPage({ params }: { params: { subject: string; questionSlug: string } }) {
  const resolvedParams = await params;
  const subjectParam = String(resolvedParams.subject).toLowerCase();
  const currentSlug = decodeURIComponent(resolvedParams.questionSlug).trim();

  const questionId = extractQuestionIdFromSlug(currentSlug);
  if (!questionId) notFound();

  const question = await fetchQuestionById(questionId);
  if (!question) notFound();

  const canonicalSlug = generateQuestionSlug(question.question, question.id).trim();
  const correctPath = buildQuestionUrl(question.subject ?? '', question.id, question.question);

  if (subjectParam !== slugifySubject(question.subject ?? '') || currentSlug !== canonicalSlug) {
    return redirect(correctPath);
  }

  const sanitizedQuestion = {
    id: question.id?.toString() || '',
    exam: typeof question.exam === 'string' ? question.exam : getTextValue(question.exam, 'en'),
    subject: typeof question.subject === 'string' ? question.subject : getTextValue(question.subject, 'en'),
    topic: typeof question.topic === 'string' ? question.topic : getTextValue(question.topic, 'en'),
    question: typeof question.question === 'string' ? question.question : getTextValue(question.question, 'en'),
    options: question.options ? Object.fromEntries(
      Object.entries(question.options).map(([key, val]) => [
        key,
        typeof val === 'string' ? val : getTextValue(val, 'en'),
      ])
    ) : undefined,
    answer: question.answer?.toString() || undefined,
    explanation: typeof question.explanation === 'string' ? question.explanation : getTextValue(question.explanation, 'en'),
  };

  const optionEntries = sanitizedQuestion.options ? Object.entries(sanitizedQuestion.options) : [];
  const answerKey = sanitizedQuestion.answer;
  const answerText = answerKey ? sanitizedQuestion.options?.[answerKey] ?? '' : '';

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-4 text-sm uppercase tracking-[0.35em] text-slate-500">
            {sanitizedQuestion.topic || sanitizedQuestion.subject || 'Practice Question'}
          </div>
          <h1 className="text-3xl font-semibold text-slate-900">
            {sanitizedQuestion.question}
          </h1>
          {sanitizedQuestion.exam ? (
            <p className="mt-4 text-sm text-slate-600">Exam: {sanitizedQuestion.exam}</p>
          ) : null}

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {optionEntries.map(([key, optionText]) => (
              <div key={key} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <div className="mb-2 text-xs uppercase tracking-[0.35em] text-slate-500">Option {key}</div>
                <p className="text-base text-slate-900">{optionText}</p>
              </div>
            ))}
          </div>

          {answerKey ? (
            <div className="mt-8 rounded-3xl border border-emerald-300 bg-emerald-50 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-700">Correct answer</h2>
              <p className="mt-3 text-lg text-emerald-900">{answerKey}: {answerText}</p>
              {sanitizedQuestion.explanation ? (
                <p className="mt-4 text-sm text-slate-700">{sanitizedQuestion.explanation}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}*/

import { notFound, redirect } from 'next/navigation';
import questionsData from '@/data/questions.json';
import supabase from '@/lib/supabase';
import ClientQuiz from '@/app/subjects/[subject]/[topicSlug]/ClientQuiz';
import { extractQuestionIdFromSlug, generateQuestionSlug, slugifySubject } from '@/lib/slugGenerator';

export const dynamic = 'force-dynamic';

type LocalizedText = string | { en?: string; hi?: string };
type OptionKey = 'A' | 'B' | 'C' | 'D' | 'E';

type SearchParams = {
  q?: string | string[];
};

const SUBJECT_TABLE_MAP: Record<string, string> = {
  history: 'history_questions',
  science: 'science_questions',
  polity: 'polity_questions',
  economics: 'economics_questions',
  geography: 'geography_questions',
  'general-knowledge': 'general_knowledge_questions',
  math: 'math_questions',
  'current-affairs': 'current_affairs_questions',
  reasoning: 'reasoning_questions',
};

function normalizeTopic(value: any): string {
  if (value === null || value === undefined) return '';

  let text = '';
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      text = value.map((item) => String(item).trim()).join(' ');
    } else {
      text = String(value.en ?? value.hi ?? Object.values(value).join(' ')).trim();
    }
  } else {
    text = String(value).trim();
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed)) {
          text = parsed.map((item) => String(item).trim()).join(' ');
        } else {
          text = String(parsed.en ?? parsed.hi ?? Object.values(parsed).join(' ')).trim();
        }
      }
    } catch {
      // ignore invalid JSON
    }
  }

  return text
    .replace(/[^a-zA-Z0-9\s]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function matchTopic(value: any, target: string): boolean {
  const normalizedValue = normalizeTopic(value);
  const normalizedTarget = normalizeTopic(target);
  return normalizedValue.length > 0 && normalizedValue === normalizedTarget;
}

async function fetchTopicQuestions(tableName: string | undefined, topic: string) {
  if (!tableName) {
    return { questions: [], fetchError: 'Unable to determine the subject table.' };
  }

  try {
    const exactQueries = [
      supabase.from(tableName).select('*').eq('topic', topic).limit('all'),
      supabase.from(tableName).select('*').eq('topic_en', topic).limit('all'),
      supabase.from(tableName).select('*').eq('topic_hi', topic).limit('all'),
      supabase.from(tableName).select('*').filter('topic->>en', 'eq', topic).limit('all'),
      supabase.from(tableName).select('*').filter('topic->>hi', 'eq', topic).limit('all'),
    ];

    let data: any[] | null = null;
    let error: any = null;

    for (const query of exactQueries) {
      const result = await query;
      data = result.data as any[] | null;
      error = result.error;
      if (!error && data && data.length > 0) {
        break;
      }
    }

    if ((!data || data.length === 0) && !error) {
      const fallback = await supabase.from(tableName).select('*').order('id', { ascending: true }).limit('all');
      data = fallback.data as any[] | null;
      error = fallback.error;
    }

    if (error) {
      console.error('❌ SUPABASE ERROR:', error.message ?? error);
      return { questions: [], fetchError: String(error.message ?? error) };
    }

    const rows = (data ?? []) as any[];
    const questions = rows.filter((row) => matchTopic(row.topic ?? row.topic_en ?? row.topic_hi ?? row.topic, topic));

    if (!questions.length) {
      return { questions: [], fetchError: `No quiz questions found for ${topic}.` };
    }

    return { questions, fetchError: null };
  } catch (err) {
    console.error('❌ QUIZ FETCH ERROR:', err);
    return { questions: [], fetchError: 'An unexpected error occurred while fetching quiz questions.' };
  }
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
};

const SUBJECT_TABLES = [
  'questions', 'history_questions', 'science_questions', 'polity_questions',
  'economics_questions', 'geography_questions', 'general_knowledge_questions',
  'math_questions', 'current_affairs_questions', 'reasoning_questions',
] as const;

function getText(value: LocalizedText | undefined, locale: 'en' | 'hi' = 'en'): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] || value.en || value.hi || '';
}

async function fetchQuestionById(questionId: string): Promise<QuestionItem | null> {
  for (const tableName of SUBJECT_TABLES) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', questionId)
        .maybeSingle();

      if (data && !error) return data as QuestionItem;
    } catch (err) {
      console.error(`Fetch failed for table ${tableName}:`, err);
    }
  }
  const fallbackQuestion = (questionsData as QuestionItem[]).find((item) => item.id === questionId);
  return fallbackQuestion ?? null;
}

function getTextValue(value: LocalizedText | undefined, locale: 'en' | 'hi' = 'en'): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] || value.en || value.hi || '';
}

export async function generateMetadata({ params }: { params: { questionSlug: string } }) {
  const resolvedParams = await params;
  const questionId = extractQuestionIdFromSlug(resolvedParams.questionSlug);
  if (!questionId) return { title: 'Question not found' };

  const question = await fetchQuestionById(questionId);
  if (!question) return { title: 'Question not found' };

  const questionText = getText(question.question, 'en').trim();
  const shortTitle = `${questionText.slice(0, 60).trim()}${questionText.length > 60 ? '…' : ''}`;
  const examText = getText(question.exam, 'en');
  const topicText = getText(question.topic, 'en');
  return {
    title: `${shortTitle} — Practice question`,
    description: `${examText}: practice a question on ${topicText}`,
  };
}

export default async function QuestionPage({ params, searchParams }: { params: { questionSlug: string }; searchParams: SearchParams }) {
  const resolvedParams = await params;
  const currentSlug = decodeURIComponent(resolvedParams.questionSlug).trim();

  const questionId = extractQuestionIdFromSlug(currentSlug);
  if (!questionId) notFound();

  const question = await fetchQuestionById(questionId);
  if (!question) notFound();

  const qParam = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q;
  const qIndex = qParam !== undefined ? Number.parseInt(String(qParam), 10) : NaN;
  const isQuizMode = !Number.isNaN(qIndex);

  const canonicalSlug = generateQuestionSlug(question.question, question.id).trim();
  if (currentSlug !== canonicalSlug) {
    const query = qParam !== undefined ? `?q=${encodeURIComponent(String(qParam))}` : '';
    return redirect(`/question/${canonicalSlug}${query}`);
  }

  if (isQuizMode) {
    const subjectKey = slugifySubject(question.subject ?? '');
    const decodedTopic = getText(question.topic, 'en').trim();
    const tableName = SUBJECT_TABLE_MAP[subjectKey];
    const { questions, fetchError } = await fetchTopicQuestions(tableName, decodedTopic);
    const finalQuestions = questions.length ? questions : [question];
    return (
      <ClientQuiz
        questions={finalQuestions}
        decodedTopic={decodedTopic}
        subject={subjectKey}
        fetchError={questions.length ? fetchError : null}
        initialQuestionSlug={currentSlug}
      />
    );
  }

  const sanitizedQuestion = {
    id: question.id?.toString() || '',
    exam: typeof question.exam === 'string' ? question.exam : getTextValue(question.exam, 'en'),
    subject: typeof question.subject === 'string' ? question.subject : getTextValue(question.subject, 'en'),
    topic: typeof question.topic === 'string' ? question.topic : getTextValue(question.topic, 'en'),
    question: typeof question.question === 'string' ? question.question : getTextValue(question.question, 'en'),
    options: question.options ? Object.fromEntries(
      Object.entries(question.options).map(([key, val]) => [
        key,
        typeof val === 'string' ? val : getTextValue(val, 'en'),
      ])
    ) : undefined,
    answer: question.answer?.toString() || undefined,
    explanation: typeof question.explanation === 'string' ? question.explanation : getTextValue(question.explanation, 'en'),
  };

  const optionEntries = sanitizedQuestion.options ? Object.entries(sanitizedQuestion.options) : [];
  const answerKey = sanitizedQuestion.answer;
  const answerText = answerKey ? sanitizedQuestion.options?.[answerKey] ?? '' : '';

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-4 text-sm uppercase tracking-[0.35em] text-slate-500">
            {sanitizedQuestion.topic || sanitizedQuestion.subject || 'Practice Question'}
          </div>
          <h1 className="text-3xl font-semibold text-slate-900">
            {sanitizedQuestion.question}
          </h1>
          {sanitizedQuestion.exam ? (
            <p className="mt-4 text-sm text-slate-600">Exam: {sanitizedQuestion.exam}</p>
          ) : null}

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {optionEntries.map(([key, optionText]) => (
              <div key={key} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <div className="mb-2 text-xs uppercase tracking-[0.35em] text-slate-500">Option {key}</div>
                <p className="text-base text-slate-900">{optionText}</p>
              </div>
            ))}
          </div>

          {answerKey ? (
            <div className="mt-8 rounded-3xl border border-emerald-300 bg-emerald-50 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-700">Correct answer</h2>
              <p className="mt-3 text-lg text-emerald-900">{answerKey}: {answerText}</p>
              {sanitizedQuestion.explanation ? (
                <p className="mt-4 text-sm text-slate-700">{sanitizedQuestion.explanation}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}