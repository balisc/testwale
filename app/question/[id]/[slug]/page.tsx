import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import supabase from '@/lib/supabase';
import questionsData from '../../../../data/questions.json';
import { buildQuestionPath, extractQuestionIdFromSlug, generateQuestionSlug } from '@/lib/slugGenerator';

export const dynamic = 'force-dynamic';

const SUBJECT_TABLES = [
  'questions',
  'history_questions',
  'science_questions',
  'polity_questions',
  'economics_questions',
  'geography_questions',
  'general_knowledge_questions',
  'math_questions',
  'current_affairs_questions',
  'reasoning_questions',
];

type LocalizedText = string | { en: string; hi: string };

type QuestionItem = {
  id: string;
  exam: string;
  subject: string;
  topic: string;
  question: LocalizedText;
  options: Record<string, LocalizedText>;
  answer: string;
  explanation: LocalizedText;
};

function getText(value: LocalizedText, locale: 'en' | 'hi' = 'en'): string {
  if (typeof value === 'string') return value;
  return value[locale] || value.en;
}

async function fetchQuestionById(id: string): Promise<QuestionItem | null> {
  for (const tableName of SUBJECT_TABLES) {
    try {
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
      if (!error && data) {
        return data;
      }
      if (error && error.code !== 'PGRST116') {
        // PGRST116 is returned when table does not exist in some environments.
        console.warn(`Supabase query error on ${tableName}:`, error.message ?? error);
      }
    } catch (err) {
      console.warn(`Supabase fetch failed for table ${tableName}:`, err);
    }
  }

  return questionsData.find((item) => item.id === id) ?? null;
}

export function generateStaticParams() {
  return questionsData.map((question) => ({
    id: question.id,
    slug: generateQuestionSlug(question.question, question.id),
  }));
}

export async function generateMetadata({ params }: { params: { id: string; slug: string } }): Promise<Metadata> {
  const question = await fetchQuestionById(params.id);

  if (!question) {
    return {
      title: 'Question not found | Questionwale',
      description: 'This question could not be found.',
    };
  }

  const questionText = getText(question.question);
  const topicText = getText(question.topic);
  const examText = question.exam;

  return {
    title: `${questionText} | ${examText}`,
    description: `Practice this question from ${topicText} and improve your score.`,
    openGraph: {
      title: `${questionText} | ${examText}`,
      description: `Practice this question from ${topicText} and improve your score.`,
    },
  };
}

export default async function QuestionPage({ params }: { params: { id: string; slug: string } }) {
  const question = await fetchQuestionById(params.id);

  if (!question) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10 text-slate-200">
        <h1 className="text-3xl font-semibold text-white">Question not found</h1>
        <p className="mt-4 text-slate-400">Please return to the subject page and choose a valid question.</p>
        <Link href="/" className="btn-primary mt-6 inline-block">
          Return Home
        </Link>
      </main>
    );
  }

  const expectedSlug = generateQuestionSlug(question.question, question.id);
  if (params.slug !== expectedSlug) {
    redirect(buildQuestionPath(question.id, question.question));
  }

  const questionText = getText(question.question);
  const options = Object.values(question.options).map((option) => getText(option));
  const correctAnswer = getText(question.options[question.answer] ?? '');

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 lg:px-10">
      <div className="mb-8 rounded-3xl border border-white/10 bg-[#071623]/90 p-6 shadow-panel">
        <p className="text-sm uppercase tracking-[0.35em] text-accent">{question.exam}</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">{questionText}</h1>
        <p className="mt-3 text-slate-400">{getText(question.topic)} — question ID {question.id}</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel">
        <p className="text-sm uppercase tracking-[0.35em] text-accent">Options</p>
        <div className="mt-4 space-y-3">
          {options.map((option, index) => (
            <div key={index} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-slate-100">
              <span className="font-semibold">{String.fromCharCode(65 + index)}.</span> {option}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-[#071623]/90 p-6 shadow-panel text-slate-200">
        <h2 className="text-xl font-semibold text-white">Explanation</h2>
        <p className="mt-4 leading-7">{getText(question.explanation)}</p>
      </div>
    </main>
  );
}
