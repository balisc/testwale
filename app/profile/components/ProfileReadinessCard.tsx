'use client';

import { useId, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import {
  READINESS_FORMULA_EXPLANATION,
  READINESS_MIN_UNIQUE_QUESTIONS,
  readinessStageLabel,
} from '@/lib/profileOverview';
import type { ProfileReadinessBreakdown } from '@/lib/profileAnalytics';
import type { ProfileCopy } from '../profileCopy';
import ProfileProgressBar from './ProfileProgressBar';

type ProfileReadinessCardProps = {
  copy: ProfileCopy;
  breakdown: ProfileReadinessBreakdown;
  language: 'en' | 'hi';
};

export default function ProfileReadinessCard({ copy, breakdown, language }: ProfileReadinessCardProps) {
  const [showHelp, setShowHelp] = useState(false);
  const helpId = useId();

  return (
    <section
      aria-label={copy.examReadiness}
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.examReadiness}</h3>

      {breakdown.locked ? (
        <p className="mt-4 text-sm leading-relaxed text-slate-600">{copy.readinessLocked}</p>
      ) : (
        <>
          <div className="mt-4">
            <p className="text-4xl font-bold text-brand">{breakdown.overall}%</p>
            <p className="mt-1 text-sm text-slate-500">{readinessStageLabel(breakdown.label, language)}</p>
          </div>

          <div className="mt-5 space-y-3.5">
            {[
              { label: copy.coverage, value: breakdown.coverage },
              { label: copy.accuracy, value: breakdown.accuracy },
              { label: copy.consistency, value: breakdown.consistency },
            ].map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-700">{row.label}</span>
                  <span className="font-medium text-slate-900">{row.value}%</span>
                </div>
                <ProfileProgressBar value={row.value} label={`${row.label}: ${row.value}%`} />
              </div>
            ))}
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setShowHelp((open) => !open)}
        aria-expanded={showHelp}
        aria-controls={helpId}
        className="mt-5 inline-flex min-h-[44px] items-center gap-0.5 self-start text-sm font-medium text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {copy.howCalculated}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>

      {showHelp ? (
        <p id={helpId} className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
          {READINESS_FORMULA_EXPLANATION[language]}
          {breakdown.locked ? ` (${READINESS_MIN_UNIQUE_QUESTIONS}+ questions required.)` : ''}
        </p>
      ) : null}
    </section>
  );
}
