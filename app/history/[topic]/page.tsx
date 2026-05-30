'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import QuestionCard from '../../components/QuestionCard';
import Navbar from '../../components/Navbar';
import type { QuestionItem } from '../../actions/questions';

function HistoryQuizContent() {
  const params = useParams() as { topic?: string };
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const language: 'en' | 'hi' = 'en';

  const topic = params.topic ? String(params.topic) : '';

  useEffect(() => {
    async function loadQuestions() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        setShowExplanation(false);

        const response = await fetch(`/api/questions?v=${new Date().getTime()}`);
        if (!response.ok) {
          const errorPayload = await response.text().then((text) => {
            try {
              return JSON.parse(text);
            } catch {
              return {};
            }
          });
          throw new Error(errorPayload.error || 'Unable to load questions.');
        }

        const payload = await response.json();
        const allQuestions = payload.questions ?? [];

        const filteredQuestions = allQuestions.filter((q: any) => {
          const qTopic = typeof q.topic === 'string' ? q.topic : q.topic?.en || q.topic?.hi || '';
          return qTopic === topic;
        });

        setQuestions(filteredQuestions.length > 0 ? filteredQuestions : allQuestions);
      } catch (error) {
        setQuestions([]);
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load questions.');
      } finally {
        setIsLoading(false);
      }
    }

    loadQuestions();
  }, [topic]);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current !== null) {
        window.clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setCurrentQuestionIndex(0);
    setQuizCompleted(false);
    setShowExplanation(false);
  }, [questions]);

  const headingText = questions.length > 0 ? questionToHeading(questions[currentQuestionIndex]) : topic ? decodeURIComponent(topic) : 'History Quiz';

  function questionToHeading(question: QuestionItem) {
    if (typeof question.topic === 'string') return question.topic;
    if (!question.topic) return '';
    return question.topic[language] || question.topic.en || '';
  }

  function handleAnswerSelection(isCorrect: boolean) {
    if (isCorrect) {
      if (currentQuestionIndex + 1 < questions.length) {
        setShowExplanation(false);
        if (autoAdvanceTimerRef.current !== null) {
          window.clearTimeout(autoAdvanceTimerRef.current);
        }
        autoAdvanceTimerRef.current = window.setTimeout(() => {
          setCurrentQuestionIndex((prev) => prev + 1);
          setShowExplanation(false);
        }, 900);
      } else {
        setQuizCompleted(true);
      }
    } else {
      setShowExplanation(true);
    }
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-10">
      <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-300">History Quiz</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{headingText}</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Practice questions by topic.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/history"
              className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Back to Topics
            </Link>
            <Link
              href="/"
              className="rounded-full border border-white/10 bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Back
            </Link>
          </div>
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
            No questions were found for this topic.
          </div>
        ) : quizCompleted ? (
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-10 text-center text-emerald-100 shadow-panel">
            <h2 className="text-2xl font-semibold text-white">Quiz Complete</h2>
            <p className="mt-4 text-slate-300">You have answered all questions for this topic.</p>
            <p className="mt-2 text-slate-300">Go back to the topic list or refresh to try again.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Question {currentQuestionIndex + 1} of {questions.length}</p>
            </div>
            <QuestionCard
              key={currentQuestion?.id ?? 'question-card'}
              question={currentQuestion}
              index={currentQuestionIndex}
              showExplanation={showExplanation}
              onAnswerSelect={handleAnswerSelection}
              language={language}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoryQuiz() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0a0a0a] pt-24 text-white">
        <Suspense fallback={<div className="mx-auto max-w-7xl px-5 py-10 text-center text-slate-400">Loading History Quiz...</div>}>
          <HistoryQuizContent />
        </Suspense>
      </main>
    </>
  );
}
