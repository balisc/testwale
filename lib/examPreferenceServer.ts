import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  normalizeExamPreparationTrack,
  preferredTrackMatches,
  type ExamPreparationTrack,
  type PreparationMode,
  type SavedExamPreference,
} from '@/lib/examPreference';
import { getActiveExamProfileIdentity } from '@/lib/examProfileIdentityServer';
import {
  getSscCglScopeSummaries,
} from '@/lib/sscCglSyllabusServer';
import { SSC_CGL_STAGES } from '@/lib/sscCglSyllabus';
import { SSC_CHSL_EXAM_CODE, SSC_CHSL_STAGES } from '@/lib/sscChsl';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TRACK_SELECT = [
  'exam_profile_id',
  'content_exam_id',
  'exam_code',
  'exam_slug',
  'short_name',
  'display_title',
  'official_title',
  'tier_code',
  'stage_code',
  'stage_title',
  'paper_or_section',
  'preparation_mode',
  'is_objective',
  'sort_order',
  'verified_question_count',
  'qualifying_skill_test_count',
  'is_available',
].join(', ');

type DatabaseError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

function logDatabaseError(scope: string, error: DatabaseError) {
  const code = error.code || 'database_error';
  const message = error.message || 'Unknown PostgREST error';
  const details = error.details ? ` details=${error.details}` : '';
  const hint = error.hint ? ` hint=${error.hint}` : '';
  // Warn keeps the full server diagnostic without opening Next's red dev
  // overlay for an error already converted into a structured API response.
  console.warn(`${scope} code=${code} message=${message}${details}${hint}`);
}

export type TrackLookup =
  | { status: 'ready'; tracks: ExamPreparationTrack[] }
  | { status: 'invalid_exam_profile'; tracks: [] }
  | { status: 'error'; code: string; tracks: [] };

async function getLegacySscCglTracks(examProfileId: string): Promise<TrackLookup> {
  const admin = getSupabaseAdmin();
  if (!admin) return { status: 'error', code: 'not_configured', tracks: [] };

  try {
    const identity = await getActiveExamProfileIdentity({ examProfileId, examCode: 'SSC_CGL' });
    if (!identity) return { status: 'invalid_exam_profile', tracks: [] };
    const [summaries, ...stageCounts] = await Promise.all([
      getSscCglScopeSummaries(),
      ...SSC_CGL_STAGES.map((stage) => admin
        .from('questions')
        .select('id, question_exam_profile_mappings!inner(exam_profile_id, stage_codes, is_active)', {
          count: 'exact',
          head: true,
        })
        .eq('is_active', true)
        .eq('is_verified', true)
        .eq('question_exam_profile_mappings.exam_profile_id', examProfileId)
        .eq('question_exam_profile_mappings.is_active', true)
        .overlaps('question_exam_profile_mappings.stage_codes', [stage.code])),
    ]);
    const summaryByStage = new Map(summaries.map((row) => [row.stage_code, row]));
    const tracks = SSC_CGL_STAGES.flatMap((stage, index): ExamPreparationTrack[] => {
      const countResult = stageCounts[index];
      if (!countResult || countResult.error) {
        if (countResult?.error) {
          logDatabaseError(`[exam-preference/cgl-fallback-count:${stage.code}]`, countResult.error);
        }
        return [];
      }
      const tierCode = stage.tier === 'tier-1' ? 'TIER_I' : 'TIER_II';
      const summary = summaryByStage.get(stage.code);
      const verifiedQuestionCount = countResult.count ?? 0;
      if (
        verifiedQuestionCount <= 0
        || !summary
        || summary.subjects <= 0
        || summary.topics <= 0
        || summary.subtopics <= 0
      ) return [];

      const track = normalizeExamPreparationTrack({
        exam_profile_id: identity.examProfileId,
        content_exam_id: identity.contentExamId,
        exam_code: identity.examCode,
        exam_slug: identity.examSlug,
        short_name: identity.shortName,
        display_title: identity.examTitle,
        official_title: identity.officialTitle,
        tier_code: tierCode,
        stage_code: stage.code,
        stage_title: stage.label,
        paper_or_section: stage.shortLabel,
        preparation_mode: 'MCQ',
        is_objective: stage.code !== 'TIER_II_PAPER_I',
        sort_order: index + 1,
        verified_question_count: verifiedQuestionCount,
        qualifying_skill_test_count: summary.skill_tests,
        is_available: true,
      });
      return track ? [track] : [];
    });
    return { status: 'ready', tracks };
  } catch (error) {
    console.warn(`[exam-preference/cgl-fallback] ${error instanceof Error ? error.message : String(error)}`);
    return { status: 'error', code: 'database_error', tracks: [] };
  }
}

