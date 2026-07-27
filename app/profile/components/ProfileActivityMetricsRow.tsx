import { formatAverageAnswerTime } from '@/lib/profileActivityCore';
import type { ActivitySummaryMetrics } from '@/lib/profileActivityTypes';
import type { ProfileActivityCopy } from '../profileActivityCopy';

type Props = {
  copy: ProfileActivityCopy;
  summary: ActivitySummaryMetrics;
};

export default function ProfileActivityMetricsRow({ copy, summary }: Props) {
  const avgLabel = summary.has_recorded_time
    ? formatAverageAnswerTime(summary.avg_answer_seconds, copy.notRecorded)
    : copy.notRecorded;

  const items = [
    { label: copy.uniqueQuestions, value: String(summary.unique_questions) },
    { label: copy.correct, value: String(summary.correct) },
    { label: copy.incorrect, value: String(summary.incorrect) },
    { label: copy.avgAnswerTime, value: avgLabel },
  ];

  return (
    <section
      aria-label={copy.periodMetric}
      className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-5 sm:px-6"
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-[#E2E8F0]">
        {items.map((item, index) => (
          <div
            key={item.label}
            className={`flex flex-col items-center text-center ${index > 0 ? 'sm:px-4' : 'sm:pr-4'}`}
          >
            <span className="text-2xl font-bold text-brand sm:text-3xl">{item.value}</span>
            <span className="mt-1 text-xs text-slate-500 sm:text-sm">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
