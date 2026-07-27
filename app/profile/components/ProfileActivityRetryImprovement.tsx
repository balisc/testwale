import type { ActivityRetryImprovement } from '@/lib/profileActivityTypes';
import type { ProfileActivityCopy } from '../profileActivityCopy';
import ProfileProgressBar from './ProfileProgressBar';

type Props = {
  copy: ProfileActivityCopy;
  data: ActivityRetryImprovement;
};

export default function ProfileActivityRetryImprovement({ copy, data }: Props) {
  if (data.locked) {
    return (
      <section
        aria-label={copy.improvementAfterRetry}
        className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
      >
        <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.improvementAfterRetry}</h3>
        <div className="mt-6 flex flex-1 flex-col justify-center rounded-xl border border-dashed border-[#DDD6FE] bg-[#FAF5FF] px-4 py-8 text-center">
          <p className="text-sm font-medium text-slate-700">{copy.retryLockedTitle}</p>
          <p className="mt-2 text-sm text-slate-500">{copy.retryLockedHint}</p>
          {data.cohort_size > 0 ? (
            <p className="mt-2 text-xs text-slate-400">{copy.cohortSample(data.cohort_size)}</p>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label={copy.improvementAfterRetry}
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <div>
        <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.improvementAfterRetry}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{copy.cohortSample(data.cohort_size)}</p>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-slate-600">{copy.firstAttempt}</span>
            <span className="font-semibold text-brand">
              {copy.percentLabel(data.first_attempt_accuracy_percent)}
            </span>
          </div>
          <ProfileProgressBar
            value={data.first_attempt_accuracy_percent}
            label={`${copy.firstAttempt}: ${data.first_attempt_accuracy_percent}%`}
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-slate-600">{copy.afterRevision}</span>
            <span className="font-semibold text-brand">
              {copy.percentLabel(data.after_retry_accuracy_percent)}
            </span>
          </div>
          <ProfileProgressBar
            value={data.after_retry_accuracy_percent}
            label={`${copy.afterRevision}: ${data.after_retry_accuracy_percent}%`}
          />
        </div>
      </div>

      <div className="mt-6">
        <p className="text-2xl font-bold text-brand sm:text-3xl">
          {copy.improvementPoints(data.improvement_points)}
        </p>
        <p className="mt-1 text-sm text-slate-600">{copy.mistakesCorrected(data.mistakes_corrected)}</p>
      </div>
    </section>
  );
}
