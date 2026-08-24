import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getActiveExamProfileIdentity } from '@/lib/examProfileIdentityServer';
import {
  defaultSscCglStageForTier,
  EMPTY_SSC_CGL_TIER_AVAILABILITY,
  SSC_CGL_EXAM_CODE,
  type SscCglPreference,
  type SscCglPreferenceStage,
  type SscCglPreferenceTier,
  type SscCglTierAvailability,
} from '@/lib/sscCglPreference';

const PREFERENCE_SELECT = 'preferred_tier_code, preferred_stage_code, updated_at';

type PreferenceRow = {
  preferred_tier_code: SscCglPreferenceTier;
  preferred_stage_code: SscCglPreferenceStage;
  updated_at: string;
};

export type SscCglPreferenceLookup =
  | { status: 'ready'; preference: SscCglPreference }
  | { status: 'missing' }
  | { status: 'error'; code: 'not_configured' | 'exam_unavailable' | 'database_error' };

export type SscCglPreferenceSaveResult =
  | { ok: true; preference: SscCglPreference; created: boolean }
  | { ok: false; code: 'not_configured' | 'exam_unavailable' | 'tier_unavailable' | 'database_error' };

export type SscCglTierAvailabilityLookup =
  | { status: 'ready'; tiers: SscCglTierAvailability[] }
  | { status: 'error'; code: 'not_configured' | 'database_error' };

function normalizeRow(row: PreferenceRow): SscCglPreference {
  return {
    tierCode: row.preferred_tier_code,
    stageCode: row.preferred_stage_code,
    updatedAt: row.updated_at,
  };
}

function normalizeRpcRow(data: unknown): PreferenceRow | null {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') return null;
  const candidate = row as Partial<PreferenceRow>;
  if (
    (candidate.preferred_tier_code !== 'TIER_I' && candidate.preferred_tier_code !== 'TIER_II') ||
    typeof candidate.preferred_stage_code !== 'string' ||
    typeof candidate.updated_at !== 'string'
  ) {
    return null;
  }
  return candidate as PreferenceRow;
}

async function resolveSscCglExamProfileId(): Promise<
  { ok: true; id: string } | { ok: false; code: 'not_configured' | 'exam_unavailable' | 'database_error' }
> {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, code: 'not_configured' };
  try {
    const identity = await getActiveExamProfileIdentity({ examCode: SSC_CGL_EXAM_CODE });
    if (!identity || identity.examSlug !== 'ssc-combined-graduate-level-examination') {
      return { ok: false, code: 'exam_unavailable' };
    }
    return { ok: true, id: identity.examProfileId };
  } catch (error) {
    console.warn(`[ssc-cgl/preference] exam profile lookup failed ${error instanceof Error ? error.message : String(error)}`);
    return { ok: false, code: 'database_error' };
  }
}

