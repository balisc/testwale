import type { SessionUser } from '@/lib/appSession';
import {
  buildProfileGoalsData,
  type GoalAttemptRow,
} from '@/lib/profileGoalsCore';
import type { ProfileGoalsData } from '@/lib/profileGoalsTypes';
import {
  getUserRecordFromDb,
  getUserProfileRow,
  profileUserFromSession,
} from '@/lib/profileServer';
import supabase from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

async function fetchFirstAttempts(userId: string): Promise<GoalAttemptRow[]> {
  const client = getSupabaseAdmin() ?? supabase;
  const { data, error } = await client
    .from('user_attempts')
    .select('question_id, attempted_at, is_correct')
    .eq('user_id', userId)
    .order('attempted_at', { ascending: false });

  if (error) {
    console.error('[profileGoals/fetchFirstAttempts]', error);
    return [];
  }

  return ((data ?? []) as GoalAttemptRow[]).map((row) => ({
    question_id: String(row.question_id),
    attempted_at: String(row.attempted_at),
    is_correct: Boolean(row.is_correct),
  }));
}

export async function getUserProfileGoals(session: SessionUser): Promise<ProfileGoalsData> {
  const [dbUser, dbProfile, attempts] = await Promise.all([
    getUserRecordFromDb(session.id),
    getUserProfileRow(session.id),
    fetchFirstAttempts(session.id),
  ]);

  const profileUser = profileUserFromSession(session, dbUser);
  const targets = {
    daily_goal: dbProfile?.daily_goal ?? 50,
    weekly_goal: dbProfile?.weekly_goal ?? 300,
    monthly_goal: dbProfile?.monthly_goal ?? 1500,
  };

  return buildProfileGoalsData({
    targets,
    attempts,
    targetExam: dbProfile?.target_exam ?? null,
    isPremium: dbProfile?.is_premium ?? false,
    membershipAvailable: dbProfile != null,
    displayName: profileUser.full_name,
    email: profileUser.email,
    joinedAt: profileUser.created_at,
  });
}
