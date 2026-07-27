import supabase from '@/lib/supabase';
import type { SessionUser } from '@/lib/appSession';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  createEmptyProfilePage,
  normalizeProfilePage,
  readinessLabel,
  type ProfilePageData,
  type ProfileUser,
} from '@/lib/profileAnalytics';
import {
  buildOverviewMetricsFromAttempts,
  buildReadinessBreakdown,
  buildWeeklyActivity,
  type UserAttemptSnapshot,
} from '@/lib/profileOverviewCore';

type AttemptRow = {
  question_id: string;
  is_correct: boolean;
  attempted_at: string;
};

function calcAccuracy(correct: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((correct * 1000) / total) / 10;
}

type DbUserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  provider: string | null;
  created_at: string | null;
};

type DbProfileRow = {
  bio: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  target_exam: string | null;
  exam_date: string | null;
  is_premium: boolean | null;
  daily_goal: number | null;
  weekly_goal: number | null;
  monthly_goal: number | null;
};

export async function getUserRecordFromDb(userId: string): Promise<DbUserRow | null> {
  const admin = getSupabaseAdmin();
  const client = admin ?? supabase;

  const { data, error } = await client
    .from('users')
    .select('id, full_name, email, avatar_url, provider, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('[profile/getUserRecordFromDb]', error);
    return null;
  }

  return data as DbUserRow;
}

const PROFILE_ROW_SELECT_WITH_EXAM_DATE =
  'bio, country, state, city, target_exam, exam_date, is_premium, daily_goal, weekly_goal, monthly_goal';
const PROFILE_ROW_SELECT_LEGACY =
  'bio, country, state, city, target_exam, is_premium, daily_goal, weekly_goal, monthly_goal';

function isMissingExamDateColumn(error: { message?: string } | null): boolean {
  return Boolean(error?.message?.includes('exam_date'));
}

async function fetchUserProfileRow(
  client: ReturnType<typeof getSupabaseAdmin> | typeof supabase,
  userId: string,
): Promise<DbProfileRow | null> {
  const withDate = await client
    .from('user_profiles')
    .select(PROFILE_ROW_SELECT_WITH_EXAM_DATE)
    .eq('user_id', userId)
    .maybeSingle();

  if (!withDate.error) {
    return (withDate.data as DbProfileRow | null) ?? null;
  }

  if (!isMissingExamDateColumn(withDate.error)) {
    console.error('[profile/fetchUserProfileRow]', withDate.error);
    return null;
  }

  const legacy = await client
    .from('user_profiles')
    .select(PROFILE_ROW_SELECT_LEGACY)
    .eq('user_id', userId)
    .maybeSingle();

  if (legacy.error) {
    console.error('[profile/fetchUserProfileRow]', legacy.error);
    return null;
  }

  return { ...(legacy.data as DbProfileRow), exam_date: null };
}

export async function getUserProfileRow(userId: string): Promise<DbProfileRow | null> {
  const admin = getSupabaseAdmin();
  const client = admin ?? supabase;

  await client.from('user_profiles').upsert({ user_id: userId }, { onConflict: 'user_id' });

  return fetchUserProfileRow(client, userId);
}

export function profileUserFromSession(session: SessionUser, dbUser?: DbUserRow | null): ProfileUser {
  return {
    id: session.id,
    full_name: dbUser?.full_name?.trim() || session.fullName?.trim() || session.email.split('@')[0] || 'User',
    email: dbUser?.email?.trim() || session.email,
    avatar_url: dbUser?.avatar_url ?? session.avatarUrl ?? null,
    provider: dbUser?.provider?.trim() || session.provider,
    created_at: dbUser?.created_at ?? '',
  };
}

