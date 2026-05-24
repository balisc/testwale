import type { Metadata } from 'next';
import Link from 'next/link';
import questionsData from '../../../data/questions.json';
import { buildQuizMetadata } from '@/lib/seo';
import QuizClient from './QuizClient';
import QuizJsonLd from '@/app/components/QuizJsonLd';

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

function getText(value: LocalizedText, locale: 'en' | 'hi' = 'en') {
  if (typeof value === 'string') return value;
  return value[locale] || value.en;
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const question = questionsData.find((item) => item.id === params.id);

  if (!question) {
    return {
      title: 'Quiz Not Found | Questionwale',
      description: 'The requested quiz could not be found on Questionwale.',
    };
  }

  return buildQuizMetadata(question.exam, getText(question.topic));
}

export default function QuizPage({ params }: { params: { id: string } }) {
  const question = questionsData.find((item) => item.id === params.id);

  if (!question) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10 text-slate-200">
        <h1 className="text-3xl font-semibold text-white">Question not found</h1>
        <p className="mt-4 text-slate-400">Please go back to a subject page and choose a valid practice item.</p>
        <Link href="/" className="btn-primary mt-6 inline-block">
          Return Home
        </Link>
      </main>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://questionwale.com';
  const pageUrl = `${baseUrl}/quiz/${params.id}`;
  const questionText = getText(question.question);
  const options = Object.values(question.options).map((option) => getText(option));
  const correctAnswer = getText(question.options[question.answer] ?? '');

  return (
    <>
      <QuizJsonLd
        quizName={`${question.exam} ${question.topic} Quiz`}
        questionText={questionText}
        options={options}
        correctAnswer={correctAnswer}
        pageUrl={pageUrl}
      />
      <QuizClient question={question} />
    </>
  );
}
