import type { LocalizedText } from '@/types/polity';

export type ProfileUser = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  provider: string;
  created_at: string;
};

export type UserProfileSettings = {
  bio: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  target_exam: string | null;
  exam_date: string | null;
  target_exam_profile_id: string | null;
  target_exam_profile_code: string | null;
  target_exam_id: string | null;
  target_exam_title: LocalizedText | null;
  exam_onboarding_required: boolean;
  exam_onboarding_completed_at: string | null;
  is_premium: boolean;
  daily_goal: number;
  weekly_goal: number;
  monthly_goal: number;
};

export type ProfileRank = {
  overall: number;
  total_users: number;
  change_7d: number;
};

export type ProfileReadiness = {
  score: number;
  label: string;
};

export type ProfileTopicTag = {
  topic_title: LocalizedText;
  topic_slug?: string | null;
  subject_slug?: string | null;
  accuracy_percent: number;
  attempts_count: number;
};

export type ProfileSubjectReadiness = {
  subject_title: LocalizedText;
  subject_slug: string | null;
  accuracy_percent: number;
  attempts_count: number;
};

export type ProfileActivityItem = {
  activity_type: string;
  title: string;
  created_at: string;
  is_correct?: boolean;
};

export type ProfileRecentAttempt = {
  id: string;
  is_correct: boolean;
  attempted_at: string;
  subject_title: LocalizedText | null;
  topic_title: LocalizedText | null;
  topic_slug: string | null;
  subject_slug: string | null;
};

export type ProfileOverviewMetrics = {
  questions: number;
  accuracy_percent: number;
  streak_days: number;
  study_time_seconds: number;
};

export type ProfileWeeklyDay = {
  key: string;
  label: string;
  count: number;
};

export type ProfileReadinessBreakdown = {
  overall: number;
  label: string;
  locked: boolean;
  coverage: number;
  accuracy: number;
  consistency: number;
};

