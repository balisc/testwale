import Link from 'next/link';
import type { ProfileGoalsData } from '@/lib/profileGoalsTypes';
import type { ProfileGoalsCopy } from '../profileGoalsCopy';
import ProfileGoalsStudyGoals from './ProfileGoalsStudyGoals';
import ProfileGoalsExamTarget from './ProfileGoalsExamTarget';
import ProfileGoalsAchievements from './ProfileGoalsAchievements';
import ProfileGoalsPeerComparison from './ProfileGoalsPeerComparison';
import ProfileGoalsPreferences from './ProfileGoalsPreferences';

type Props = {
  copy: ProfileGoalsCopy;
  data: ProfileGoalsData;
  language: 'en' | 'hi';
  onEditGoals: () => void;
  onUpdateTarget: () => void;
  onEditProfile: () => void;
};

export default function ProfileGoals({
  copy,
  data,
  language,
  onEditGoals,
  onUpdateTarget,
  onEditProfile,
}: Props) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {!data.has_attempts ? (
        <div className="rounded-2xl border border-[#EDE9FE] bg-[#FAF5FF] px-4 py-6 text-center">
          <p className="text-sm text-slate-600">{copy.newUserHint}</p>
          <Link
            href="/subjects"
            className="mt-4 inline-flex min-h-[44px] items-center text-sm font-medium text-brand underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {copy.browseSubjects}
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:gap-6">
        <ProfileGoalsStudyGoals
          copy={copy}
          rows={data.goal_rows}
          language={language}
          onEdit={onEditGoals}
        />
        <ProfileGoalsExamTarget
          copy={copy}
          exam={data.exam_target}
          readiness={data.readiness}
          language={language}
          onUpdateTarget={onUpdateTarget}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:gap-6">
        <ProfileGoalsAchievements
          copy={copy}
          achievements={data.achievements}
          nextMilestoneEn={data.next_milestone_en}
          nextMilestoneHi={data.next_milestone_hi}
          language={language}
        />
        <ProfileGoalsPeerComparison copy={copy} />
      </div>

      <ProfileGoalsPreferences
        copy={copy}
        preferences={data.preferences}
        onEditProfile={onEditProfile}
      />
    </div>
  );
}
