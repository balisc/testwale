'use client';

import Link from 'next/link';
import type { InsightsCoverageSummary } from '@/lib/profileInsightsTypes';
import type { ProfileInsightsCopy } from '../profileInsightsCopy';

type Props = {
  copy: ProfileInsightsCopy;
  coverage: InsightsCoverageSummary;
  onSetTargetExam: () => void;
};

export default function ProfileInsightsCoverage({ copy, coverage, onSetTargetExam }: Props) {
  const total = coverage.total;
  const completedPct = total > 0 ? Math.round((coverage.completed / total) * 100) : 0;
  const inProgressPct = total > 0 ? Math.round((coverage.in_progress / total) * 100) : 0;
  const notStartedPct = total > 0 ? 100 - completedPct - inProgressPct : 0;

  return (
    <section
      aria-label={copy.coverage}
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <div>
        <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.coverage}</h3>
        <p className="mt-0.5 text-sm text-slate-500">
          {coverage.has_plan ? `${total} ${copy.topicsInPlan}` : copy.noPlan}
        </p>
      </div>

      {!coverage.has_plan ? (
        <div className="mt-4 flex flex-1 flex-col">
          <p className="text-sm text-slate-500">{copy.noPlanHint}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSetTargetExam}
              className="inline-flex min-h-[44px] items-center rounded-xl border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-[#FAF5FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {copy.setTargetExam}
            </button>
            <Link
              href="/subjects"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {copy.chooseSubjects}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div
            className="mt-4 flex h-2 overflow-hidden rounded-full bg-[#EDE9FE]"
            role="img"
            aria-label={`${copy.completed} ${coverage.completed}, ${copy.inProgress} ${coverage.in_progress}, ${copy.notStarted} ${coverage.not_started}`}
          >
            {completedPct > 0 ? (
              <div className="h-full bg-brand" style={{ width: `${completedPct}%` }} />
            ) : null}
            {inProgressPct > 0 ? (
              <div className="h-full bg-[#A78BFA]" style={{ width: `${inProgressPct}%` }} />
            ) : null}
            {notStartedPct > 0 ? (
              <div className="h-full bg-[#E2E8F0]" style={{ width: `${notStartedPct}%` }} />
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center sm:gap-3">
            {[
              { label: copy.completed, value: coverage.completed },
              { label: copy.inProgress, value: coverage.in_progress },
              { label: copy.notStarted, value: coverage.not_started },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xl font-bold text-[#0F172A] sm:text-2xl">{item.value}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
