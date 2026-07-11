'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { extractQuestionIdFromSlug } from '@/lib/slugGenerator';

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

type Props = {
  initialQuestion?: QuestionItem;
  initialQuestionId?: string;
  initialQuestionSlug?: string;
  initialTopic?: string;
};

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

function extractText(value: any, lang: 'en' | 'hi'): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    return String(value[lang] ?? value.en ?? value.hi ?? '');
  }
  return String(value);
}

type SanitizedQuestion = {
  id: string;
  exam: string;
  subject: string;
  topic: string;
  question: string;
  options?: Record<string, string>;
  answer?: string;
  explanation: string;
};

function sanitizeQuestion(question: QuestionItem & { question_text?: LocalizedText }): SanitizedQuestion {
  const questionText = question.question ?? question.question_text;
  return {
    id: question.id?.toString() || '',
    exam: typeof question.exam === 'string' ? question.exam : getTextValue(question.exam, 'en'),
    subject: typeof question.subject === 'string' ? question.subject : getTextValue(question.subject, 'en'),
    topic: typeof question.topic === 'string' ? question.topic : getTextValue(question.topic, 'en'),
    question: typeof questionText === 'string' ? questionText : getTextValue(questionText, 'en'),
    options: question.options
      ? Object.fromEntries(
          Object.entries(question.options).map(([key, val]) => [
            key,
            typeof val === 'string' ? val : getTextValue(val, 'en'),
          ])
        )
      : undefined,
    answer: question.answer?.toString() || undefined,
    explanation: typeof question.explanation === 'string' ? question.explanation : getTextValue(question.explanation, 'en'),
  };
}

export default function QuestionDetailsClient({
  initialQuestion,
  initialQuestionId,
  initialQuestionSlug,
  initialTopic,
}: Props) {
  const params = useParams();
  const rawQuestionSlug = params.questionSlug;
  const pathSegments = Array.isArray(rawQuestionSlug)
    ? rawQuestionSlug.map((item) => String(item).trim())
    : rawQuestionSlug
    ? [String(rawQuestionSlug).trim()]
    : [];
  const questionSlug = initialQuestionSlug ?? String(pathSegments[pathSegments.length - 1] ?? '').trim();
  const topicSlug = initialTopic ?? (pathSegments.length >= 2 ? String(pathSegments[0]).trim() : '');
  const questionId = useMemo(
    () => initialQuestionId ?? extractQuestionIdFromSlug(questionSlug),
    [initialQuestionId, questionSlug]
  );

  const [question, setQuestion] = useState<QuestionItem | null>(initialQuestion ?? null);
  const [loading, setLoading] = useState(!Boolean(initialQuestion));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!questionId) {
      setError('Invalid question URL.');
      setLoading(false);
      return;
    }

    if (question && String(question.id) === String(questionId)) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setQuestion(null);
    setLoading(true);
    setError(null);

    const apiPath = topicSlug
      ? `/api/questions/${encodeURIComponent(topicSlug)}/${encodeURIComponent(questionSlug)}`
      : `/api/questions/${encodeURIComponent(questionId)}`;

    fetch(apiPath)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || 'Unable to load question.');
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (!data?.question) {
          setError('Question not found.');
          setLoading(false);
          return;
        }
        setQuestion(data.question as QuestionItem);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(String(err?.message || 'Unable to load question.'));
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [questionId, question, questionSlug, topicSlug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
            <p className="text-base font-medium text-slate-700">Loading question…</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !question) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-900">Unable to load question</h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {error ?? 'The requested question could not be found.'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const sanitizedQuestion = sanitizeQuestion(question);
  const optionEntries: [string, string][] = sanitizedQuestion.options ? Object.entries(sanitizedQuestion.options) : [];
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