export async function buildProfilePageForSession(session: SessionUser): Promise<ProfilePageData> {
  const page = await getUserProfilePage(session.id);
  if (page) {
    return mergeSessionUser(page, session);
  }

  const dbUser = await getUserRecordFromDb(session.id);
  const dbProfile = await getUserProfileRow(session.id);
  const profileUser = profileUserFromSession(session, dbUser);
  const empty = createEmptyProfilePage(profileUser, {
    bio: dbProfile?.bio ?? undefined,
    country: dbProfile?.country ?? undefined,
    state: dbProfile?.state ?? undefined,
    city: dbProfile?.city ?? undefined,
    target_exam: dbProfile?.target_exam ?? undefined,
    exam_date: dbProfile?.exam_date ?? undefined,
    is_premium: dbProfile?.is_premium ?? undefined,
    daily_goal: dbProfile?.daily_goal ?? undefined,
    weekly_goal: dbProfile?.weekly_goal ?? undefined,
    monthly_goal: dbProfile?.monthly_goal ?? undefined,
  });
  const enriched = await enrichProfilePageData(empty, session.id);
  return mergeSessionUser(enriched, session);
}

function istDateKey(value: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(value));
}

async function fetchUserAttemptSnapshots(userId: string): Promise<UserAttemptSnapshot[]> {
  const admin = getSupabaseAdmin();
  const client = admin ?? supabase;

  const { data, error } = await client
    .from('user_attempts')
    .select('question_id, is_correct, attempted_at, time_taken_seconds, subject_id, topic_id, subtopic_id')
    .eq('user_id', userId)
    .order('attempted_at', { ascending: false });

  if (error) {
    console.error('[profile/fetchUserAttemptSnapshots]', error);
    return [];
  }

  return (data ?? []) as UserAttemptSnapshot[];
}

export function enrichProfilePageWithOverviewMetrics(profile: ProfilePageData, attempts: UserAttemptSnapshot[]): ProfilePageData {
  const overviewMetrics = buildOverviewMetricsFromAttempts(attempts);
  const weeklyActivity = buildWeeklyActivity(attempts);
  const studyDays = new Set(attempts.map((row) => istDateKey(row.attempted_at))).size;
  const readinessBreakdown = buildReadinessBreakdown(
    overviewMetrics.questions,
    overviewMetrics.accuracy_percent,
    studyDays,
  );
  const todayKey = istDateKey(new Date().toISOString());
  const todayCount = attempts.filter((row) => istDateKey(row.attempted_at) === todayKey).length;

  return {
    ...profile,
    overview_metrics: overviewMetrics,
    weekly_activity: weeklyActivity,
    readiness_breakdown: readinessBreakdown,
    readiness: readinessBreakdown.locked
      ? { score: 0, label: readinessLabel(0) }
      : { score: readinessBreakdown.overall, label: readinessBreakdown.label },
    goals_progress: {
      ...profile.goals_progress,
      today: todayCount,
    },
  };
}

async function enrichProfilePageData(profile: ProfilePageData, userId: string): Promise<ProfilePageData> {
  const attempts = await fetchUserAttemptSnapshots(userId);
  return enrichProfilePageWithOverviewMetrics(profile, attempts);
}

