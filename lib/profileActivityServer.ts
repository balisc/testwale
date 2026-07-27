import supabase from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  buildProfileActivityData,
  parseActivityPeriod,
  type FirstAttemptRow,
  type RetryAttemptRow,
} from '@/lib/profileActivityCore';
import type { ActivityPeriodDays, ProfileActivityData } from '@/lib/profileActivityTypes';

type FirstAttemptQueryRow = {
  question_id: string;
  is_correct: boolean;
  attempted_at: string;
  time_taken_seconds: number | null;
  subject_id: string | null;
  topic_id: string | null;
  subjects: { slug?: string; title?: { en?: string } | string } | null;
  topics: { slug?: string; title?: { en?: string } | string } | null;
  questions: { difficulty?: string | null } | null;
};

type RetryQueryRow = {
  question_id: string;
  is_correct: boolean;
  attempted_at: string;
  time_spent_seconds: number | null;
};

async function fetchFirstAttempts(userId: string): Promise<FirstAttemptRow[]> {
  const admin = getSupabaseAdmin();
  const client = admin ?? supabase;

  const { data, error } = await client
    .from('user_attempts')
    .select(
      `
      question_id,
      is_correct,
      attempted_at,
      time_taken_seconds,
      subject_id,
      topic_id,
      subjects:subject_id ( slug, title ),
      topics:topic_id ( slug, title ),
      questions:question_id ( difficulty )
    `,
    )
    .eq('user_id', userId)
    .order('attempted_at', { ascending: false });

  if (error) {
    console.error('[profileActivity/fetchFirstAttempts]', error);
    return [];
  }

  return ((data ?? []) as FirstAttemptQueryRow[]).map((row) => {
    const subject = row.subjects as { slug?: string; title?: { en?: string } | string } | null;
    const topic = row.topics as { slug?: string; title?: { en?: string } | string } | null;
    const question = row.questions as { difficulty?: string | null } | null;
    const subjectTitle =
      typeof subject?.title === 'string' ? subject.title : subject?.title?.en ?? null;
    const topicTitle = typeof topic?.title === 'string' ? topic.title : topic?.title?.en ?? null;

    return {
      question_id: String(row.question_id),
      is_correct: Boolean(row.is_correct),
      attempted_at: String(row.attempted_at),
      time_taken_seconds:
        row.time_taken_seconds != null ? Number(row.time_taken_seconds) : null,
      subject_id: row.subject_id != null ? String(row.subject_id) : null,
      topic_id: row.topic_id != null ? String(row.topic_id) : null,
      topic_title: topicTitle,
      topic_slug: topic?.slug ?? null,
      subject_slug: subject?.slug ?? null,
      difficulty: question?.difficulty ?? null,
      subject_title_en: subjectTitle,
    } satisfies FirstAttemptRow;
  });
}

async function fetchRetryAttempts(userId: string): Promise<RetryAttemptRow[]> {
  const admin = getSupabaseAdmin();
  const client = admin ?? supabase;

  const { data, error } = await client
    .from('user_question_attempts')
    .select('question_id, is_correct, attempted_at, time_spent_seconds')
    .eq('user_id', userId)
    .order('attempted_at', { ascending: true });

  if (error) {
    console.error('[profileActivity/fetchRetryAttempts]', error);
    return [];
  }

  return ((data ?? []) as RetryQueryRow[]).map((row) => ({
    question_id: String(row.question_id),
    is_correct: Boolean(row.is_correct),
    attempted_at: String(row.attempted_at),
    time_spent_seconds: row.time_spent_seconds != null ? Number(row.time_spent_seconds) : null,
  }));
}

export async function getUserProfileActivity(
  userId: string,
  periodRaw: string | null | undefined,
): Promise<ProfileActivityData> {
  const period: ActivityPeriodDays = parseActivityPeriod(periodRaw);
  const [firstAttempts, retries] = await Promise.all([
    fetchFirstAttempts(userId),
    fetchRetryAttempts(userId),
  ]);

  return buildProfileActivityData({ period, firstAttempts, retries });
}
