import type { ProfileWeeklyDay } from '@/lib/profileAnalytics';
import { weeklyQuestionsTotal } from '@/lib/profileOverview';
import type { ProfileCopy } from '../profileCopy';

type ProfileWeeklyChartProps = {
  copy: ProfileCopy;
  days: ProfileWeeklyDay[];
};

export default function ProfileWeeklyChart({ copy, days }: ProfileWeeklyChartProps) {
  const total = weeklyQuestionsTotal(days);
  const maxCount = Math.max(...days.map((day) => day.count), 1);
  const yTicks = [0, Math.ceil(maxCount / 3), Math.ceil((maxCount * 2) / 3), maxCount].filter(
    (value, index, arr) => arr.indexOf(value) === index,
  );

  return (
    <section
      aria-label={copy.thisWeek}
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <div>
        <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.thisWeek}</h3>
        <p className="mt-0.5 text-sm text-slate-500">
          {total} {copy.questionsCompleted}
        </p>
      </div>

      <div className="mt-4 flex min-h-[140px] flex-1 gap-3 sm:mt-6">
        <div className="flex flex-col justify-between py-1 text-[10px] text-slate-400 sm:text-xs" aria-hidden>
          {[...yTicks].reverse().map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 items-end justify-between gap-1 sm:gap-2">
          {days.map((day) => {
            const heightPct = maxCount > 0 ? Math.round((day.count / maxCount) * 100) : 0;
            const barHeight = day.count > 0 ? Math.max(heightPct, 8) : 0;

            return (
              <div key={day.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="relative flex h-24 w-full items-end justify-center sm:h-28">
                  <div
                    className="w-full max-w-[28px] rounded-t-md bg-brand motion-reduce:transition-none"
                    style={{ height: `${barHeight}%` }}
                    title={`${day.label}: ${day.count}`}
                  />
                </div>
                <span className="truncate text-[10px] font-medium text-slate-500 sm:text-xs">{day.label}</span>
                <span className="sr-only">
                  {day.label}: {day.count} questions
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="sr-only">
        {copy.chartSummary}: {days.map((day) => `${day.label} ${day.count}`).join(', ')}
      </p>
    </section>
  );
}