async function getLegacySscChslTracks(examProfileId: string): Promise<TrackLookup> {
  const admin = getSupabaseAdmin();
  if (!admin) return { status: 'error', code: 'not_configured', tracks: [] };

  try {
    const identity = await getActiveExamProfileIdentity({
      examProfileId,
      examCode: SSC_CHSL_EXAM_CODE,
    });
    if (!identity) return { status: 'invalid_exam_profile', tracks: [] };

    const [stages, ...stageCounts] = await Promise.all([
      admin
        .from('exam_profile_stages')
        .select('stage_code, stage_title, paper_or_section, is_objective, is_scope_stage, sort_order')
        .eq('exam_profile_id', examProfileId)
        .eq('is_scope_stage', true)
        .in('stage_code', SSC_CHSL_STAGES.map((stage) => stage.code))
        .order('sort_order', { ascending: true }),
      ...SSC_CHSL_STAGES.map((stage) => admin
        .from('questions')
        .select('id, question_exam_profile_mappings!inner(exam_profile_id, stage_codes, is_active)', {
          count: 'exact',
          head: true,
        })
        .eq('is_active', true)
        .eq('is_verified', true)
        .eq('question_exam_profile_mappings.exam_profile_id', examProfileId)
        .eq('question_exam_profile_mappings.is_active', true)
        .overlaps('question_exam_profile_mappings.stage_codes', [stage.code])),
    ]);

    if (stages.error) {
      logDatabaseError('[exam-preference/chsl-fallback-stages]', stages.error);
      return { status: 'error', code: stages.error.code || 'database_error', tracks: [] };
    }
    const stageByCode = new Map((stages.data ?? []).map((stage) => [stage.stage_code, stage]));
    const tracks = SSC_CHSL_STAGES.flatMap((stage, index): ExamPreparationTrack[] => {
      const stageRow = stageByCode.get(stage.code);
      const countResult = stageCounts[index];
      if (!countResult || countResult.error) {
        if (countResult?.error) {
          logDatabaseError(`[exam-preference/chsl-fallback-count:${stage.code}]`, countResult.error);
        }
        return [];
      }
      const verifiedQuestionCount = countResult.count ?? 0;
      if (!stageRow || verifiedQuestionCount <= 0) return [];

      const track = normalizeExamPreparationTrack({
        exam_profile_id: identity.examProfileId,
        content_exam_id: identity.contentExamId,
        exam_code: identity.examCode,
        exam_slug: identity.examSlug,
        short_name: identity.shortName,
        display_title: identity.examTitle,
        official_title: identity.officialTitle,
        tier_code: null,
        stage_code: stage.code,
        stage_title: stageRow.stage_title ?? stage.label,
        paper_or_section: stageRow.paper_or_section,
        preparation_mode: 'MCQ',
        is_objective: stageRow.is_objective === true,
        sort_order: stageRow.sort_order ?? index + 1,
        verified_question_count: verifiedQuestionCount,
        qualifying_skill_test_count: 0,
        is_available: true,
      });
      return track ? [track] : [];
    });
    return { status: 'ready', tracks };
  } catch (error) {
    console.warn(`[exam-preference/chsl-fallback] ${error instanceof Error ? error.message : String(error)}`);
    return { status: 'error', code: 'database_error', tracks: [] };
  }
}

export async function getExamPreparationTracks(examProfileId: string): Promise<TrackLookup> {
  if (!UUID_PATTERN.test(examProfileId)) {
    return { status: 'invalid_exam_profile', tracks: [] };
  }
  const admin = getSupabaseAdmin();
  if (!admin) return { status: 'error', code: 'not_configured', tracks: [] };

  let identity: Awaited<ReturnType<typeof getActiveExamProfileIdentity>>;
  try {
    identity = await getActiveExamProfileIdentity({ examProfileId });
  } catch (error) {
    console.warn(`[exam-preference/identity] ${error instanceof Error ? error.message : String(error)}`);
    return { status: 'error', code: 'database_error', tracks: [] };
  }
  if (!identity) return { status: 'invalid_exam_profile', tracks: [] };
  if (identity.examCode === 'SSC_CGL') return getLegacySscCglTracks(examProfileId);

  const result = await admin
    .from('exam_preparation_track_options')
    .select(TRACK_SELECT)
    .eq('exam_profile_id', examProfileId)
    .eq('is_available', true)
    .gt('verified_question_count', 0)
    .order('sort_order', { ascending: true });
  if (result.error) {
    if (result.error.code === 'PGRST205') {
      return identity.examCode === SSC_CHSL_EXAM_CODE
        ? getLegacySscChslTracks(examProfileId)
        : getLegacySscCglTracks(examProfileId);
    }
    logDatabaseError('[exam-preference/tracks]', result.error);
    return { status: 'error', code: result.error.code || 'database_error', tracks: [] };
  }

  const tracks = (result.data ?? [])
    .map((row: unknown) => normalizeExamPreparationTrack(row))
    .filter((row): row is ExamPreparationTrack => row !== null && row.isAvailable);
  if (tracks.length === 0) {
    return { status: 'ready', tracks: [] };
  }
  return { status: 'ready', tracks };
}

