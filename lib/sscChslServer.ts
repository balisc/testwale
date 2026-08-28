import 'server-only';

import { unstable_cache } from 'next/cache';
import { getActiveExamProfileIdentity } from '@/lib/examProfileIdentityServer';
import {
  getSavedExamPreference,
  saveExamPreparationPreference,
} from '@/lib/examPreferenceServer';
import type { SavedExamPreference } from '@/lib/examPreference';
import { getPublicExamSyllabus } from '@/lib/publicExamExplorer';
import {
  SSC_CHSL_EXAM_CODE,
  SSC_CHSL_EXAM_SLUG,
  SSC_CHSL_STAGES,
  getSscChslStageByCode,
  type SscChslStageAvailability,
  type SscChslStageDefinition,
  type SscChslStageSnapshot,
} from '@/lib/sscChsl';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

async function fetchSscChslStageSnapshot(
  stage: SscChslStageDefinition,
): Promise<SscChslStageSnapshot> {
  const snapshot = await getPublicExamSyllabus(SSC_CHSL_EXAM_SLUG, stage.code);
  if (!snapshot || snapshot.exam.code !== SSC_CHSL_EXAM_CODE) {
    throw new Error(`ssc_chsl_stage_taxonomy_missing:${stage.code}`);
  }
  return { stage, snapshot };
}

const cachedStageLoaders = {
  TIER_I: unstable_cache(
    () => fetchSscChslStageSnapshot(SSC_CHSL_STAGES[0]),
    ['ssc-chsl-taxonomy-v3', 'TIER_I'],
    { revalidate: 300, tags: ['ssc-chsl-taxonomy', 'ssc-chsl-taxonomy-TIER_I'] },
  ),
  TIER_II: unstable_cache(
    () => fetchSscChslStageSnapshot(SSC_CHSL_STAGES[1]),
    ['ssc-chsl-taxonomy-v3', 'TIER_II'],
    { revalidate: 300, tags: ['ssc-chsl-taxonomy', 'ssc-chsl-taxonomy-TIER_II'] },
  ),
};

export async function getSscChslStageSnapshot(stage: SscChslStageDefinition) {
  try {
    return await cachedStageLoaders[stage.code]();
  } catch (cachedError) {
    // One direct retry prevents a stale/transient failed cache lookup from
    // breaking every Subject -> Topic -> Subtopic navigation request.
    try {
      return await fetchSscChslStageSnapshot(stage);
    } catch {
      throw cachedError;
    }
  }
}

export type SscChslPreferenceLookup =
  | { status: 'ready'; preference: SavedExamPreference }
  | { status: 'missing' | 'invalid' }
  | { status: 'error'; code: string };

export async function getSscChslPreference(userId: string): Promise<SscChslPreferenceLookup> {
  let identity: Awaited<ReturnType<typeof getActiveExamProfileIdentity>>;
  try {
    identity = await getActiveExamProfileIdentity({ examCode: SSC_CHSL_EXAM_CODE });
  } catch (error) {
    console.warn(`[ssc-chsl/preference] identity lookup failed: ${error instanceof Error ? error.message : String(error)}`);
    return { status: 'error', code: 'database_error' };
  }
  if (!identity || identity.examSlug !== SSC_CHSL_EXAM_SLUG) {
    return { status: 'error', code: 'exam_unavailable' };
  }
  const result = await getSavedExamPreference(userId, identity.examProfileId);
  if (result.status !== 'ready') return result;
  if (
    result.preference.examCode !== SSC_CHSL_EXAM_CODE
    || !getSscChslStageByCode(result.preference.stageCode)
    || result.preference.preparationMode !== 'MCQ'
  ) {
    return { status: 'invalid' };
  }
  return result;
}

export async function saveSscChslPreference(userId: string, stageCode: string) {
  const stage = getSscChslStageByCode(stageCode);
  if (!stage) return { ok: false as const, code: 'invalid_stage' };
  let identity: Awaited<ReturnType<typeof getActiveExamProfileIdentity>>;
  try {
    identity = await getActiveExamProfileIdentity({ examCode: SSC_CHSL_EXAM_CODE });
  } catch (error) {
    console.warn(`[ssc-chsl/preference] save identity lookup failed: ${error instanceof Error ? error.message : String(error)}`);
    return { ok: false as const, code: 'database_error' };
  }
  if (!identity || identity.examSlug !== SSC_CHSL_EXAM_SLUG) {
    return { ok: false as const, code: 'exam_unavailable' };
  }
  return saveExamPreparationPreference(userId, {
    examProfileId: identity.examProfileId,
    stageCode: stage.code,
    preparationMode: 'MCQ',
    tierCode: null,
    completeOnboarding: false,
  });
}

export type SscChslAvailabilityLookup =
  | { status: 'ready'; stages: SscChslStageAvailability[] }
  | { status: 'error'; code: 'not_configured' | 'exam_unavailable' | 'database_error' };

export async function getSscChslStageAvailability(): Promise<SscChslAvailabilityLookup> {
  const admin = getSupabaseAdmin();
  if (!admin) return { status: 'error', code: 'not_configured' };
  let identity: Awaited<ReturnType<typeof getActiveExamProfileIdentity>>;
  try {
    identity = await getActiveExamProfileIdentity({ examCode: SSC_CHSL_EXAM_CODE });
  } catch (error) {
    console.warn(`[ssc-chsl/availability] identity lookup failed: ${error instanceof Error ? error.message : String(error)}`);
    return { status: 'error', code: 'database_error' };
  }
  if (!identity || identity.examSlug !== SSC_CHSL_EXAM_SLUG) {
    return { status: 'error', code: 'exam_unavailable' };
  }

  const results = await Promise.all(SSC_CHSL_STAGES.map(async (stage) => {
    const [questions, taxonomy] = await Promise.all([
      admin
        .from('questions')
        .select('id, question_exam_profile_mappings!inner(exam_profile_id, stage_codes, is_active)', {
          count: 'exact',
          head: true,
        })
        .eq('is_active', true)
        .eq('is_verified', true)
        .eq('question_exam_profile_mappings.exam_profile_id', identity.examProfileId)
        .eq('question_exam_profile_mappings.is_active', true)
        .overlaps('question_exam_profile_mappings.stage_codes', [stage.code]),
      getSscChslStageSnapshot(stage).catch(() => null),
    ]);
    return { stage, questions, taxonomy };
  }));

  if (results.some(({ questions }) => questions.error)) {
    console.error(
      '[ssc-chsl/availability] lookup failed',
      results.find(({ questions }) => questions.error)?.questions.error?.code,
    );
    return { status: 'error', code: 'database_error' };
  }

  return {
    status: 'ready',
    stages: results.map(({ stage, questions, taxonomy }) => {
      const verifiedQuestionCount = questions.count ?? 0;
      return {
        stageCode: stage.code,
        verifiedQuestionCount,
        isAvailable: verifiedQuestionCount > 0
          && Boolean(taxonomy?.snapshot.subjects.length)
          && Boolean(taxonomy?.snapshot.subtopics.length),
      };
    }),
  };
}
