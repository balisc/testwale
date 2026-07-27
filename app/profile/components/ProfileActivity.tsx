import Link from 'next/link';
import type { ProfileActivityData } from '@/lib/profileActivityTypes';
import type { ProfileActivityCopy } from '../profileActivityCopy';
import ProfileActivityMetricsRow from './ProfileActivityMetricsRow';
import ProfileActivityAccuracyTrend from './ProfileActivityAccuracyTrend';
import ProfileActivityRetryImprovement from './ProfileActivityRetryImprovement';
import ProfileActivityTimeConsistency from './ProfileActivityTimeConsistency';
import ProfileActivityPracticeMix from './ProfileActivityPracticeMix';
import ProfileActivityRecentTable from './ProfileActivityRecentTable';

type Props = {
  copy: ProfileActivityCopy;
  data: ProfileActivityData;
  language: 'en' | 'hi';
};

export default function ProfileActivity({ copy, data, language }: Props) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {!data.has_any_attempts ? (
        <div className="rounded-2xl border border-[#EDE9FE] bg-[#FAF5FF] px-4 py-6 text-center">
          <p className="text-sm text-slate-600">{copy.noAttempts}</p>
          <Link
            href="/subjects"
            className="mt-4 inline-flex min-h-[44px] items-center text-sm font-medium text-brand underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {copy.browseSubjects}
          </Link>
        </div>
      ) : null}

      <ProfileActivityMetricsRow copy={copy} summary={data.summary} />

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <ProfileActivityAccuracyTrend copy={copy} trend={data.accuracy_trend} />
        <ProfileActivityRetryImprovement copy={copy} data={data.retry_improvement} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <ProfileActivityTimeConsistency copy={copy} data={data.time_consistency} />
        <ProfileActivityPracticeMix copy={copy} mix={data.practice_mix} language={language} />
      </div>

      <ProfileActivityRecentTable copy={copy} items={data.recent_activity} />
    </div>
  );
}