export type PreferenceLookup =
  | { status: 'ready'; preference: SavedExamPreference }
  | { status: 'missing' }
  | { status: 'invalid' }
  | { status: 'error'; code: string };

function preferenceFromTrack(
  track: ExamPreparationTrack,
  updatedAt: string,
): SavedExamPreference {
  return {
    examProfileId: track.examProfileId,
    examCode: track.examCode,
    examSlug: track.examSlug,
    examTitle: track.examTitle,
    tierCode: track.tierCode,
    stageCode: track.stageCode,
    stageTitle: track.stageTitle,
    paperOrSection: track.paperOrSection,
    preparationMode: track.preparationMode,
    updatedAt,
  };
}

function isMissingPreparationModeColumn(error: DatabaseError): boolean {
  return error.code === '42703' && /preparation_mode/i.test(error.message ?? '');
}

function isMissingGenericPreferenceRpc(error: DatabaseError, rpcName: string): boolean {
  return error.code === 'PGRST202' && (error.message ?? '').includes(rpcName);
}

async function getLegacySscCglPreference(
  userId: string,
  targetExamProfileId: string,
): Promise<PreferenceLookup> {
  const admin = getSupabaseAdmin();
  if (!admin) return { status: 'error', code: 'not_configured' };

  const legacy = await admin
    .from('user_exam_preferences')
    .select('exam_profile_id, preferred_tier_code, preferred_stage_code, updated_at')
    .eq('user_id', userId)
    .eq('exam_profile_id', targetExamProfileId)
    .maybeSingle();
  if (legacy.error) {
    logDatabaseError('[exam-preference/read-legacy]', legacy.error);
    return { status: 'error', code: legacy.error.code || 'database_error' };
  }
  if (!legacy.data) return { status: 'missing' };

  const tierCode = legacy.data.preferred_tier_code === 'TIER_I'
    || legacy.data.preferred_tier_code === 'TIER_II'
    ? legacy.data.preferred_tier_code
    : null;
  const stageCode = typeof legacy.data.preferred_stage_code === 'string'
    ? legacy.data.preferred_stage_code
    : '';
  if (!tierCode || !stageCode) return { status: 'invalid' };

  const tracks = await getExamPreparationTracks(targetExamProfileId);
  if (tracks.status !== 'ready') {
    return { status: 'error', code: tracks.status === 'error' ? tracks.code : 'invalid_exam_profile' };
  }
  const isChsl = tracks.tracks.some((candidate) => candidate.examCode === SSC_CHSL_EXAM_CODE);
  const normalizedStageCode = isChsl
    ? tierCode === 'TIER_I' ? 'TIER_I' : 'TIER_II'
    : stageCode;
  if (
    isChsl
    && !(
      (tierCode === 'TIER_I' && stageCode === 'TIER_I')
      || (tierCode === 'TIER_II' && stageCode === 'TIER_II_PAPER_I')
    )
  ) return { status: 'invalid' };
  const track = tracks.tracks.find((candidate) => (
    candidate.examCode === (isChsl ? SSC_CHSL_EXAM_CODE : 'SSC_CGL')
    && candidate.tierCode === (isChsl ? null : tierCode)
    && candidate.stageCode === normalizedStageCode
    && candidate.preparationMode === 'MCQ'
    && candidate.isAvailable
  ));
  if (!track) return { status: 'invalid' };

  return {
    status: 'ready',
    preference: preferenceFromTrack(
      track,
      typeof legacy.data.updated_at === 'string' ? legacy.data.updated_at : '',
    ),
  };
}

