'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import QuestionCard from '../components/QuestionCard';
import type { QuestionItem } from '../actions/questions';

export const dynamic = 'force-dynamic';

export default function PracticePage() {
  const searchParams = useSearchParams();
  const subject = searchParams.get('subject')?.trim() ?? '';
  const search = searchParams.get('search')?.trim() ?? '';
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuestions() {
      if (!subject && !search) {
        setQuestions([]);
        setErrorMessage('Select a subject or enter a search term to begin.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const params = new URLSearchParams();
        if (subject) params.set('subject', subject);
        if (!subject && search) params.set('search', search);

        const response = await fetch(`/api/questions?${params.toString()}`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'Unable to load questions.');
        }

        setQuestions(payload.questions ?? []);
      } catch (error) {
        setQuestions([]);
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load questions.');
      } finally {
        setIsLoading(false);
      }
    }

    loadQuestions();
  }, [subject, search]);

  const headingText = subject ? subject : search ? `Search results for "${search}"` : 'Practice';

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-10">
      <div className="mb-8 rounded-[2rem] bg-[#03050b] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-amber-300">Practice</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{headingText}</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Questions are loaded dynamically from the <strong>testwale_db.questions</strong> collection.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
          >
            Back to Home
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300 shadow-panel">
            Loading questions...
          </div>
        ) : errorMessage ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center text-red-200 shadow-panel">
            <p className="text-lg font-semibold">{errorMessage}</p>
          </div>
        ) : !questions.length ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300 shadow-panel">
            No questions were found for this subject.
          </div>
        ) : (
          <div className="grid gap-6">
            {questions.map((question, index) => (
              <QuestionCard key={question.id} question={question} index={index} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
