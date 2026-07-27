'use client';

import type { ActivityPeriodDays } from '@/lib/profileActivityTypes';
import type { ProfileActivityCopy } from '../profileActivityCopy';

type Props = {
  copy: ProfileActivityCopy;
  period: ActivityPeriodDays;
  onChange: (period: ActivityPeriodDays) => void;
};

const PRIMARY_PERIODS: ActivityPeriodDays[] = [7, 30];
const EXTRA_PERIODS: ActivityPeriodDays[] = [90, 'all'];

export default function ProfileActivityPeriodSelector({ copy, period, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="sr-only" id="activity-period-label">
        {copy.periodLabel}
      </span>
      <div
        role="group"
        aria-labelledby="activity-period-label"
        className="inline-flex rounded-lg border border-[#E2E8F0] bg-white p-0.5"
      >
        {PRIMARY_PERIODS.map((value) => {
          const selected = period === value;
          const label = value === 7 ? copy.period7 : copy.period30;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(value)}
              className={`min-h-[44px] rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none sm:px-4 ${
                selected
                  ? 'bg-brand text-white'
                  : 'text-slate-600 hover:bg-[#FAF5FF] hover:text-brand'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="hidden items-center gap-1 sm:flex">
        {EXTRA_PERIODS.map((value) => {
          const selected = period === value;
          const label = value === 90 ? copy.period90 : copy.periodAll;
          return (
            <button
              key={String(value)}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(value)}
              className={`min-h-[44px] rounded-md px-2 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none ${
                selected ? 'text-brand underline' : 'text-slate-500 hover:text-brand'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <p className="w-full text-right text-[11px] text-slate-400 sm:w-auto">{copy.periodSelectedHint}</p>
    </div>
  );
}