async function getUserProfilePageFallback(userId: string): Promise<ProfilePageData | null> {
  const admin = getSupabaseAdmin();
  const client = admin ?? supabase;

  const { data: user, error: userError } = await client
    .from('users')
    .select('id, full_name, email, avatar_url, provider, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (userError || !user) {
    console.error('[profile/getUserProfilePageFallback] user lookup failed:', userError);
    return null;
  }

  await client.from('user_profiles').upsert({ user_id: userId }, { onConflict: 'user_id' });

  const { data: profile } = await client
    .from('user_profiles')
    .select('user_id, bio, country, state, city, target_exam, is_premium, daily_goal, weekly_goal, monthly_goal, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  const { data: attempts, error: attemptsError } = await client
    .from('user_question_attempts')
    .select('question_id, is_correct, attempted_at')
    .eq('user_id', userId)
    .order('attempted_at', { ascending: false });

  if (attemptsError) {
    console.error('[profile/getUserProfilePageFallback] attempts lookup failed:', attemptsError);
    return null;
  }

  const rows = (attempts ?? []) as AttemptRow[];
  const totalAttempts = rows.length;
  const correctCount = rows.filter((row) => row.is_correct).length;
  const wrongCount = totalAttempts - correctCount;
  const uniqueQuestions = new Set(rows.map((row) => row.question_id)).size;
  const accuracyPercent = calcAccuracy(correctCount, totalAttempts);
  const studyDays = new Set(rows.map((row) => istDateKey(row.attempted_at))).size;
  const avgDailyAttempts = studyDays > 0 ? Math.round((totalAttempts / studyDays) * 100) / 100 : 0;
  const readinessScore = Math.min(
    100,
    Math.max(0, Math.round((accuracyPercent * 0.75 + Math.min(25, studyDays * 0.5)) * 100) / 100),
  );

  const now = new Date();
  const todayKey = istDateKey(now.toISOString());
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const goalsProgress = {
    today: rows.filter((row) => istDateKey(row.attempted_at) === todayKey).length,
    week: rows.filter((row) => new Date(row.attempted_at) >= weekStart).length,
    month: rows.filter((row) => new Date(row.attempted_at) >= monthStart).length,
  };

  const mistakes = new Set(rows.filter((row) => !row.is_correct).map((row) => row.question_id)).size;

  return normalizeProfilePage({
    user,
    profile: profile ?? {
      bio: null,
      country: null,
      state: null,
      city: null,
      target_exam: null,
      exam_date: null,
      is_premium: false,
      daily_goal: 50,
      weekly_goal: 300,
      monthly_goal: 1500,
    },
    overview: {
      total_attempts: totalAttempts,
      unique_questions_attempted: uniqueQuestions,
      correct_count: correctCount,
      wrong_count: wrongCount,
      accuracy_percent: accuracyPercent,
    },
    study_days: studyDays,
    avg_daily_attempts: avgDailyAttempts,
    rank: { overall: 0, total_users: 0, change_7d: 0 },
    readiness: { score: readinessScore, label: readinessLabel(readinessScore) },
    by_subject: [],
    strengths: [],
    weaknesses: [],
    recent_activity: rows.slice(0, 8).map((row) => ({
      activity_type: 'quiz_attempted',
      title: 'Practice Question',
      created_at: row.attempted_at,
      is_correct: row.is_correct,
    })),
    counts: { bookmarks: 0, notes: 0, mistakes },
    goals_progress: goalsProgress,
  });
}

export async function getUserProfilePage(userId: string): Promise<ProfilePageData | null> {
  const admin = getSupabaseAdmin();

  let profile: ProfilePageData | null = null;

  if (admin) {
    const { data, error } = await admin.rpc('get_user_profile_page', { p_user_id: userId });
    if (!error && data) {
      profile = normalizeProfilePage(data as Record<string, unknown>);
    } else if (error) {
      console.error('[profile/getUserProfilePage] RPC failed:', error);
    }
  } else {
    console.warn(
      '[profile/getUserProfilePage] SUPABASE_SERVICE_ROLE_KEY not set; RPC requires service_role. Using fallback.',
    );
  }

  if (!profile) {
    profile = await getUserProfilePageFallback(userId);
  }

  if (!profile) return null;

  const dbFields = await getUserProfileRow(userId);
  if (dbFields) {
    profile.profile.exam_date =
      dbFields.exam_date != null ? String(dbFields.exam_date).slice(0, 10) : profile.profile.exam_date;
    if (dbFields.target_exam?.trim()) {
      profile.profile.target_exam = dbFields.target_exam;
    }
  }

  return enrichProfilePageData(profile, userId);
}

export function mergeSessionUser(profile: ProfilePageData, session: SessionUser): ProfilePageData {
  return {
    ...profile,
    user: {
      ...profile.user,
      id: session.id,
      full_name: session.fullName || profile.user.full_name,
      email: session.email || profile.user.email,
      avatar_url: session.avatarUrl ?? profile.user.avatar_url,
      provider: session.provider,
    },
  };
}

export async function updateUserProfile(
  userId: string,
  patch: Partial<{
    bio: string;
    country: string;
    target_exam: string;
    exam_date: string;
    daily_goal: number;
    weekly_goal: number;
    monthly_goal: number;
  }>,
): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const client = admin ?? supabase;

  const { error } = await client.from('user_profiles').upsert(
    {
      user_id: userId,
      ...patch,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    if (patch.exam_date && isMissingExamDateColumn(error)) {
      console.error(
        '[profile/updateUserProfile] exam_date column missing — run scripts/migrate_user_profile_exam_date.sql',
      );
    } else {
      console.error('[profile/updateUserProfile]', error);
    }
    return false;
  }

  return true;
}
