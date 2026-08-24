import type { LocalizedText } from '@/types/polity';

export type PreparationMode = 'MCQ' | 'WRITTEN';

export type ExamPreparationTrack = {
  examProfileId: string;
  contentExamId: string | null;
  examCode: string;
  examSlug: string;
  examTitle: LocalizedText;
  tierCode: 'TIER_I' | 'TIER_II' | null;
  stageCode: string;
  stageTitle: LocalizedText;
  paperOrSection: LocalizedText;
  preparationMode: PreparationMode;
  isObjective: boolean;
  verifiedQuestionCount: number;
  qualifyingSkillTestCount: number;
  isAvailable: boolean;
  sortOrder: number;
};

export type SavedExamPreference = {
  examProfileId: string;
  examCode: string;
  examSlug: string;
  examTitle: LocalizedText;
  tierCode: 'TIER_I' | 'TIER_II' | null;
  stageCode: string;
  stageTitle: LocalizedText;
  paperOrSection: LocalizedText;
  preparationMode: PreparationMode;
  updatedAt: string;
};

function localized(value: unknown): LocalizedText {
  if (typeof value === 'string' && value.trim()) return { en: value.trim(), hi: value.trim() };
  if (!value || typeof value !== 'object') return {};
  const row = value as Record<string, unknown>;
  return {
    en: typeof row.en === 'string' && row.en.trim() ? row.en.trim() : undefined,
    hi: typeof row.hi === 'string' && row.hi.trim() ? row.hi.trim() : undefined,
  };
}

function finiteNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function normalizeExamPreparationTrack(raw: unknown): ExamPreparationTrack | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  if (
    typeof row.exam_profile_id !== 'string' ||
    typeof row.exam_code !== 'string' ||
    typeof row.exam_slug !== 'string' ||
    typeof row.stage_code !== 'string' ||
    row.preparation_mode !== 'MCQ'
  ) return null;
  const tierCode = row.tier_code === 'TIER_I' || row.tier_code === 'TIER_II'
    ? row.tier_code
    : null;
  return {
    examProfileId: row.exam_profile_id,
    contentExamId: typeof row.content_exam_id === 'string' ? row.content_exam_id : null,
    examCode: row.exam_code,
    examSlug: row.exam_slug,
    examTitle: (() => {
      const display = localized(row.display_title);
      const official = localized(row.official_title);
      const shortName = typeof row.short_name === 'string' ? row.short_name.trim() : '';
      return {
        en: display.en ?? official.en ?? (shortName || row.exam_code),
        hi: display.hi ?? official.hi ?? display.en ?? official.en ?? (shortName || row.exam_code),
      };
    })(),
    tierCode,
    stageCode: row.stage_code,
    stageTitle: localized(row.stage_title),
    paperOrSection: localized(row.paper_or_section),
    preparationMode: 'MCQ',
    isObjective: row.is_objective === true,
    verifiedQuestionCount: finiteNumber(row.verified_question_count),
    qualifyingSkillTestCount: finiteNumber(row.qualifying_skill_test_count),
    isAvailable: row.is_available === true && finiteNumber(row.verified_question_count) > 0,
    sortOrder: finiteNumber(row.sort_order),
  };
}

export function isTrackSelectable(track: ExamPreparationTrack): boolean {
  return track.isAvailable && track.preparationMode === 'MCQ' && track.verifiedQuestionCount > 0;
}

export function getExamPreferenceHref(preference: Pick<
  SavedExamPreference,
  'examCode' | 'examSlug' | 'tierCode' | 'stageCode'
>): string {
  if (preference.examCode === 'SSC_CGL') {
    if (preference.stageCode === 'TIER_I') return '/ssc-cgl/tier-1/subjects';
    if (preference.stageCode === 'TIER_II_PAPER_II') return '/ssc-cgl/tier-2/paper-2/subjects';
    if (preference.stageCode === 'TIER_II_PAPER_III') return '/ssc-cgl/tier-2/paper-3/subjects';
    return '/ssc-cgl/tier-2/paper-1/subjects';
  }
  const stage = encodeURIComponent(preference.stageCode);
  return `/exams/${encodeURIComponent(preference.examSlug)}?stage=${stage}`;
}

export function withExamStageQuery(href: string, stageCode?: string | null): string {
  const normalized = stageCode?.trim();
  if (!normalized) return href;
  return `${href}${href.includes('?') ? '&' : '?'}stage=${encodeURIComponent(normalized)}`;
}

export function preferredTrackMatches(
  track: ExamPreparationTrack,
  preference: Pick<SavedExamPreference, 'examProfileId' | 'tierCode' | 'stageCode' | 'preparationMode'>,
): boolean {
  return track.examProfileId === preference.examProfileId
    && track.tierCode === preference.tierCode
    && track.stageCode === preference.stageCode
    && track.preparationMode === preference.preparationMode
    && isTrackSelectable(track);
}