export type ProfilePageData = {
  user: ProfileUser;
  profile: UserProfileSettings;
  overview: {
    total_attempts: number;
    unique_questions_attempted: number;
    correct_count: number;
    wrong_count: number;
    accuracy_percent: number;
  };
  study_days: number;
  avg_daily_attempts: number;
  rank: ProfileRank;
  readiness: ProfileReadiness;
  by_subject: ProfileSubjectReadiness[];
  strengths: ProfileTopicTag[];
  weaknesses: ProfileTopicTag[];
  recent_activity: ProfileActivityItem[];
  counts: {
    bookmarks: number;
    notes: number;
    mistakes: number;
  };
  goals_progress: {
    today: number;
    week: number;
    month: number;
  };
  /** Canonical first-attempt metrics from user_attempts (server enriched). */
  overview_metrics?: ProfileOverviewMetrics;
  weekly_activity?: ProfileWeeklyDay[];
  readiness_breakdown?: ProfileReadinessBreakdown;
  recent_attempts?: ProfileRecentAttempt[];
};

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeProfilePage(raw: Record<string, unknown>): ProfilePageData {
  const user = (raw.user ?? {}) as Record<string, unknown>;
  const profile = (raw.profile ?? {}) as Record<string, unknown>;
  const overview = (raw.overview ?? {}) as Record<string, unknown>;
  const rank = (raw.rank ?? {}) as Record<string, unknown>;
  const readiness = (raw.readiness ?? {}) as Record<string, unknown>;
  const counts = (raw.counts ?? {}) as Record<string, unknown>;
  const goals = (raw.goals_progress ?? {}) as Record<string, unknown>;

  const mapTopic = (row: Record<string, unknown>): ProfileTopicTag => ({
    topic_title: (row.topic_title ?? null) as LocalizedText,
    topic_slug: row.topic_slug != null ? String(row.topic_slug) : null,
    subject_slug: row.subject_slug != null ? String(row.subject_slug) : null,
    accuracy_percent: toNumber(row.accuracy_percent),
    attempts_count: toNumber(row.attempts_count),
  });

  const mapSubject = (row: Record<string, unknown>): ProfileSubjectReadiness => ({
    subject_title: (row.subject_title ?? null) as LocalizedText,
    subject_slug: row.subject_slug != null ? String(row.subject_slug) : null,
    accuracy_percent: toNumber(row.accuracy_percent),
    attempts_count: toNumber(row.attempts_count),
  });

  const mapActivity = (row: Record<string, unknown>): ProfileActivityItem => ({
    activity_type: String(row.activity_type ?? 'activity'),
    title: String(row.title ?? ''),
    created_at: String(row.created_at ?? ''),
    is_correct: row.is_correct != null ? Boolean(row.is_correct) : undefined,
  });

  const mapRecentAttempt = (row: Record<string, unknown>): ProfileRecentAttempt => ({
    id: String(row.id ?? ''),
    is_correct: Boolean(row.is_correct),
    attempted_at: String(row.attempted_at ?? ''),
    subject_title: (row.subject_title ?? null) as LocalizedText | null,
    topic_title: (row.topic_title ?? null) as LocalizedText | null,
    topic_slug: row.topic_slug != null ? String(row.topic_slug) : null,
    subject_slug: row.subject_slug != null ? String(row.subject_slug) : null,
  });

  return {
    user: {
      id: String(user.id ?? ''),
      full_name: String(user.full_name ?? ''),
      email: String(user.email ?? ''),
      avatar_url: user.avatar_url != null ? String(user.avatar_url) : null,
      provider: String(user.provider ?? 'email'),
      created_at: String(user.created_at ?? ''),
    },
    profile: {
      bio: profile.bio != null ? String(profile.bio) : null,
      country: profile.country != null ? String(profile.country) : null,
      state: profile.state != null ? String(profile.state) : null,
      city: profile.city != null ? String(profile.city) : null,
      target_exam: profile.target_exam != null ? String(profile.target_exam) : null,
      exam_date: profile.exam_date != null ? String(profile.exam_date).slice(0, 10) : null,
      target_exam_profile_id:
        profile.target_exam_profile_id != null ? String(profile.target_exam_profile_id) : null,
      target_exam_profile_code:
        profile.target_exam_profile_code != null ? String(profile.target_exam_profile_code) : null,
      target_exam_id: profile.target_exam_id != null ? String(profile.target_exam_id) : null,
      target_exam_title:
        profile.target_exam_title && typeof profile.target_exam_title === 'object'
          ? (profile.target_exam_title as LocalizedText)
          : null,
      exam_onboarding_required: Boolean(profile.exam_onboarding_required),
      exam_onboarding_completed_at:
        profile.exam_onboarding_completed_at != null
          ? String(profile.exam_onboarding_completed_at)
          : null,
      is_premium: Boolean(profile.is_premium),
      daily_goal: toNumber(profile.daily_goal, 50),
      weekly_goal: toNumber(profile.weekly_goal, 300),
      monthly_goal: toNumber(profile.monthly_goal, 1500),
    },
    overview: {
      total_attempts: toNumber(overview.total_attempts),
      unique_questions_attempted: toNumber(overview.unique_questions_attempted),
      correct_count: toNumber(overview.correct_count),
      wrong_count: toNumber(overview.wrong_count),
      accuracy_percent: toNumber(overview.accuracy_percent),
    },
    study_days: toNumber(raw.study_days),
    avg_daily_attempts: toNumber(raw.avg_daily_attempts),
    rank: {
      overall: toNumber(rank.overall),
      total_users: toNumber(rank.total_users),
      change_7d: toNumber(rank.change_7d),
    },
    readiness: {
      score: toNumber(readiness.score),
      label: String(readiness.label ?? 'Average'),
    },
    by_subject: Array.isArray(raw.by_subject)
      ? (raw.by_subject as Record<string, unknown>[]).map(mapSubject)
      : [],
    strengths: Array.isArray(raw.strengths)
      ? (raw.strengths as Record<string, unknown>[]).map(mapTopic)
      : [],
    weaknesses: Array.isArray(raw.weaknesses)
      ? (raw.weaknesses as Record<string, unknown>[]).map(mapTopic)
      : [],
    recent_activity: Array.isArray(raw.recent_activity)
      ? (raw.recent_activity as Record<string, unknown>[]).map(mapActivity)
      : [],
    recent_attempts: Array.isArray(raw.recent_attempts)
      ? (raw.recent_attempts as Record<string, unknown>[]).map(mapRecentAttempt)
      : [],
    counts: {
      bookmarks: toNumber(counts.bookmarks),
      notes: toNumber(counts.notes),
      mistakes: toNumber(counts.mistakes),
    },
    goals_progress: {
      today: toNumber(goals.today),
      week: toNumber(goals.week),
      month: toNumber(goals.month),
    },
  };
}

export function readinessLabel(score: number): string {
  if (score >= 75) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 45) return 'Average';
  return 'Needs Work';
}

export function createEmptyProfilePage(
  user: ProfileUser,
  profile?: Partial<UserProfileSettings>,
): ProfilePageData {
  return {
    user,
    profile: {
      bio: profile?.bio ?? null,
      country: profile?.country ?? null,
      state: profile?.state ?? null,
      city: profile?.city ?? null,
      target_exam: profile?.target_exam ?? null,
      exam_date: profile?.exam_date ?? null,
      target_exam_profile_id: profile?.target_exam_profile_id ?? null,
      target_exam_profile_code: profile?.target_exam_profile_code ?? null,
      target_exam_id: profile?.target_exam_id ?? null,
      target_exam_title: profile?.target_exam_title ?? null,
      exam_onboarding_required: profile?.exam_onboarding_required ?? false,
      exam_onboarding_completed_at: profile?.exam_onboarding_completed_at ?? null,
      is_premium: profile?.is_premium ?? false,
      daily_goal: profile?.daily_goal ?? 50,
      weekly_goal: profile?.weekly_goal ?? 300,
      monthly_goal: profile?.monthly_goal ?? 1500,
    },
    overview: {
      total_attempts: 0,
      unique_questions_attempted: 0,
      correct_count: 0,
      wrong_count: 0,
      accuracy_percent: 0,
    },
    study_days: 0,
    avg_daily_attempts: 0,
    rank: { overall: 0, total_users: 0, change_7d: 0 },
    readiness: { score: 0, label: readinessLabel(0) },
    by_subject: [],
    strengths: [],
    weaknesses: [],
    recent_activity: [],
    counts: { bookmarks: 0, notes: 0, mistakes: 0 },
    goals_progress: { today: 0, week: 0, month: 0 },
  };
}
