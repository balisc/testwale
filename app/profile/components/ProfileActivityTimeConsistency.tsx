import { formatStudyTime } from '@/lib/profileActivityCore';
import type { ActivityTimeConsistency } from '@/lib/profileActivityTypes';
import type { ProfileActivityCopy } from '../profileActivityCopy';

type Props = {
  copy: ProfileActivityCopy;
  data: ActivityTimeConsistency;
};

export default function ProfileActivityTimeConsistency({ copy, data }: Props) {
  const totalLabel = data.has_recorded_time
    ? formatStudyTime(data.total_study_seconds)
    : copy.notRecorded;
  const maxMinutes = Math.max(...data.daily_minutes.map((point) => point.minutes), 1);
  const yTicks = [0, Math.ceil(maxMinutes / 2), maxMinutes].filter(
    (value, index, arr) => arr.indexOf(value) === index,
  );

  return (
    <section
      aria-label={copy.timeConsistency}
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <div>
        <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.timeConsistency}</h3>
        <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{copy.studyTimeChartHint}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div>
          <p className="text-lg font-bold text-brand sm:text-xl">{totalLabel}</p>
          <p className="text-xs text-slate-500 sm:text-sm">{copy.recordedAnswerTime}</p>
          <p className="text-[10px] text-slate-400">{copy.periodMetric}</p>
        </div>
        <div>
          <p className="text-lg font-bold text-brand sm:text-xl">{data.active_days}</p>
          <p className="text-xs text-slate-500 sm:text-sm">{copy.activeDays}</p>
          <p className="text-[10px] text-slate-400">{copy.periodMetric}</p>
        </div>
        <div>
          <p className="text-lg font-bold text-brand sm:text-xl">{copy.streakDays(data.current_streak_days)}</p>
          <p className="text-xs text-slate-500 sm:text-sm">{copy.currentStreak}</p>
          <p className="text-[10px] text-slate-400">{copy.lifetimeMetric}</p>
        </div>
        <div>
          <p className="text-lg font-bold text-brand sm:text-xl">{copy.streakDays(data.longest_streak_days)}</p>
          <p className="text-xs text-slate-500 sm:text-sm">{copy.longestStreak}</p>
          <p className="text-[10px] text-slate-400">{copy.lifetimeMetric}</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-700">{copy.studyTimeChart}</p>
        {!data.has_recorded_time ? (
          <p className="mt-3 text-sm text-slate-500">{copy.noTimeData}</p>
        ) : (
          <div className="mt-3 flex min-h-[120px] gap-3">
            <div className="flex flex-col justify-between py-1 text-[10px] text-slate-400" aria-hidden>
              {[...yTicks].reverse().map((tick) => (
                <span key={tick}>{tick}</span>
              ))}
            </div>
            <div className="flex min-w-0 flex-1 items-end justify-between gap-1 sm:gap-2">
              {data.daily_minutes.map((point) => {
                const heightPct = maxMinutes > 0 ? Math.round((point.minutes / maxMinutes) * 100) : 0;
                const barHeight = point.minutes > 0 ? Math.max(heightPct, 8) : 0;
                return (
                  <div key={point.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                    <div className="relative flex h-20 w-full items-end justify-center sm:h-24">
                      <div
                        className="w-full max-w-[24px] rounded-t-md bg-brand motion-reduce:transition-none"
                        style={{ height: `${barHeight}%` }}
                        title={`${point.label}: ${point.minutes} min`}
                      />
                    </div>
                    <span className="truncate text-[10px] text-slate-500 sm:text-xs">{point.label}</span>
                    <span className="sr-only">
                      {point.label}: {point.minutes} minutes
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <p className="sr-only">
        {copy.studyTimeChart}: {data.daily_minutes.map((point) => `${point.label} ${point.minutes} min`).join(', ')}
      </p>
    </section>
  );
}
