import 'server-only';

import { unstable_cache } from 'next/cache';
import { getAuthUserFromCookies } from '@/lib/authCookies';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getActiveExamProfileIdentity } from '@/lib/examProfileIdentityServer';
import { attachCatalogContentMappings, buildPublishedSyllabusHierarchy } from '@/lib/examSyllabus';
import { getCatalogSnapshot } from '@/lib/catalogCache';
import { applyAttemptHistoryToSnapshot, type ExamLearningAttempt, type ExamLearningSnapshot } from '@/lib/examLearning';
import type { ExamSyllabusNodeRow, ExamSyllabusVersionRow } from '@/types/supabase';

export type SelectedExamLearningResult =
  | { status: 'unauthenticated' }
  | { status: 'incomplete' }
  | { status: 'inactive'; examId: string | null }
  | { status: 'error' }
  | { status: 'ready'; userId: string; snapshot: ExamLearningSnapshot };

export type SelectedExamContextResult =
  | { status: 'unauthenticated' }
  | { status: 'incomplete' }
  | { status: 'inactive'; examId: string | null }
  | { status: 'error' }
  | {
      status: 'ready';
      userId: string;
      examProfileId: string;
      contentExamId: string;
      examCode: string;
      questionTag: string;
      examTitle: ExamLearningSnapshot['exam']['title'];
      targetDate: string;
    };

export type ReadySelectedExamContext = Extract<SelectedExamContextResult, { status: 'ready' }>;

type DbError = { message: string } | null;
type DbPage = { data: unknown[] | null; error: DbError };
type SelectedProfileRow = {
  target_exam_profile_id: string | null;
  target_exam_id: string | null;
  exam_date: string | null;
  exam_onboarding_required: boolean | null;
  exam_onboarding_completed_at: string | null;
};

export const SELECTED_EXAM_CONTEXT_CACHE_TAG = 'selected-exam-context';
export const EXAM_LEARNING_PROGRESS_CACHE_TAG = 'exam-learning-progress';
export const EXAM_DASHBOARD_PREFERENCE_CACHE_TAG = 'exam-dashboard-preference';

export function getExamLearningProgressCacheTag(userId: string): string {
  return `${EXAM_LEARNING_PROGRESS_CACHE_TAG}:${userId}`;
}

async function collectRows(
  loadPage: (from: number, to: number) => PromiseLike<DbPage>,
): Promise<Record<string, unknown>[]> {
  const pageSize = 1000;
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += pageSize) {
    const result = await loadPage(from, from + pageSize - 1);
    if (result.error) throw new Error(result.error.message);
    const page = (result.data ?? []).filter(
      (row): row is Record<string, unknown> => Boolean(row && typeof row === 'object'),
    );
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

type PublishedExamBaseInput = {
  profileId: string;
  contentExamId: string;
  examCode: string;
  questionTag: string;
  examTitle: ExamLearningSnapshot['exam']['title'];
};

async function fetchPublishedExamBaseSnapshot(
  input: PublishedExamBaseInput,
): Promise<ExamLearningSnapshot> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('supabase_not_configured');

  // is_current is the database's explicit canonical-version rule. A zero or
  // duplicate result is an integrity error; never pick an arbitrary timestamp.
  const versions = await collectRows((from, to) =>
    admin
      .from('exam_syllabus_versions')
      .select('id, exam_profile_id, version_code, publication_status, is_current, title')
      .eq('exam_profile_id', input.profileId)
      .eq('publication_status', 'published')
      .eq('is_current', true)
      .range(from, to),
  ) as ExamSyllabusVersionRow[];
  if (versions.length !== 1) {
    throw new Error(`published_current_syllabus_count:${versions.length}`);
  }
  const version = versions[0]!;

  const [nodeRows, catalog] = await Promise.all([
    collectRows((from, to) =>
      admin
        .from('exam_syllabus_nodes')
        .select(
          'id, syllabus_version_id, parent_node_id, node_code, node_type, title, description, sort_order, is_active, metadata',
        )
        .eq('syllabus_version_id', version.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('node_code', { ascending: true })
        .range(from, to),
    ) as Promise<ExamSyllabusNodeRow[]>,
    getCatalogSnapshot(),
  ]);
  const mappedHierarchy = attachCatalogContentMappings(
    buildPublishedSyllabusHierarchy(nodeRows),
    catalog,
  );
  // Catalog counters are maintained by database triggers. Using those compact
  // rows avoids downloading every matching question on each cold dashboard load;
  // the actual practice batch remains bound to the exact exam-profile mapping.
  const hierarchy = mappedHierarchy;

  const emptyProgress = {
    attempted_count: 0,
    correct_count: 0,
    wrong_count: 0,
    total_time_spent_seconds: 0,
    average_time_spent_seconds: 0,
  };
  const baseSnapshot: ExamLearningSnapshot = {
    exam: {
      id: input.contentExamId,
      profile_id: input.profileId,
      syllabus_version_id: version.id,
      syllabus_version_code: version.version_code,
      code: input.examCode,
      question_tag: input.questionTag,
      title: input.examTitle,
      target_date: '',
    },
    overview: {
      total_questions: hierarchy.subtopics.reduce((total, row) => total + row.question_count, 0),
      attempted_count: 0,
      correct_count: 0,
      wrong_count: 0,
      total_time_spent_seconds: 0,
      average_time_spent_seconds: 0,
      completion_percent: 0,
      accuracy_percent: 0,
    },
    subjects: hierarchy.subjects.map((row) => ({ ...row, ...emptyProgress })),
    topics: hierarchy.topics.map((row) => ({ ...row, ...emptyProgress })),
    subtopics: hierarchy.subtopics.map((row) => ({ ...row, ...emptyProgress })),
    recent_activity: [],
  };

  return baseSnapshot;
}

// The published hierarchy and exact question counts are identical for every
// learner selecting the same profile. Cache only that shared base; personal
// attempts and the target date are always attached outside this cache.
const getCachedPublishedExamBaseSnapshot = unstable_cache(
  fetchPublishedExamBaseSnapshot,
  ['selected-exam-published-base-v1'],
  { revalidate: 300, tags: ['exam-learning-base', 'catalog'] },
);

const getCachedSelectedProfileRow = unstable_cache(
  async (userId: string): Promise<SelectedProfileRow | null> => {
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error('supabase_not_configured');
    const profile = await admin
      .from('user_profiles')
      .select(
        'target_exam_profile_id, target_exam_id, exam_date, exam_onboarding_required, exam_onboarding_completed_at',
      )
      .eq('user_id', userId)
      .maybeSingle();
    if (profile.error) throw new Error(`${profile.error.code || 'database_error'}:${profile.error.message}`);
    return profile.data as SelectedProfileRow | null;
  },
  ['selected-exam-profile-row-v1'],
  { revalidate: 60, tags: [SELECTED_EXAM_CONTEXT_CACHE_TAG] },
);

async function buildPublishedExamSnapshot(
  input: PublishedExamBaseInput & { userId: string; targetDate: string },
): Promise<ExamLearningSnapshot> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('supabase_not_configured');

  const [cachedBase, attemptRows] = await Promise.all([
    getCachedPublishedExamBaseSnapshot({
      profileId: input.profileId,
      contentExamId: input.contentExamId,
      examCode: input.examCode,
      questionTag: input.questionTag,
      examTitle: input.examTitle,
    }),
    getCachedExamLearningAttempts(input.userId),
  ]);

  const baseSnapshot: ExamLearningSnapshot = {
    ...cachedBase,
    exam: { ...cachedBase.exam, target_date: input.targetDate },
  };

  return applyAttemptHistoryToSnapshot(baseSnapshot, attemptRows);
}

