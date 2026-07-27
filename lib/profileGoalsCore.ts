import {
  READINESS_MIN_UNIQUE_QUESTIONS,
  READINESS_FORMULA_EXPLANATION,
  buildReadinessBreakdown,
  calcAccuracyPercent,
  calcStreakDays,
  clampPercent,
  istDateKey,
  maskEmail,
} from './profileOverviewCore';
import type {
  GoalPeriodKey,
  GoalProgressRow,
  GoalsAchievementCard,
  ProfileGoalsData,
} from './profileGoalsTypes';

export { maskEmail };

export const GOAL_LIMITS = {
  daily: { min: 1, max: 500 },
  weekly: { min: 1, max: 5000 },
  monthly: { min: 1, max: 20000 },
} as const;

export const ACHIEVEMENT_UNIQUE_THRESHOLDS = [100, 250, 500] as const;
export const ACHIEVEMENT_STREAK_THRESHOLD = 7;
export const ACHIEVEMENT_ACCURACY_THRESHOLD = 80;
export const ACHIEVEMENT_ACCURACY_MIN_SAMPLE = READINESS_MIN_UNIQUE_QUESTIONS;

export type GoalAttemptRow = {
  question_id: string;
  attempted_at: string;
  is_correct?: boolean;
};

export function validateGoalValue(
  value: unknown,
  period: GoalPeriodKey,
): { ok: true; value: number } | { ok: false } {
  if (typeof value !== 'number' || !Number.isInteger(value)) return { ok: false };
  const limits = GOAL_LIMITS[period];
  if (value < limits.min || value > limits.max) return { ok: false };
  return { ok: true, value };
}

export function validateGoalPatch(input: {
  daily_goal?: unknown;
  weekly_goal?: unknown;
  monthly_goal?: unknown;
}):
  | { ok: true; patch: { daily_goal?: number; weekly_goal?: number; monthly_goal?: number } }
  | { ok: false } {
  const patch: { daily_goal?: number; weekly_goal?: number; monthly_goal?: number } = {};

  if (input.daily_goal !== undefined) {
    const result = validateGoalValue(input.daily_goal, 'daily');
    if (!result.ok) return { ok: false };
    patch.daily_goal = result.value;
  }
  if (input.weekly_goal !== undefined) {
    const result = validateGoalValue(input.weekly_goal, 'weekly');
    if (!result.ok) return { ok: false };
    patch.weekly_goal = result.value;
  }
  if (input.monthly_goal !== undefined) {
    const result = validateGoalValue(input.monthly_goal, 'monthly');
    if (!result.ok) return { ok: false };
    patch.monthly_goal = result.value;
  }

  if (Object.keys(patch).length === 0) return { ok: false };
  return { ok: true, patch };
}

/** Monday-start week in IST — matches `buildWeeklyActivity`. */
export function getWeekStartIst(now = new Date()): Date {
  const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = istNow.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(istNow);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(istNow.getDate() + mondayOffset);
  return monday;
}

export function getMonthStartIst(now = new Date()): Date {
  const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return new Date(istNow.getFullYear(), istNow.getMonth(), 1, 0, 0, 0, 0);
}

export function isFutureAttempt(iso: string, now = new Date()): boolean {
  return new Date(iso).getTime() > now.getTime();
}

