'use client';

import type { ReviewAttempt } from '@/lib/mapPractice';

type Props = {
  attempts: ReviewAttempt[];
  onRestart: () => void;
};

export default function MapReviewPanel({ attempts, onRestart }: Props) {
  if (!attempts.length) return null;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Review Mode</h2>
        <button
          type="button"
          onClick={onRestart}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Restart Quiz
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {attempts.map((attempt, index) => (
          <article
            key={`${attempt.questionId}-${index}`}
            className={`rounded-md border p-3 ${attempt.isCorrect ? 'border-emerald-200 bg-emerald-50/40' : 'border-red-200 bg-red-50/40'}`}
          >
            <p className="text-sm font-semibold text-slate-900">{index + 1}. {attempt.questionText}</p>
            <p className="mt-1 text-xs text-slate-600">
              Selected: {attempt.selectedPoint ? `${attempt.selectedPoint.lat.toFixed(3)}, ${attempt.selectedPoint.lng.toFixed(3)}` : 'No point selected'}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Correct: {attempt.correctPoint.lat.toFixed(3)}, {attempt.correctPoint.lng.toFixed(3)}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Distance: {attempt.distanceKm.toFixed(2)} km | Tolerance: {attempt.toleranceKm.toFixed(0)} km
            </p>
            <p className={`mt-1 text-xs font-semibold ${attempt.isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
              {attempt.isCorrect ? 'Correct' : attempt.timedOut ? 'Incorrect (Time expired)' : 'Incorrect'}
            </p>
            {attempt.explanation && <p className="mt-2 text-xs text-slate-700">Explanation: {attempt.explanation}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
