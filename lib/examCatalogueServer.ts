import 'server-only';

import { unstable_cache } from 'next/cache';
import {
  normalizeExamSelectorOption,
  type ExamSelectorOption,
} from '@/lib/examSelector';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const READY_EXAM_SELECTOR_COLUMNS =
  'exam_profile_id, content_exam_id, exam_code, exam_slug, official_title, short_name, display_title, family_code, content_family_code, conducting_body, profile_category, product_group, recurrence_status, scope_status, can_select, is_coming_soon, availability_reason, sort_order, active_subject_count, active_topic_count, active_subtopic_count, verified_question_count';

export class ExamCatalogueDatabaseError extends Error {
  constructor(
    public readonly databaseCode: string,
    message: string,
    public readonly details: string | null = null,
    public readonly hint: string | null = null,
  ) {
    super(message);
    this.name = 'ExamCatalogueDatabaseError';
  }
}

async function fetchReadyExamSelectorOptions(): Promise<ExamSelectorOption[]> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new ExamCatalogueDatabaseError('not_configured', 'Exam catalogue is not configured');

  const result = await admin
    .from('exam_selector_options')
    .select(READY_EXAM_SELECTOR_COLUMNS)
    .eq('can_select', true)
    .eq('is_coming_soon', false)
    .gt('active_subject_count', 0)
    .gt('active_topic_count', 0)
    .gt('active_subtopic_count', 0)
    .gt('verified_question_count', 0)
    .order('sort_order', { ascending: true })
    .order('exam_code', { ascending: true })
    .limit(100);

  if (result.error) {
    throw new ExamCatalogueDatabaseError(
      result.error.code || 'database_error',
      result.error.message || 'Unknown PostgREST error',
      result.error.details || null,
      result.error.hint || null,
    );
  }

  return (result.data ?? [])
    .map((row: unknown) => normalizeExamSelectorOption(row))
    .filter((row): row is ExamSelectorOption => row !== null);
}

// One successful authoritative readiness read is shared by homepage,
// onboarding, preference validation and question routes. Exceptions are not
// cached, so a timeout never becomes a cached "0 exams" response.
export const getReadyExamSelectorOptions = unstable_cache(
  fetchReadyExamSelectorOptions,
  ['ready-exam-selector-options-v1'],
  { revalidate: 60, tags: ['exam-selector-options'] },
);

export async function getReadyExamSelectorOption(input: {
  examProfileId?: string | null;
  examCode?: string | null;
}): Promise<ExamSelectorOption | null> {
  const profileId = input.examProfileId?.trim() || null;
  const examCode = input.examCode?.trim().toUpperCase() || null;
  const options = await getReadyExamSelectorOptions();
  return options.find((option) => (
    (!profileId || option.exam_profile_id === profileId)
    && (!examCode || option.exam_code === examCode)
  )) ?? null;
}
