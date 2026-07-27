import { Flame, Target, Trophy } from 'lucide-react';
import type { GoalsAchievementCard } from '@/lib/profileGoalsTypes';
import type { ProfileGoalsCopy } from '../profileGoalsCopy';

type Props = {
  copy: ProfileGoalsCopy;
  achievements: GoalsAchievementCard[];
  nextMilestoneEn: string | null;
  nextMilestoneHi: string | null;
  language: 'en' | 'hi';
};

const ICONS = {
  first_100: Trophy,
  streak_7: Flame,
  accuracy_80: Target,
} as const;

export default function ProfileGoalsAchievements({
  copy,
  achievements,
  nextMilestoneEn,
  nextMilestoneHi,
  language,
}: Props) {
  const nextMilestone = language === 'hi' ? nextMilestoneHi : nextMilestoneEn;

  return (
    <section
      aria-label={copy.achievements}
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <div>
        <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.achievements}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{copy.derivedMilestones}</p>
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {achievements.map((item) => {
          const Icon = ICONS[item.id as keyof typeof ICONS] ?? Trophy;
          const title = language === 'hi' ? item.title_hi : item.title_en;
          const progress = language === 'hi' ? item.progress_label_hi : item.progress_label_en;
          return (
            <li
              key={item.id}
              className={`rounded-xl border px-3 py-4 text-center ${
                item.unlocked ? 'border-[#DDD6FE] bg-[#FAF5FF]' : 'border-[#F1F5F9] bg-white'
              }`}
            >
              <Icon className="mx-auto h-6 w-6 text-brand" aria-hidden />
              <p className="mt-2 text-sm font-semibold text-slate-800">{title}</p>
              <p className="mt-1 text-xs text-slate-600">{progress}</p>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-sm text-slate-600">
        {nextMilestone ? (
          <>
            <span className="font-medium">{copy.nextMilestone}: </span>
            {nextMilestone}
          </>
        ) : (
          copy.allMilestonesComplete
        )}
      </p>
    </section>
  );
}
