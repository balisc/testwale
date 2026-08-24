import { formatStudyTime } from '@/lib/profileOverview';
import type { ProfileOverviewMetrics } from '@/lib/profileAnalytics';
import type { ProfileCopy } from '../profileCopy';

type ProfileMetricsRowProps = {
  copy: ProfileCopy;
  metrics: ProfileOverviewMetrics;
};

export default function ProfileMetricsRow({ copy, metrics }: ProfileMetricsRowProps) {
  const streakLabel =
    metrics.streak_days === 1
      ? `1 ${copy.day}`
      : `${metrics.streak_days} ${copy.days}`;

  const items = [
    { label: copy.questions, value: metrics.questions.toLocaleString() },
    { label: copy.accuracy, value: `${metrics.accuracy_percent}%` },
    { label: copy.streak, value: streakLabel },
    { label: copy.studyTime, value: formatStudyTime(metrics.study_time_seconds) },
  ];

  return (
    <section
      aria-label="Key metrics"
      className="grid w-full min-w-0 max-w-full grid-cols-2 rounded-2xl border border-[#E2E8F0] bg-white sm:grid-cols-4"
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          className={`flex min-w-0 flex-col items-center justify-center px-4 py-5 text-center sm:py-6 ${
            index > 0 ? 'border-[#E2E8F0] sm:border-l' : ''
          } ${index % 2 === 1 ? 'border-l sm:border-l' : ''} ${index >= 2 ? 'border-t sm:border-t-0' : ''}`}
        >
          <p className="max-w-full break-words text-2xl font-bold text-[#0F172A] sm:text-3xl">{item.value}</p>
          <p className="mt-1 max-w-full break-words text-xs font-medium text-slate-500 sm:text-sm">{item.label}</p>
        </div>
      ))}
    </section>
  );
}
