'use client';

import { Target, Calendar, CalendarDays } from 'lucide-react';
import type { GoalProgressRow } from '@/lib/profileGoalsTypes';
import type { ProfileGoalsCopy } from '../profileGoalsCopy';
import ProfileProgressBar from './ProfileProgressBar';

type Props = {
  copy: ProfileGoalsCopy;
  rows: GoalProgressRow[];
  language: 'en' | 'hi';
  onEdit: () => void;
};

const ICONS = {
  daily: Target,
  weekly: Calendar,
  monthly: CalendarDays,
} as const;

export default function ProfileGoalsStudyGoals({ copy, rows, language, onEdit }: Props) {
  return (
    <section
      aria-label={copy.studyGoals}
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.studyGoals}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{copy.goalProgressNote}</p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-[44px] shrink-0 items-center rounded-lg border border-brand px-3 py-1.5 text-sm font-medium text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {copy.editGoals}
        </button>
      </div>

      <ul className="mt-5 space-y-4">
        {rows.map((row) => {
          const Icon = ICONS[row.key];
          const period = language === 'hi' ? row.label_hi : row.label_en;
          const label = copy.goalRowLabel(period, row.actual, row.target);
          return (
            <li key={row.key}>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <Icon className="h-4 w-4 text-brand" aria-hidden />
                  <span>{label}</span>
                  {row.achieved ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {copy.achieved}
                    </span>
                  ) : null}
                </div>
                <span className="text-sm font-semibold text-brand">{row.percent}%</span>
              </div>
              <ProfileProgressBar
                value={Math.min(row.actual, row.target)}
                max={row.target}
                label={`${label}: ${row.percent}%`}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
