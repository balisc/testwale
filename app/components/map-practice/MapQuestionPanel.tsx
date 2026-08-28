'use client';

import type { MapQuestion } from '@/lib/mapPractice';
import { useLanguage } from '@/lib/LanguageContext';
import { localizeMapQuestionText } from '@/lib/mapPracticeI18n';

type Feedback = {
  isCorrect: boolean;
  distanceKm: number;
  timedOut: boolean;
  toleranceKm: number;
  correctLocationName: string;
  explanation: string | null;
};

type Props = {
  question: MapQuestion | null;
  selectedPoint: { lat: number; lng: number } | null;
  feedback: Feedback | null;
  submitted: boolean;
  submitting: boolean;
  hasNext: boolean;
  timerEnabled: boolean;
  timeLeft: number;
  hintLevel: number;
  hintText: string | null;
  onSubmit: () => void;
  onHint: () => void;
  onNext: () => void;
  onViewReview: () => void;
  onReset: () => void;
  loading: boolean;
  error: string | null;
};

export default function MapQuestionPanel({
  question,
  selectedPoint,
  feedback,
  submitted,
  submitting,
  hasNext,
  timerEnabled,
  timeLeft,
  hintLevel,
  hintText,
  onSubmit,
  onHint,
  onNext,
  onViewReview,
  onReset,
  loading,
  error,
}: Props) {
  const { language } = useLanguage();
  const questionLabel =
    question == null
      ? ''
      : question.question_text_en && question.question_text_hi
        ? language === 'hi'
          ? question.question_text_hi
          : question.question_text_en
        : localizeMapQuestionText(question.question_text, language);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Question Panel</h2>
        {timerEnabled && !submitted && question && (
          <div className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${timeLeft <= 5 ? 'border-red-200 bg-red-50 text-red-600' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
            Time Left: {timeLeft}s
          </div>
        )}
      </div>

      {loading && <p className="mt-3 text-sm text-slate-600">Loading questions...</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {!loading && !error && !question && (
        <p className="mt-3 text-sm text-slate-600">No map questions available for this filter.</p>
      )}

      {question && (
        <>
          <p className="mt-3 text-base font-semibold leading-6 text-slate-900" lang={language}>
            {questionLabel}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Topic: {question.main_topic} / {question.subtopic}
          </p>
          <p className="mt-1 text-xs text-slate-500">Difficulty: {question.difficulty ?? 'medium'}</p>

          {selectedPoint && (
            <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-600">
              Selected: {selectedPoint.lat.toFixed(3)}, {selectedPoint.lng.toFixed(3)}
            </p>
          )}

          {!submitted && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onHint}
                disabled={hintLevel >= 2}
                className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
              >
                {hintLevel === 0 ? 'Hint 1: Show Region' : hintLevel === 1 ? 'Hint 2: Map Clues' : 'Hints Exhausted'}
              </button>
              {hintText && <p className="mt-2 text-xs text-slate-600">{hintText}</p>}
            </div>
          )}

          {submitted && feedback && (
            <div
              className={`mt-4 rounded-md border p-3 ${
                feedback.isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className={`text-sm font-semibold ${feedback.isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                {feedback.isCorrect ? 'Correct' : feedback.timedOut ? 'Incorrect (Time expired)' : 'Incorrect'}
              </div>
              <div className="mt-1 text-xs text-slate-700">Distance from correct location: {feedback.distanceKm.toFixed(2)} km</div>
              <div className="mt-1 text-xs text-slate-700">Accepted tolerance radius: {feedback.toleranceKm.toFixed(0)} km</div>
              {feedback.correctLocationName && <p className="mt-2 text-sm text-slate-700">Correct location: {feedback.correctLocationName}</p>}
              {feedback.explanation && <p className="mt-2 text-sm text-slate-700">Explanation: {feedback.explanation}</p>}
            </div>
          )}
        </>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!question || !selectedPoint || submitted || submitting}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? 'Checking...' : 'Submit Answer'}
        </button>
        {hasNext ? (
          <button
            type="button"
            onClick={onNext}
            disabled={!question || !submitted}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Next Question
          </button>
        ) : (
          <button
            type="button"
            onClick={onViewReview}
            disabled={!question || !submitted}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Review Answers
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Reset Quiz
        </button>
      </div>
    </section>
  );
}