export async function getSavedExamPreference(
  userId: string,
  targetExamProfileId: string | null,
): Promise<PreferenceLookup> {
  if (!targetExamProfileId) return { status: 'missing' };
  const admin = getSupabaseAdmin();
  if (!admin) return { status: 'error', code: 'not_configured' };

  const preferenceResult = await admin
    .from('user_exam_preferences')
    .select('exam_profile_id, preferred_tier_code, preferred_stage_code, preparation_mode, updated_at')
    .eq('user_id', userId)
    .eq('exam_profile_id', targetExamProfileId)
    .maybeSingle();
  if (preferenceResult.error) {
    if (isMissingPreparationModeColumn(preferenceResult.error)) {
      return getLegacySscCglPreference(userId, targetExamProfileId);
    }
    logDatabaseError('[exam-preference/read]', preferenceResult.error);
    return { status: 'error', code: preferenceResult.error.code || 'database_error' };
  }
  if (!preferenceResult.data) return { status: 'missing' };

  const row = preferenceResult.data;
  const preparationMode: PreparationMode | null = row.preparation_mode === 'MCQ'
    ? 'MCQ'
    : row.preparation_mode === 'WRITTEN'
      ? 'WRITTEN'
      : null;
  const tierCode = row.preferred_tier_code === 'TIER_I' || row.preferred_tier_code === 'TIER_II'
    ? row.preferred_tier_code
    : null;
  if (!preparationMode || typeof row.preferred_stage_code !== 'string') return { status: 'invalid' };

  const trackResult = await admin
    .from('exam_preparation_track_options')
    .select(TRACK_SELECT)
    .eq('exam_profile_id', targetExamProfileId)
    .eq('stage_code', row.preferred_stage_code)
    .eq('preparation_mode', preparationMode)
    .eq('is_available', true)
    .gt('verified_question_count', 0)
    .maybeSingle();
  if (trackResult.error) {
    logDatabaseError('[exam-preference/validate-saved]', trackResult.error);
    return { status: 'error', code: trackResult.error.code || 'database_error' };
  }
  const track = normalizeExamPreparationTrack(trackResult.data);
  if (!track) return { status: 'invalid' };

  const preference: SavedExamPreference = {
    examProfileId: targetExamProfileId,
    examCode: track.examCode,
    examSlug: track.examSlug,
    examTitle: track.examTitle,
    tierCode,
    stageCode: row.preferred_stage_code,
    stageTitle: track.stageTitle,
    paperOrSection: track.paperOrSection,
    preparationMode,
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : '',
  };
  if (!preferredTrackMatches(track, preference)) return { status: 'invalid' };
  return { status: 'ready', preference };
}

export type SavePreferenceInput = {
  examProfileId: string;
  stageCode: string;
  preparationMode: PreparationMode;
  tierCode: 'TIER_I' | 'TIER_II' | null;
  examDate?: string | null;
  completeOnboarding: boolean;
};

export type SavePreferenceResult =
  | { ok: true; preference: SavedExamPreference }
  | { ok: false; code: string };

function preferenceWriteErrorCode(error: DatabaseError): string {
  const message = error.message ?? '';
  if (/unavailable/i.test(message)) return 'preparation_track_unavailable';
  if (/invalid_exam_date/i.test(message)) return 'invalid_date';
  return error.code || 'database_error';
}

async function saveLegacySscCglPreference(
  userId: string,
  input: SavePreferenceInput,
  submitted: ExamPreparationTrack,
): Promise<SavePreferenceResult> {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, code: 'not_configured' };
  if (
    submitted.examCode !== 'SSC_CGL'
    || input.preparationMode !== 'MCQ'
    || !input.tierCode
  ) {
    return { ok: false, code: 'generic_preference_schema_missing' };
  }

  if (input.completeOnboarding) {
    if (!input.examDate) return { ok: false, code: 'invalid_date' };
    const onboarding = await admin.rpc('complete_exam_onboarding_with_tier', {
      p_user_id: userId,
      p_exam_profile_id: input.examProfileId,
      p_exam_date: input.examDate,
      p_preferred_tier_code: input.tierCode,
    });
    if (onboarding.error) {
      logDatabaseError('[exam-preference/save-cgl-onboarding]', onboarding.error);
      return { ok: false, code: preferenceWriteErrorCode(onboarding.error) };
    }
  }

  // The legacy onboarding RPC stores Paper I as Tier II's default. Run the
  // validated legacy preference RPC as well so Paper II/III selections are
  // preserved, and so profile-only changes use the same code path.
  const preference = await admin.rpc('update_user_exam_tier_preference', {
    p_user_id: userId,
    p_exam_profile_id: input.examProfileId,
    p_preferred_tier_code: input.tierCode,
    p_preferred_stage_code: input.stageCode,
  });
  if (preference.error) {
    logDatabaseError('[exam-preference/save-cgl-tier]', preference.error);
    return { ok: false, code: preferenceWriteErrorCode(preference.error) };
  }

  const raw = Array.isArray(preference.data) ? preference.data[0] : preference.data;
  const updatedAt = raw && typeof raw === 'object' && typeof raw.updated_at === 'string'
    ? raw.updated_at
    : new Date().toISOString();
  return { ok: true, preference: preferenceFromTrack(submitted, updatedAt) };
}

