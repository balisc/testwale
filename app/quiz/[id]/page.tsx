import questionsData from '../../../data/questions.json';
import { buildQuestionPath, extractQuestionIdFromSlug } from '@/lib/slugGenerator';
import { redirect, notFound } from 'next/navigation';
import supabase from '@/lib/supabase';

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

async function fetchRedirectQuestionById(questionId: string) {
  for (const tableName of SUBJECT_TABLES) {
    try {
      const { data, error } = await supabase.from(tableName).select('*').eq('id', questionId).single();
      if (!error && data) {
        return data;
      }
      if (error && error.code !== 'PGRST116') {
        console.warn(`Supabase query error on ${tableName}:`, error.message ?? error);
      }
    } catch (err) {
      console.warn(`Supabase fetch failed for table ${tableName}:`, err);
    }
  }
  return questionsData.find((item) => item.id === questionId);
}

export default async function QuizRedirectPage({ params }: { params: { id: string } }) {
  const questionId = extractQuestionIdFromSlug(params.id);
  const question = await fetchRedirectQuestionById(questionId);

  if (!question) {
    notFound();
  }

  redirect(buildQuestionPath(question.id, question.question));
}
