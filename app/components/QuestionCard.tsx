'use client';

import { useEffect, useMemo, useState } from 'react';
import type { QuestionItem } from '../actions/questions';
import { translations } from '../lib/translations';
import VerifiedSources from '@/components/questions/VerifiedSources';

const optionLabels = ['A', 'B', 'C', 'D'];

type QuestionCardProps = {
  question: QuestionItem;
  index: number;
  showExplanation: boolean;
  onAnswerSelect: (isCorrect: boolean) => void;
  language: 'en' | 'hi';
};

export default function QuestionCard({ question, index, showExplanation, onAnswerSelect, language }: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    setSelectedOption(null);
  }, [question.id]);

  const getText = (bilingual: any) => {
    if (typeof bilingual === 'string') return bilingual; // fallback for old data
    return bilingual?.[language] || bilingual?.en || bilingual?.hi || '';
  };

  const askedInLabel = getText(question.askedIn ?? (question as any).asked_in ?? question.exam ?? 'Unknown');

  const answerText = getText(question.answer).trim();
  const answerKey = answerText.length === 1 ? answerText.toUpperCase() : undefined;

  const getTranslation = (keyPath: string): string => {
    const keys = keyPath.split('.');
    let value: any = translations;
    for (const key of keys) {
      value = value?.[key];
    }
    if (typeof value === 'object' && value !== null) {
      return value[language] || value.en || '';
    }
    return '';
  };

  const optionList = useMemo(() => {
    const optionsByLang = question.options?.[language] ?? question.options?.en ?? question.options?.hi;

    if (Array.isArray(optionsByLang)) {
      return optionsByLang.map((optionText, index) => ({
        key: optionLabels[index] || String(index),
        text: optionText,
      }));
    }

    return Object.entries(question.options || {})
      .filter(([key]) => optionLabels.includes(key))
      .map(([key, optionText]) => ({
        key,
        text: optionText,
      }));
  }, [question.options, language]);

  return (
    <article className="rounded-3xl border border-white/10 bg-[#081420] p-7 shadow-panel">
      <div className="mb-5 flex items-center justify-between rounded-3xl bg-slate-200/10 px-5 py-4 text-sm font-semibold text-slate-200">
        <span className="rounded-full bg-slate-100/90 px-3 py-1 text-slate-900">Q.{index + 1}</span>
        <span className="rounded-full bg-slate-100/90 px-3 py-1 text-slate-900">Q.{index + 2}</span>
      </div>

      <div className="space-y-5">
        <div className="space-y-3 rounded-3xl bg-slate-900/70 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">{getText(question.subject)}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-xs uppercase tracking-[0.35em] text-slate-300">
                Category: {getText(question.topic)}
              </span>
              <span className="rounded-full border border-amber-400 bg-amber-400/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-amber-200">
                Asked in: {askedInLabel}
              </span>
            </div>
          </div>
          <p className="text-xl font-semibold leading-8 text-white sm:text-2xl">{getText(question.question)}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {optionList.map(({ key, text }) => {
            const isSelected = selectedOption === key;
            const optionText = getText(text).trim();
            const isAnswer = answerKey ? key === answerKey : optionText === answerText;
            const showCorrectState = selectedOption !== null;

            let optionClasses =
              'rounded-3xl border px-5 py-5 text-left text-sm font-medium transition duration-200';

            if (showCorrectState) {
              if (isAnswer) {
                optionClasses += ' border-emerald-400 bg-emerald-400/10 text-emerald-100';
              } else if (isSelected) {
                optionClasses += ' border-rose-400 bg-rose-400/10 text-rose-100';
              } else {
                optionClasses += ' border-white/10 bg-white/5 text-slate-200';
              }
            } else {
              optionClasses +=
                isSelected
                  ? ' border-emerald-400 bg-emerald-400/10 text-emerald-100'
                  : ' border-white/10 bg-white/5 text-slate-200 hover:border-emerald-400/30 hover:bg-white/10';
            }

            const isCorrectSelection = answerKey ? key === answerKey : optionText === answerText;

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedOption(key);
                  onAnswerSelect(isCorrectSelection);
                }}
                className={`${optionClasses} transition duration-200 ease-out transform hover:-translate-y-0.5 active:scale-95`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-lg font-semibold text-white">
                    {key}
                  </div>
                  <div>
                    <p className="text-sm leading-6 text-white">{getText(text)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Answer state</p>
          <p className="mt-2 text-base font-semibold text-white">
            {selectedOption
              ? (answerKey ? selectedOption === answerKey : answerText === getText(optionList.find((item) => item.key === selectedOption)?.text).trim())
                ? 'Correct answer selected'
                : 'Wrong option selected'
              : 'Please choose an option to review the explanation'}
          </p>
        </div>

        {selectedOption && showExplanation && (
          <div className="space-y-3">
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-slate-100 shadow-sm">
              <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">{getTranslation('practice.explanation')}</p>
              <p className="mt-4 text-base leading-7 text-slate-200">{getText(question.explanation)}</p>
            </div>
            <VerifiedSources
              source={typeof (question as { source?: unknown }).source === 'string' ? String((question as { source?: string }).source) : null}
              sourceMetadata={(question as { source_metadata?: unknown }).source_metadata ?? null}
              questionId={typeof question.id === 'string' || typeof question.id === 'number' ? String(question.id) : null}
              language={language}
            />
          </div>
        )}
      </div>
    </article>
  );
}
