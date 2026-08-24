import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  isValidExamId,
  validateTargetExamDate,
  type ExamOnboardingState,
} from '@/lib/examOnboarding';
import {
  isExamOptionSelectable,
  normalizeExamSelectorOption,
  type ExamSelectorOption,
} from '@/lib/examSelector';
import {
  ExamCatalogueDatabaseError,
  getReadyExamSelectorOption,
  getReadyExamSelectorOptions,
  READY_EXAM_SELECTOR_COLUMNS,
} from '@/lib/examCatalogueServer';
import {
  isSscCglPreferenceTier,
  SSC_CGL_EXAM_CODE,
  type SscCglPreferenceTier,
} from '@/lib/sscCglPreference';
import type { LocalizedText } from '@/types/polity';
import type { UserProfileOnboardingRow } from '@/types/supabase';

export type TargetExamDetails = {
  id: string;
  title: LocalizedText;
  code: string;
} | null;

export type ExamOnboardingDetails = ExamOnboardingState & {
  targetExam: TargetExamDetails;
  targetExamProfile: ExamSelectorOption | null;
};

const COMPLETED_LEGACY_STATE: ExamOnboardingDetails = {
  required: false,
  completedAt: null,
  targetExamProfileId: null,
  targetExamId: null,
  targetExamDate: null,
  targetExam: null,
  targetExamProfile: null,
};

function isMissingOnboardingSchema(message: string | undefined): boolean {
  return /target_exam_profile_id|target_exam_id|exam_onboarding_required|exam_onboarding_completed_at|schema cache/i.test(
    message ?? '',
  );
}

export async function listExamSelectorOptions(): Promise<ExamSelectorOption[]> {
  return getReadyExamSelectorOptions();
}

export { ExamCatalogueDatabaseError } from '@/lib/examCatalogueServer';

async function getSelectorOption(examProfileId: string): Promise<{
  option: ExamSelectorOption | null;
  error: string | null;
}> {
  const admin = getSupabaseAdmin();
  if (!admin) return { option: null, error: 'not_configured' };

  try {
    const ready = await getReadyExamSelectorOption({ examProfileId });
    if (ready) return { option: ready, error: null };
  } catch (error) {
    return { option: null, error: error instanceof Error ? error.message : 'database_error' };
  }

  const expanded = await admin
    .from('exam_selector_options')
    .select(READY_EXAM_SELECTOR_COLUMNS)
    .eq('exam_profile_id', examProfileId)
    .maybeSingle();
  if (!expanded.error) {
    return {
      option: normalizeExamSelectorOption(expanded.data),
      error: null,
    };
  }
  return { option: null, error: expanded.error.message };
}

async function getReadySelectorOption(examProfileId: string): Promise<{
  option: ExamSelectorOption | null;
  error: string | null;
}> {
  try {
    return {
      option: await getReadyExamSelectorOption({ examProfileId }),
      error: null,
    };
  } catch (error) {
    return { option: null, error: error instanceof Error ? error.message : 'database_error' };
  }
}

/** Reads durable onboarding state using both exact profile and content-family IDs. */
export async function getExamOnboardingDetails(userId: string): Promise<ExamOnboardingDetails> {
  const admin = getSupabaseAdmin();
  if (!admin) return COMPLETED_LEGACY_STATE;

  const { data, error } = await admin
    .from('user_profiles')
    .select(
      'target_exam_profile_id, target_exam_id, exam_date, exam_onboarding_required, exam_onboarding_completed_at',
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (!isMissingOnboardingSchema(error.message)) {
      console.warn(`[exam-onboarding/status] code=${error.code || 'database_error'} message=${error.message}`);
    }
    return COMPLETED_LEGACY_STATE;
  }
  if (!data) return COMPLETED_LEGACY_STATE;

  const row = data as UserProfileOnboardingRow;
  const [contentExamResult, profileResult] = await Promise.all([
    row.target_exam_id
      ? admin.from('exams').select('id, code, title').eq('id', row.target_exam_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    row.target_exam_profile_id
      ? getSelectorOption(row.target_exam_profile_id)
      : Promise.resolve({ option: null, error: null, hasCanonicalReadiness: false }),
  ]);

  const targetExam =
    !contentExamResult.error && contentExamResult.data
      ? (contentExamResult.data as NonNullable<TargetExamDetails>)
      : null;

  return {
    required: row.exam_onboarding_required === true,
    completedAt: row.exam_onboarding_completed_at,
    targetExamProfileId: row.target_exam_profile_id,
    targetExamId: row.target_exam_id,
    targetExamDate: row.exam_date ? String(row.exam_date).slice(0, 10) : null,
    targetExam,
    targetExamProfile: profileResult.option,
  };
}

export type CompleteExamOnboardingResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | 'invalid_exam'
        | 'invalid_date'
        | 'invalid_tier'
        | 'tier_unavailable'
        | 'unknown_exam'
        | 'disabled_exam'
        | 'content_unmapped'
        | 'unavailable';
    diagnostic?: string;
  };

export async function completeExamOnboarding(
  userId: string,
  input: { examProfileId: unknown; examDate: unknown; tierCode: unknown },
): Promise<CompleteExamOnboardingResult> {
  if (!isValidExamId(input.examProfileId)) return { ok: false, code: 'invalid_exam' };
  const examDate = validateTargetExamDate(input.examDate);
  if (!examDate) return { ok: false, code: 'invalid_date' };

  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, code: 'unavailable' };

  // Never trust a browser-supplied content-family ID: resolve the canonical row again.
  const selectorResult = await getReadySelectorOption(input.examProfileId.trim());
  if (selectorResult.error) {
    console.error('[exam-onboarding/selector]', { message: selectorResult.error });
    return { ok: false, code: 'unavailable' };
  }
  const option = selectorResult.option;
  if (!option) return { ok: false, code: 'unknown_exam' };
  if (!option.can_select) {
    return {
      ok: false,
      code: 'disabled_exam',
      diagnostic: option.availability_reason ?? 'not_selectable',
    };
  }
  if (!option.content_exam_id || !isExamOptionSelectable(option)) {
    return { ok: false, code: 'content_unmapped', diagnostic: option.availability_reason ?? undefined };
  }

  const tierCode: SscCglPreferenceTier | null =
    option.exam_code === SSC_CGL_EXAM_CODE && isSscCglPreferenceTier(input.tierCode)
      ? input.tierCode
      : null;
  if (option.exam_code === SSC_CGL_EXAM_CODE && !tierCode) {
    return { ok: false, code: 'invalid_tier' };
  }
  if (tierCode) {
    const tier = await admin
      .from('ssc_cgl_tier_availability')
      .select('is_available')
      .eq('exam_profile_id', option.exam_profile_id)
      .eq('tier_code', tierCode)
      .eq('is_available', true)
      .maybeSingle();
    if (tier.error) {
      console.error('[exam-onboarding/tier-availability]', { message: tier.error.message });
      return { ok: false, code: 'unavailable' };
    }
    if (!tier.data) return { ok: false, code: 'tier_unavailable' };
  }

  // The database function validates readiness again and commits the target
  // exam plus the optional CGL Tier preference in one transaction.
  const { error } = await admin.rpc('complete_exam_onboarding_with_tier', {
    p_user_id: userId,
    p_exam_profile_id: option.exam_profile_id,
    p_exam_date: examDate,
    p_preferred_tier_code: tierCode,
  });

  if (error) {
    console.error('[exam-onboarding/save]', { message: error.message });
    return { ok: false, code: 'unavailable' };
  }

  return { ok: true };
}
