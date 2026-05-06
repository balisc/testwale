'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import questionsData from '../../../data/questions.json';

type OptionKey = 'A' | 'B' | 'C' | 'D' | 'E';

type QuestionItem = {
  id: string;
  exam: string;
  subject: string;
  topic: string;
  question: string;
  options: Record<OptionKey, string>;
  answer: OptionKey;
  explanation: string;
};

export default function QuizPage({ params }: { params: { id: string } }) {
  const question = useMemo(() => questionsData.find((item) => item.id === params.id), [params.id]);
  const [selected, setSelected] = useState<OptionKey | ''>('');
  const [checked, setChecked] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(150);

  useEffect(() => {
    if (!question) return;
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft, question]);

  if (!question) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10 text-slate-200">
        <h1 className="text-3xl font-semibold text-white">Question not found</h1>
        <p className="mt-4 text-slate-400">Please go back to a subject page and choose a valid practice item.</p>
        <Link href="/" className="btn-primary mt-6 inline-block">Return Home</Link>
      </main>
    );
  }

  const totalSeconds = 150;
  const progress = Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100);

  const optionEntries = Object.entries(question.options) as [OptionKey, string][];
  const selectedCorrect = selected === question.answer;

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 lg:px-10">
      <div className="mb-8 flex flex-col gap-6 rounded-3xl border border-white/10 bg-[#071623]/90 p-6 shadow-panel sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-accent">Live quiz</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">{question.exam} — {question.topic}</h1>
          <p className="mt-2 text-slate-400">Answer the question and check your reasoning instantly.</p>
        </div>
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-right text-sm text-slate-200">
          <div className="flex items-center justify-between gap-3">
            <span className="uppercase tracking-[0.35em] text-slate-400">Timer</span>
            <span className="font-semibold text-white">{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</span>
          </div>
          <div className="overflow-hidden rounded-full bg-white/10">
            <div className="h-2 rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <section className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-accent">Question</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">{question.question}</h2>
            </div>
            <Link href={`/questions/${question.subject}`} className="rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent transition hover:bg-accent/15">
              Back to Topic
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {optionEntries.map(([key, value]) => {
              const isSelected = selected === key;
              const isCorrectOption = key === question.answer;
              const shouldHighlightCorrect = checked && isCorrectOption;
              const shouldShowWrong = checked && isSelected && !selectedCorrect;
              const borderColor = shouldHighlightCorrect
                ? 'border-emerald-400 bg-emerald-500/10 text-white'
                : shouldShowWrong
                ? 'border-rose-500 bg-rose-500/10 text-white'
                : isSelected
                ? 'border-accent bg-accent/10 text-white'
                : 'border-white/10 bg-white/5 text-slate-200';

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => !checked && setSelected(key)}
                  className={`w-full rounded-3xl border p-5 text-left transition ${borderColor} ${checked ? 'cursor-default' : 'hover:border-accent/40 hover:bg-hoverbg'} `}
                >
                  <div className="flex items-center gap-4">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold text-slate-100">{key}</span>
                    <span className="text-base leading-7">{value}</span>
                  </div>
                  {checked && isCorrectOption && (
                    <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-200">
                      ✓ Correct answer
                    </span>
                  )}
                  {checked && shouldShowWrong && (
                    <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-sm text-rose-200">
                      ✕ Wrong answer
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={!selected || checked}
              onClick={() => setChecked(true)}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Check Answer
            </button>
            <p className="text-sm text-slate-400">{selected ? `Selected ${selected}` : 'Select an option to check the answer'}</p>
          </div>
        </div>

        {checked && (
          <div className="rounded-3xl border-2 border-accent bg-[#111f39] p-6 shadow-panel">
            <h3 className="text-xl font-semibold text-accent">Explanation</h3>
            <p className="mt-4 leading-7 text-slate-200">{question.explanation}</p>
          </div>
        )}
      </section>
    </main>
  );
}