export async function getSscCglTierAvailability(): Promise<SscCglTierAvailabilityLookup> {
  const admin = getSupabaseAdmin();
  if (!admin) return { status: 'error', code: 'not_configured' };

  const identity = await getActiveExamProfileIdentity({ examCode: SSC_CGL_EXAM_CODE });
  if (!identity) return { status: 'error', code: 'database_error' };

  const countQuestions = (stageCodes: SscCglPreferenceStage[]) => admin
    .from('questions')
    .select('id, question_exam_profile_mappings!inner(exam_profile_id, stage_codes, is_active)', {
      count: 'exact',
      head: true,
    })
    .eq('is_active', true)
    .eq('is_verified', true)
    .eq('question_exam_profile_mappings.exam_profile_id', identity.examProfileId)
    .eq('question_exam_profile_mappings.is_active', true)
    .overlaps('question_exam_profile_mappings.stage_codes', stageCodes);
  const [tierOne, tierTwo] = await Promise.all([
    countQuestions(['TIER_I']),
    countQuestions(['TIER_II_PAPER_I', 'TIER_II_PAPER_II', 'TIER_II_PAPER_III']),
  ]);

  if (tierOne.error || tierTwo.error) {
    console.error('[ssc-cgl/availability] lookup failed', tierOne.error?.code ?? tierTwo.error?.code);
    return { status: 'error', code: 'database_error' };
  }

  const tierOneCount = tierOne.count ?? 0;
  const tierTwoCount = tierTwo.count ?? 0;
  const byTier = new Map<SscCglPreferenceTier, SscCglTierAvailability>([
    ['TIER_I', {
      tierCode: 'TIER_I',
      defaultStageCode: 'TIER_I',
      verifiedQuestionCount: tierOneCount,
      isAvailable: tierOneCount > 0,
    }],
    ['TIER_II', {
      tierCode: 'TIER_II',
      defaultStageCode: 'TIER_II_PAPER_I',
      verifiedQuestionCount: tierTwoCount,
      isAvailable: tierTwoCount > 0,
    }],
  ]);

  return {
    status: 'ready',
    tiers: EMPTY_SSC_CGL_TIER_AVAILABILITY.map((fallback) => byTier.get(fallback.tierCode) ?? fallback),
  };
}

async function readPreferenceRow(
  userId: string,
  examProfileId: string,
): Promise<{ row: PreferenceRow | null; error: string | null }> {
  const admin = getSupabaseAdmin();
  if (!admin) return { row: null, error: 'not_configured' };

  const result = await admin
    .from('user_exam_preferences')
    .select(PREFERENCE_SELECT)
    .eq('user_id', userId)
    .eq('exam_profile_id', examProfileId)
    .maybeSingle();

  if (result.error) return { row: null, error: result.error.code ?? 'database_error' };
  return { row: result.data as PreferenceRow | null, error: null };
}

export async function getSscCglPreference(userId: string): Promise<SscCglPreferenceLookup> {
  const exam = await resolveSscCglExamProfileId();
  if (!exam.ok) return { status: 'error', code: exam.code };

  const result = await readPreferenceRow(userId, exam.id);
  if (result.error) {
    console.error('[ssc-cgl/preference] preference lookup failed', result.error);
    return { status: 'error', code: 'database_error' };
  }
  if (!result.row) return { status: 'missing' };
  return { status: 'ready', preference: normalizeRow(result.row) };
}

export async function saveSscCglPreference(
  userId: string,
  tierCode: SscCglPreferenceTier,
  mode: 'create_if_missing' | 'replace',
): Promise<SscCglPreferenceSaveResult> {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, code: 'not_configured' };
  const exam = await resolveSscCglExamProfileId();
  if (!exam.ok) return { ok: false, code: exam.code };

  // First-selection mode never overwrites a preference that already exists.
  // Every actual write still goes through the SECURITY DEFINER RPC so the same
  // exact readiness/Tier checks apply to onboarding and profile changes.
  if (mode === 'create_if_missing') {
    const existing = await readPreferenceRow(userId, exam.id);
    if (existing.error) {
      console.error('[ssc-cgl/preference] initial lookup failed', existing.error);
      return { ok: false, code: 'database_error' };
    }
    if (existing.row) {
      return { ok: true, preference: normalizeRow(existing.row), created: false };
    }
  }

  const write = await admin.rpc('update_user_exam_tier_preference', {
    p_user_id: userId,
    p_exam_profile_id: exam.id,
    p_preferred_tier_code: tierCode,
    p_preferred_stage_code: defaultSscCglStageForTier(tierCode),
  });
  const saved = normalizeRpcRow(write.data);
  if (!write.error && saved) {
    return { ok: true, preference: normalizeRow(saved), created: mode === 'create_if_missing' };
  }

  const unavailable = /tier_unavailable/i.test(write.error?.message ?? '');
  console.error('[ssc-cgl/preference] preference RPC failed', write.error?.code ?? 'invalid_rpc_result');
  return { ok: false, code: unavailable ? 'tier_unavailable' : 'database_error' };
}
