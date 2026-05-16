'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Suspense } from 'react';
import QuestionCard from '../components/QuestionCard';
import TopicCard from '../components/TopicCard';
import Navbar from '../components/Navbar';
import type { QuestionItem } from '../actions/questions';

export const dynamic = 'force-dynamic';

type Topic = {
  en: string;
  hi: string;
};

function PracticeContent() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const language: 'en' | 'hi' = 'en';

  const getDisplayText = (text: string | any) => {
    if (typeof text === 'string') return text;
    return text?.[language] || text?.en || text?.hi || '';
  };

  useEffect(() => {
    async function loadTopics() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch('/api/topics');
        if (!response.ok) {
          throw new Error('Unable to load topics.');
        }

        const payload = await response.json();
        setTopics(payload.topics ?? []);
      } catch (error) {
        setTopics([]);
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load topics.');
      } finally {
        setIsLoading(false);
      }
    }

    loadTopics();
  }, []);

  useEffect(() => {
    async function loadQuestions() {
      if (!selectedTopic) return;

      setIsLoading(true);
      setErrorMessage(null);
      setShowExplanation(false);

      try {
        const response = await fetch(`/api/questions?v=${new Date().getTime()}`);
        if (!response.ok) {
          throw new Error('Unable to load questions for this topic.');
        }

        const payload = await response.json();
        const allQuestions = payload.questions ?? [];

        const filteredQuestions = allQuestions.filter((q: any) => {
          const qTopic = getDisplayText(q.topic);
          const selTopic = getDisplayText(selectedTopic);
          return qTopic === selTopic;
        });

        setQuestions(filteredQuestions.length > 0 ? filteredQuestions : allQuestions);
      } catch (error) {
        setQuestions([]);
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load questions for this topic.');
      } finally {
        setIsLoading(false);
      }
    }

    loadQuestions();
  }, [selectedTopic]);

  function handleAnswerSelection() {
    setShowExplanation(true);
  }

  function handleBackToTopics() {
    setSelectedTopic(null);
    setShowExplanation(false);
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-10">
      <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Practice</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {selectedTopic ? getDisplayText(selectedTopic) : 'Select a topic'}
            </h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Choose a topic to load questions.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Back
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300 shadow-panel">
            Loading...
          </div>
        ) : errorMessage ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center text-red-200 shadow-panel">
            <p className="text-lg font-semibold">{errorMessage}</p>
          </div>
        ) : selectedTopic ? (
          <>
            <button
              type="button"
              onClick={handleBackToTopics}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/10"
            >
              ← Back to topics
            </button>

            {!questions.length ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300 shadow-panel">
                No questions found for this topic.
              </div>
            ) : (
              <div className="grid gap-6">
                {questions.map((question, index) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    index={index}
                    showExplanation={showExplanation}
                    onAnswerSelect={handleAnswerSelection}
                    language={language}
                  />
                ))}
              </div>
            )}
          </>
        ) : !topics.length ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300 shadow-panel">
            No topics available.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {topics.map((topic, index) => (
              <TopicCard key={index} topic={topic} onSelect={setSelectedTopic} language={language} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Practice() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0a0a0a] pt-24 text-white">
        <Suspense fallback={<div className="mx-auto max-w-7xl px-5 py-10 text-center text-slate-400">Loading Practice...</div>}>
          <PracticeContent />
        </Suspense>
      </main>
    </>
  );
}