async function saveLegacySscChslPreference(
  userId: string,
  input: SavePreferenceInput,
  submitted: ExamPreparationTrack,
): Promise<SavePreferenceResult> {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, code: 'not_configured' };
  if (
    submitted.examCode !== SSC_CHSL_EXAM_CODE
    || input.preparationMode !== 'MCQ'
    || input.tierCode !== null
    || (input.stageCode !== 'TIER_I' && input.stageCode !== 'TIER_II')
  ) {
    return { ok: false, code: 'generic_preference_schema_missing' };
  }

  if (input.completeOnboarding) {
    if (!input.examDate) return { ok: false, code: 'invalid_date' };
    const onboarding = await admin.rpc('complete_exam_onboarding_with_tier', {
      p_user_id: userId,
      p_exam_profile_id: input.examProfileId,
      p_exam_date: input.examDate,
      p_preferred_tier_code: null,
    });
    if (onboarding.error) {
      logDatabaseError('[exam-preference/save-chsl-onboarding-fallback]', onboarding.error);
      return { ok: false, code: preferenceWriteErrorCode(onboarding.error) };
    }
  }

  // Before the generic preference migration, the legacy CGL-only table has a
  // non-null Tier constraint. TIER_II_PAPER_I is used only as a compatible
  // storage marker for CHSL Tier II; reads translate it back to TIER_II.
  const updatedAt = new Date().toISOString();
  const preference = await admin
    .from('user_exam_preferences')
    .upsert({
      user_id: userId,
      exam_profile_id: input.examProfileId,
      preferred_tier_code: input.stageCode,
      preferred_stage_code: input.stageCode === 'TIER_I' ? 'TIER_I' : 'TIER_II_PAPER_I',
      updated_at: updatedAt,
    }, { onConflict: 'user_id,exam_profile_id' });
  if (preference.error) {
    logDatabaseError('[exam-preference/save-chsl-fallback]', preference.error);
    return { ok: false, code: preferenceWriteErrorCode(preference.error) };
  }
  return { ok: true, preference: preferenceFromTrack(submitted, updatedAt) };
}

export async function saveExamPreparationPreference(
  userId: string,
  input: SavePreferenceInput,
): Promise<SavePreferenceResult> {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, code: 'not_configured' };
  if (!UUID_PATTERN.test(input.examProfileId) || !input.stageCode.trim()) {
    return { ok: false, code: 'invalid_preference' };
  }

  const tracks = await getExamPreparationTracks(input.examProfileId);
  if (tracks.status !== 'ready') {
    return { ok: false, code: tracks.status === 'error' ? tracks.code : 'invalid_exam_profile' };
  }
  const submitted = tracks.tracks.find((track) => (
    track.stageCode === input.stageCode
      && track.preparationMode === input.preparationMode
      && track.tierCode === input.tierCode
      && track.isAvailable
  ));
  if (!submitted) return { ok: false, code: 'preparation_track_unavailable' };

  const rpcName = input.completeOnboarding
    ? 'complete_exam_onboarding_with_preference'
    : 'update_user_exam_preparation_preference';
  const rpcArguments = input.completeOnboarding
    ? {
        p_user_id: userId,
        p_exam_profile_id: input.examProfileId,
        p_exam_date: input.examDate,
        p_preferred_stage_code: input.stageCode,
        p_preparation_mode: input.preparationMode,
        p_preferred_tier_code: input.tierCode,
      }
    : {
        p_user_id: userId,
        p_exam_profile_id: input.examProfileId,
        p_preferred_stage_code: input.stageCode,
        p_preparation_mode: input.preparationMode,
        p_preferred_tier_code: input.tierCode,
      };
  const write = await admin.rpc(rpcName, rpcArguments);
  if (write.error) {
    if (isMissingGenericPreferenceRpc(write.error, rpcName)) {
      if (submitted.examCode === SSC_CHSL_EXAM_CODE) {
        return saveLegacySscChslPreference(userId, input, submitted);
      }
      return saveLegacySscCglPreference(userId, input, submitted);
    }
    logDatabaseError('[exam-preference/save]', write.error);
    return { ok: false, code: preferenceWriteErrorCode(write.error) };
  }

  const saved = await getSavedExamPreference(userId, input.examProfileId);
  if (saved.status !== 'ready') {
    return { ok: false, code: saved.status === 'error' ? saved.code : 'invalid_saved_preference' };
  }
  return { ok: true, preference: saved.preference };
}