export function countUniqueFirstAttemptsInPeriod(
  rows: GoalAttemptRow[],
  period: GoalPeriodKey,
  now = new Date(),
): number {
  const todayKey = istDateKey(now.toISOString());
  const weekStart = getWeekStartIst(now);
  const monthStart = getMonthStartIst(now);

  return rows.filter((row) => {
    if (isFutureAttempt(row.attempted_at, now)) return false;
    if (period === 'daily') return istDateKey(row.attempted_at) === todayKey;
    const attemptIst = new Date(new Date(row.attempted_at).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    if (period === 'weekly') return attemptIst >= weekStart;
    return attemptIst >= monthStart;
  }).length;
}

export function calcGoalPercent(actual: number, target: number): number {
  if (target <= 0 || !Number.isFinite(target)) return 0;
  return clampPercent(Math.round((actual / target) * 100));
}

export function buildGoalRows(
  targets: { daily: number; weekly: number; monthly: number },
  progress: { daily: number; weekly: number; monthly: number },
): GoalProgressRow[] {
  const defs: Array<{ key: GoalPeriodKey; label_en: string; label_hi: string; actual: number; target: number }> = [
    { key: 'daily', label_en: 'Daily', label_hi: 'दैनिक', actual: progress.daily, target: targets.daily },
    { key: 'weekly', label_en: 'Weekly', label_hi: 'साप्ताहिक', actual: progress.weekly, target: targets.weekly },
    { key: 'monthly', label_en: 'Monthly', label_hi: 'मासिक', actual: progress.monthly, target: targets.monthly },
  ];

  return defs.map((row) => ({
    key: row.key,
    label_en: row.label_en,
    label_hi: row.label_hi,
    actual: Math.max(0, row.actual),
    target: row.target,
    percent: calcGoalPercent(row.actual, row.target),
    achieved: row.target > 0 && row.actual >= row.target,
  }));
}

export function buildDerivedAchievements(input: {
  uniqueQuestions: number;
  streakDays: number;
  accuracyPercent: number;
  accuracySample: number;
}): GoalsAchievementCard[] {
  const uniqueUnlocked = input.uniqueQuestions >= ACHIEVEMENT_UNIQUE_THRESHOLDS[0];
  const streakUnlocked = input.streakDays >= ACHIEVEMENT_STREAK_THRESHOLD;
  const accuracyEligible = input.accuracySample >= ACHIEVEMENT_ACCURACY_MIN_SAMPLE;
  const accuracyUnlocked =
    accuracyEligible && input.accuracyPercent >= ACHIEVEMENT_ACCURACY_THRESHOLD;

  return [
    {
      id: 'first_100',
      title_en: 'First 100',
      title_hi: 'पहले 100',
      progress_label_en: uniqueUnlocked
        ? 'Unlocked'
        : `${Math.min(input.uniqueQuestions, ACHIEVEMENT_UNIQUE_THRESHOLDS[0])}/${ACHIEVEMENT_UNIQUE_THRESHOLDS[0]} questions`,
      progress_label_hi: uniqueUnlocked
        ? 'अनलॉक'
        : `${Math.min(input.uniqueQuestions, ACHIEVEMENT_UNIQUE_THRESHOLDS[0])}/${ACHIEVEMENT_UNIQUE_THRESHOLDS[0]} प्रश्न`,
      unlocked: uniqueUnlocked,
      derived: true,
    },
    {
      id: 'streak_7',
      title_en: '7 day streak',
      title_hi: '7 दिन की लकीर',
      progress_label_en: streakUnlocked
        ? 'Unlocked'
        : `${Math.min(input.streakDays, ACHIEVEMENT_STREAK_THRESHOLD)}/${ACHIEVEMENT_STREAK_THRESHOLD} days`,
      progress_label_hi: streakUnlocked
        ? 'अनलॉक'
        : `${Math.min(input.streakDays, ACHIEVEMENT_STREAK_THRESHOLD)}/${ACHIEVEMENT_STREAK_THRESHOLD} दिन`,
      unlocked: streakUnlocked,
      derived: true,
    },
    {
      id: 'accuracy_80',
      title_en: '80% accuracy',
      title_hi: '80% सटीकता',
      progress_label_en: !accuracyEligible
        ? `Need ${ACHIEVEMENT_ACCURACY_MIN_SAMPLE}+ unique questions`
        : accuracyUnlocked
          ? 'Unlocked'
          : `${Math.round(input.accuracyPercent)}/${ACHIEVEMENT_ACCURACY_THRESHOLD}%`,
      progress_label_hi: !accuracyEligible
        ? `${ACHIEVEMENT_ACCURACY_MIN_SAMPLE}+ अद्वितीय प्रश्न चाहिए`
        : accuracyUnlocked
          ? 'अनलॉक'
          : `${Math.round(input.accuracyPercent)}/${ACHIEVEMENT_ACCURACY_THRESHOLD}%`,
      unlocked: accuracyUnlocked,
      derived: true,
    },
  ];
}

export function pickNextMilestone(uniqueQuestions: number): {
  en: string;
  hi: string;
} | null {
  const next = ACHIEVEMENT_UNIQUE_THRESHOLDS.find((threshold) => threshold > uniqueQuestions);
  if (!next) return null;
  return {
    en: `Complete ${next} unique questions`,
    hi: `${next} अद्वितीय प्रश्न पूरे करें`,
  };
}

export function formatJoinedLabels(iso: string): { en: string; hi: string } {
  if (!iso) return { en: '—', hi: '—' };
  const date = new Date(iso);
  const en = new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(date);
  const hi = new Intl.DateTimeFormat('hi-IN', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(date);
  return { en, hi };
}

export function buildProfileGoalsData(input: {
  targets: { daily_goal: number; weekly_goal: number; monthly_goal: number };
  attempts: GoalAttemptRow[];
  targetExam: string | null;
  isPremium: boolean | null;
  membershipAvailable: boolean;
  displayName: string;
  email: string;
  joinedAt: string;
  now?: Date;
}): ProfileGoalsData {
  const now = input.now ?? new Date();
  const progress = {
    daily: countUniqueFirstAttemptsInPeriod(input.attempts, 'daily', now),
    weekly: countUniqueFirstAttemptsInPeriod(input.attempts, 'weekly', now),
    monthly: countUniqueFirstAttemptsInPeriod(input.attempts, 'monthly', now),
  };

  const uniqueQuestions = input.attempts.length;
  const correct = input.attempts.filter((row) => row.is_correct).length;
  const dateKeys = input.attempts.map((row) => istDateKey(row.attempted_at));
  const streakDays = calcStreakDays(dateKeys);
  const accuracyPercent = calcAccuracyPercent(correct, uniqueQuestions);
  const studyDays = new Set(dateKeys).size;
  const readinessBreakdown = buildReadinessBreakdown(uniqueQuestions, accuracyPercent, studyDays);

  const joined = formatJoinedLabels(input.joinedAt);
  const nextMilestone = pickNextMilestone(uniqueQuestions);

  return {
    goal_rows: buildGoalRows(
      {
        daily: input.targets.daily_goal,
        weekly: input.targets.weekly_goal,
        monthly: input.targets.monthly_goal,
      },
      progress,
    ),
    goal_progress_note_en: 'Progress counts unique first attempts — retries not included.',
    goal_progress_note_hi: 'प्रगति में अद्वितीय प्रथम प्रयास गिने जाते हैं — पुनः प्रयास शामिल नहीं।',
    exam_target: {
      name: input.targetExam?.trim() || null,
      exam_date_set: false,
      days_remaining: null,
      days_remaining_label_en: 'Exam date not set',
      days_remaining_label_hi: 'परीक्षा तिथि सेट नहीं',
    },
    readiness: {
      score: readinessBreakdown.locked ? null : readinessBreakdown.overall,
      label: readinessBreakdown.label,
      locked: readinessBreakdown.locked,
      percent: readinessBreakdown.locked ? null : readinessBreakdown.overall,
      explanation_en: READINESS_FORMULA_EXPLANATION.en,
      explanation_hi: READINESS_FORMULA_EXPLANATION.hi,
    },
    achievements: buildDerivedAchievements({
      uniqueQuestions,
      streakDays,
      accuracyPercent,
      accuracySample: uniqueQuestions,
    }),
    next_milestone_en: nextMilestone?.en ?? null,
    next_milestone_hi: nextMilestone?.hi ?? null,
    peer_comparison: { available: false },
    preferences: {
      display_name: input.displayName,
      email_masked: maskEmail(input.email),
      target_exam: input.targetExam?.trim() || null,
      membership_label_en: !input.membershipAvailable
        ? 'Unavailable'
        : input.isPremium
          ? 'Premium'
          : 'Free',
      membership_label_hi: !input.membershipAvailable
        ? 'उपलब्ध नहीं'
        : input.isPremium
          ? 'प्रीमियम'
          : 'मुफ़्त',
      membership_available: input.membershipAvailable,
      reminders_supported: false,
      visibility_supported: false,
      joined_label_en: joined.en,
      joined_label_hi: joined.hi,
      joined_source: 'users.created_at',
    },
    targets: {
      daily_goal: input.targets.daily_goal,
      weekly_goal: input.targets.weekly_goal,
      monthly_goal: input.targets.monthly_goal,
    },
    has_attempts: uniqueQuestions > 0,
  };
}
