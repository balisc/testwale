import type { ProfilePageData } from '@/lib/profileAnalytics';
import {
  buildWeeklyActivity,
  groupRecentActivity,
  pickContinueLearning,
  pickContinuePracticeHref,
} from '@/lib/profileOverview';
import type { ProfileCopy } from '../profileCopy';
import ProfileContinueLearning from './ProfileContinueLearning';
import ProfileMetricsRow from './ProfileMetricsRow';
import ProfileReadinessCard from './ProfileReadinessCard';
import ProfileRecentActivity from './ProfileRecentActivity';
import ProfileSummaryPanel from './ProfileSummaryPanel';
import ProfileWeeklyChart from './ProfileWeeklyChart';

type ProfileOverviewProps = {
  copy: ProfileCopy;
  data: ProfilePageData;
  language: 'en' | 'hi';
  onEditProfile: () => void;
  onSetTargetExam: () => void;
};

const EMPTY_METRICS = {
  questions: 0,
  accuracy_percent: 0,
  streak_days: 0,
  study_time_seconds: 0,
};

const EMPTY_READINESS = {
  overall: 0,
  label: 'Average',
  locked: true,
  coverage: 0,
  accuracy: 0,
  consistency: 0,
};

const EMPTY_WEEK = buildWeeklyActivity([]);

export default function ProfileOverview({
  copy,
  data,
  language,
  onEditProfile,
  onSetTargetExam,
}: ProfileOverviewProps) {
  const metrics = data.overview_metrics ?? EMPTY_METRICS;
  const weekly = data.weekly_activity ?? EMPTY_WEEK;
  const readiness = data.readiness_breakdown ?? EMPTY_READINESS;
  const continueItem = pickContinueLearning(data);
  const recentItems = groupRecentActivity(data.recent_attempts ?? [], 2);
  const hasPractice = metrics.questions > 0;

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6">
      <ProfileSummaryPanel
        copy={copy}
        user={data.user}
        profile={data.profile}
        continueHref={pickContinuePracticeHref(data)}
        dailyGoalCurrent={data.goals_progress.today}
        streakDays={metrics.streak_days}
        onEditProfile={onEditProfile}
        onSetTargetExam={onSetTargetExam}
        language={language}
      />

      {!hasPractice ? (
        <p className="rounded-2xl border border-[#EDE9FE] bg-[#FAF5FF] px-4 py-3 text-center text-sm text-slate-600">
          {copy.noPracticeYet}
        </p>
      ) : null}

      <ProfileMetricsRow copy={copy} metrics={metrics} />

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <ProfileWeeklyChart copy={copy} days={weekly} />
        <ProfileReadinessCard copy={copy} breakdown={readiness} language={language} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <ProfileContinueLearning copy={copy} item={continueItem} />
        <ProfileRecentActivity copy={copy} items={recentItems} language={language} />
      </div>
    </div>
  );
}
