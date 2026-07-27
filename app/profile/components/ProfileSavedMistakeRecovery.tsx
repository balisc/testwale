import { ArrowUpRight, Clock } from 'lucide-react';
import type { SavedMistakeRecovery } from '@/lib/profileSavedTypes';
import type { ProfileSavedCopy } from '../profileSavedCopy';

type Props = {
  copy: ProfileSavedCopy;
  recovery: SavedMistakeRecovery;
};

export default function ProfileSavedMistakeRecovery({ copy, recovery }: Props) {
  const showPercent = recovery.recovery_percent != null;

  return (
    <section
      aria-label={copy.mistakeRecovery}
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <div>
        <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.mistakeRecovery}</h3>
        <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{copy.recoveryHint}</p>
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          {showPercent ? (
            <>
              <p className="text-3xl font-bold text-brand sm:text-4xl">{recovery.recovery_percent}%</p>
              <p className="mt-1 text-sm text-slate-600">
                {copy.recoveredOf(recovery.recovered_count, recovery.total_mistakes)}
              </p>
            </>
          ) : (
            <p className="text-sm font-medium text-slate-700">{copy.noFirstAttemptMistakes}</p>
          )}
        </div>

        {recovery.has_mistakes ? (
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <span>{copy.stillDue(recovery.unresolved_count)}</span>
            </li>
            {recovery.recovered_this_week > 0 ? (
              <li className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                <span>{copy.improvedThisWeek(recovery.recovered_this_week)}</span>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>

      {recovery.has_mistakes && recovery.unresolved_count === 0 ? (
        <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {copy.noMistakesRecovery}
        </p>
      ) : null}

      <p className="sr-only">
        {copy.recoveryAccessible(recovery.recovery_percent, recovery.unresolved_count)}
      </p>
    </section>
  );
}