function getCachedExamLearningAttempts(userId: string): Promise<ExamLearningAttempt[]> {
  return unstable_cache(
    async (): Promise<ExamLearningAttempt[]> => {
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error('supabase_not_configured');
    return collectRows((from, to) =>
      admin
        .from('user_question_attempts')
        .select('question_id, subject_id, topic_id, subtopic_id, is_correct, time_spent_seconds')
        .eq('user_id', userId)
        .order('attempted_at', { ascending: false })
        .range(from, to),
    ) as Promise<ExamLearningAttempt[]>;
    },
    ['exam-learning-user-attempts-v2', userId],
    { revalidate: 30, tags: [getExamLearningProgressCacheTag(userId)] },
  )();
}

export async function getSelectedExamContext(): Promise<SelectedExamContextResult> {
  const session = await getAuthUserFromCookies();
  if (!session) return { status: 'unauthenticated' };

  let row: SelectedProfileRow | null;
  try {
    row = await getCachedSelectedProfileRow(session.id);
  } catch (error) {
    console.warn(`[exam-learning/context] ${error instanceof Error ? error.message : String(error)}`);
    return { status: 'error' };
  }
  if (!row) return { status: 'inactive', examId: null };
  if (row.exam_onboarding_required === true && !row.exam_onboarding_completed_at) {
    return { status: 'incomplete' };
  }
  if (
    !row.target_exam_profile_id ||
    !row.target_exam_id ||
    !row.exam_date ||
    !row.exam_onboarding_completed_at
  ) {
    return { status: 'inactive', examId: row.target_exam_id ?? null };
  }

  try {
    const identity = await getActiveExamProfileIdentity({
      examProfileId: row.target_exam_profile_id,
    });
    if (!identity || identity.contentExamId !== row.target_exam_id) {
      return { status: 'inactive', examId: row.target_exam_id };
    }
    return {
      status: 'ready',
      userId: session.id,
      examProfileId: identity.examProfileId,
      contentExamId: row.target_exam_id,
      examCode: identity.examCode,
      questionTag: identity.questionTag,
      examTitle: identity.examTitle,
      targetDate: String(row.exam_date).slice(0, 10),
    };
  } catch (error) {
    console.warn(`[exam-learning/context] ${error instanceof Error ? error.message : String(error)}`);
    return { status: 'error' };
  }
}

export async function getSelectedExamLearning(): Promise<SelectedExamLearningResult> {
  const selected = await getSelectedExamContext();
  if (selected.status !== 'ready') return selected;

  return getSelectedExamLearningForContext(selected);
}

export async function getSelectedExamLearningForContext(
  selected: ReadySelectedExamContext,
): Promise<Extract<SelectedExamLearningResult, { status: 'ready' | 'error' }>> {
  try {
    const snapshot = await buildPublishedExamSnapshot({
      userId: selected.userId,
      profileId: selected.examProfileId,
      contentExamId: selected.contentExamId,
      examCode: selected.examCode,
      questionTag: selected.questionTag,
      examTitle: selected.examTitle,
      targetDate: selected.targetDate,
    });
    return { status: 'ready', userId: selected.userId, snapshot };
  } catch (error) {
    console.error('[exam-learning/published-syllabus]', {
      message: error instanceof Error ? error.message : 'unknown_error',
      examProfileId: selected.examProfileId,
    });
    return { status: 'error' };
  }
}
