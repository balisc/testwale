'use client';

import Link from 'next/link';
import { ChevronRight, Flame, Play } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import {
  calcProfileCompletionPercent,
  formatJoinedMonthYear,
  maskEmail,
} from '@/lib/profileOverview';
import type { ProfilePageData } from '@/lib/profileAnalytics';
import type { ProfileCopy } from '../profileCopy';
import ProfileProgressBar from './ProfileProgressBar';
import ExamCountdownBadge from './ExamCountdownBadge';
import { pickCatalogText } from '@/lib/useCatalogText';

type ProfileSummaryPanelProps = {
  copy: ProfileCopy;
  user: ProfilePageData['user'];
  profile: ProfilePageData['profile'];
  continueHref: string;
  dailyGoalCurrent: number;
  streakDays: number;
  onEditProfile: () => void;
  onSetTargetExam: () => void;
  language: 'en' | 'hi';
};

export default function ProfileSummaryPanel({
  copy,
  user,
  profile,
  continueHref,
  dailyGoalCurrent,
  streakDays,
  onEditProfile,
  onSetTargetExam,
  language,
}: ProfileSummaryPanelProps) {
  const completion = calcProfileCompletionPercent(profile);
  const dailyGoal = profile.daily_goal > 0 ? profile.daily_goal : 20;
  const targetExamName =
    (profile.target_exam_title ? pickCatalogText(profile.target_exam_title, language) : '') ||
    profile.target_exam;
  const formattedExamDate = profile.exam_date
    ? new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-IN', {
        dateStyle: 'long',
        timeZone: 'Asia/Kolkata',
      }).format(new Date(`${profile.exam_date}T12:00:00+05:30`))
    : null;

  return (
    <section
      aria-label={copy.title}
      className="w-full min-w-0 max-w-full rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-8 lg:p-8"
    >
      <div className="min-w-0">
        <div className="flex min-w-0 max-w-full items-center gap-4 sm:gap-5">
          <UserAvatar
            name={user.full_name}
            id={user.id}
            email={user.email}
            imageUrl={user.avatar_url}
            className="h-16 w-16 shrink-0 rounded-full bg-[#F5F3FF] ring-2 ring-[#EDE9FE] sm:h-20 sm:w-20"
            textClassName="text-xl sm:text-2xl"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="break-words text-xl font-bold text-[#0F172A] sm:text-2xl">{user.full_name}</h2>
              {!profile.exam_date && targetExamName ? (
                <button
                  type="button"
                  onClick={onSetTargetExam}
                  className="inline-flex min-h-[32px] items-center rounded-full border border-dashed border-[#BFDBFE] px-3 py-1 text-xs font-medium text-[#1D4ED8] hover:bg-[#EFF6FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {copy.setExamDate}
                </button>
              ) : null}
            </div>
            {user.email ? (
              <p className="mt-1 truncate text-sm text-slate-500">{maskEmail(user.email)}</p>
            ) : null}
            {profile.bio?.trim() ? (
              <p className="mt-2 break-words text-sm text-slate-600">{profile.bio.trim()}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-start gap-2">
              {targetExamName ? (
                <div className="flex flex-col items-start gap-2">
                  <span className="inline-flex max-w-full items-center rounded-full border border-[#DDD6FE] bg-[#FAF5FF] px-3 py-1 text-xs font-medium text-brand">
                    <span className="min-w-0 break-words">{targetExamName}</span>
                  </span>
                  {formattedExamDate ? (
                    <span className="text-xs font-medium text-slate-600">{formattedExamDate}</span>
                  ) : null}
                  {profile.exam_date ? (
                    <div className="md:hidden">
                      <ExamCountdownBadge examDate={profile.exam_date} copy={copy} language={language} />
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={onSetTargetExam}
                    className="inline-flex min-h-[32px] items-center text-xs font-medium text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    {copy.changeExamAndDate}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onSetTargetExam}
                  className="inline-flex min-h-[44px] items-center rounded-full border border-dashed border-[#DDD6FE] px-3 py-1 text-xs font-medium text-brand hover:bg-[#FAF5FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {copy.setTargetExam}
                </button>
              )}
              {user.created_at ? (
                <span className="inline-flex max-w-full items-center rounded-full border border-[#E2E8F0] bg-white px-3 py-1 text-xs font-medium text-slate-600">
                  {copy.joined} {formatJoinedMonthYear(user.created_at, language)}
                </span>
              ) : null}
            </div>
            {!targetExamName && profile.exam_date ? (
              <div className="mt-3 md:hidden">
                <ExamCountdownBadge examDate={profile.exam_date} copy={copy} language={language} />
              </div>
            ) : null}
          </div>
          {profile.exam_date ? (
            <div className="hidden shrink-0 self-center md:block">
              <ExamCountdownBadge examDate={profile.exam_date} copy={copy} language={language} />
            </div>
          ) : null}
        </div>

        <div className="mt-5 sm:mt-6">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-slate-600">
            <span>
              {completion}% {copy.profileComplete}
            </span>
            <button
              type="button"
              onClick={onEditProfile}
              className="inline-flex min-h-[44px] items-center gap-0.5 text-sm font-medium text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {copy.editProfile}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <ProfileProgressBar value={completion} label={`${copy.profileComplete}: ${completion}%`} />
        </div>
      </div>

      <div className="mt-6 flex min-w-0 flex-col justify-center border-t border-[#E2E8F0] pt-6 lg:mt-0 lg:w-[280px] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 xl:w-[300px]">
        <Link
          href={continueHref}
          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6D28D9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <Play className="h-4 w-4 fill-current" aria-hidden />
          {copy.continuePractice}
        </Link>

        <div className="mt-5 space-y-3">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{copy.dailyGoal}</span>
              <span className="text-slate-500">
                {dailyGoalCurrent} of {dailyGoal}
              </span>
            </div>
            <ProfileProgressBar
              value={dailyGoalCurrent}
              max={dailyGoal}
              label={`${copy.dailyGoal}: ${dailyGoalCurrent} of ${dailyGoal}`}
            />
          </div>
          {streakDays > 0 ? (
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <Flame className="h-4 w-4 text-orange-500" aria-hidden />
              {streakDays} {copy.dayStreak}
            </p>
          ) : (
            <p className="text-sm text-slate-500">0 {copy.dayStreak}</p>
          )}
        </div>
      </div>
    </section>
  );
}
