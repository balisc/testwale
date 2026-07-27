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

async function getUserProfileRow(userId: string): Promise<DbProfileRow | null> {
  const admin = getSupabaseAdmin();
  const client = admin ?? supabase;

  await client.from('user_profiles').upsert({ user_id: userId }, { onConflict: 'user_id' });

  const { data, error } = await client
    .from('user_profiles')
    .select('bio, country, state, city, target_exam, is_premium, daily_goal, weekly_goal, monthly_goal')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[profile/getUserProfileRow]', error);
    return null;
  }

  return (data as DbProfileRow | null) ?? null;
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
  const fallback = await getUserProfilePageFallback(session.id);
  if (fallback) {
    return mergeSessionUser(fallback, session);
  }

  const dbUser = await getUserRecordFromDb(session.id);
  const dbProfile = await getUserProfileRow(session.id);
  const profileUser = profileUserFromSession(session, dbUser);
  return createEmptyProfilePage(profileUser, {
    bio: dbProfile?.bio ?? undefined,
    country: dbProfile?.country ?? undefined,
    state: dbProfile?.state ?? undefined,
    city: dbProfile?.city ?? undefined,
    target_exam: dbProfile?.target_exam ?? undefined,
    is_premium: dbProfile?.is_premium ?? undefined,
    daily_goal: dbProfile?.daily_goal ?? undefined,
    weekly_goal: dbProfile?.weekly_goal ?? undefined,
    monthly_goal: dbProfile?.monthly_goal ?? undefined,
  });
}

function istDateKey(value: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(value));
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

  if (admin) {
    const { data, error } = await admin.rpc('get_user_profile_page', { p_user_id: userId });
    if (!error && data) {
      return normalizeProfilePage(data as Record<string, unknown>);
    }
    if (error) {
      console.error('[profile/getUserProfilePage] RPC failed:', error);
    }
  } else {
    console.warn(
      '[profile/getUserProfilePage] SUPABASE_SERVICE_ROLE_KEY not set; RPC requires service_role. Using fallback.',
    );
  }

  return getUserProfilePageFallback(userId);
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
    console.error('[profile/updateUserProfile]', error);
    return false;
  }

  return true;
}
