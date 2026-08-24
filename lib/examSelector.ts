import type { LocalizedText } from '@/types/polity';
import type { ExamSelectorOptionRow } from '@/types/supabase';

export type ExamSelectorOption = Omit<ExamSelectorOptionRow, 'official_title' | 'display_title'> & {
  official_title: LocalizedText;
  display_title: LocalizedText;
  active_subject_count: number;
  active_topic_count: number;
  active_subtopic_count: number;
  verified_question_count: number;
};

export const ALL_EXAM_FAMILIES = 'ALL';

function localizedText(value: unknown): LocalizedText {
  if (typeof value === 'string') return { en: value, hi: value };
  if (!value || typeof value !== 'object') return {};
  const row = value as Record<string, unknown>;
  return {
    en: typeof row.en === 'string' ? row.en : undefined,
    hi: typeof row.hi === 'string' ? row.hi : undefined,
  };
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function nonNegativeNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function normalizeExamSelectorOption(raw: unknown): ExamSelectorOption | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const examProfileId = optionalString(row.exam_profile_id);
  const examCode = optionalString(row.exam_code);
  if (!examProfileId || !examCode) return null;

  return {
    exam_profile_id: examProfileId,
    content_exam_id: optionalString(row.content_exam_id),
    exam_code: examCode,
    exam_slug: optionalString(row.exam_slug) ?? '',
    official_title: localizedText(row.official_title),
    short_name: optionalString(row.short_name),
    display_title: localizedText(row.display_title),
    family_code: optionalString(row.family_code),
    content_family_code: optionalString(row.content_family_code),
    conducting_body: optionalString(row.conducting_body),
    profile_category: optionalString(row.profile_category),
    product_group: optionalString(row.product_group),
    recurrence_status: optionalString(row.recurrence_status),
    scope_status: optionalString(row.scope_status),
    can_select: row.can_select === true,
    is_coming_soon: row.is_coming_soon === true,
    availability_reason: optionalString(row.availability_reason),
    sort_order: typeof row.sort_order === 'number' ? row.sort_order : null,
    active_subject_count: nonNegativeNumber(row.active_subject_count),
    active_topic_count: nonNegativeNumber(row.active_topic_count),
    active_subtopic_count: nonNegativeNumber(row.active_subtopic_count),
    verified_question_count: nonNegativeNumber(row.verified_question_count),
  };
}

export function examOptionDisplayTitle(
  option: ExamSelectorOption,
  language: 'en' | 'hi',
): string {
  const alternate = language === 'en' ? 'hi' : 'en';
  return option.display_title[language]
    ?? option.official_title[language]
    ?? option.short_name
    ?? option.display_title[alternate]
    ?? option.official_title[alternate]
    ?? option.exam_code;
}

export function examOptionFamily(option: ExamSelectorOption): string {
  return option.content_family_code ?? option.family_code ?? 'OTHER';
}

export function listExamFamilies(options: ExamSelectorOption[]): string[] {
  const families: string[] = [];
  const seen = new Set<string>();
  for (const option of options) {
    const family = examOptionFamily(option);
    if (!seen.has(family)) {
      seen.add(family);
      families.push(family);
    }
  }
  return families;
}

export function isExamOptionSelectable(option: ExamSelectorOption): boolean {
  return (
    option.can_select &&
    !option.is_coming_soon &&
    option.content_exam_id !== null &&
    option.active_subject_count > 0 &&
    option.active_topic_count > 0 &&
    option.active_subtopic_count > 0 &&
    option.verified_question_count > 0
  );
}

export function filterExamSelectorOptions(
  options: ExamSelectorOption[],
  query: string,
  family: string,
): ExamSelectorOption[] {
  const needle = query.trim().toLocaleLowerCase('en-IN');
  return options.filter((option) => {
    if (family !== ALL_EXAM_FAMILIES && examOptionFamily(option) !== family) return false;
    if (!needle) return true;
    const searchable = [
      option.exam_code,
      option.short_name,
      option.official_title.en,
      option.official_title.hi,
      option.display_title.en,
      option.display_title.hi,
    ];
    return searchable.some((value) => value?.toLocaleLowerCase('en-IN').includes(needle));
  });
}

export function friendlyAvailabilityMessage(
  reason: string | null,
  language: 'en' | 'hi',
): string {
  if (reason === 'content_family_unmapped') {
    return language === 'hi'
      ? 'इस परीक्षा की अध्ययन सामग्री जोड़ी जा रही है।'
      : 'Study content is being mapped for this exam.';
  }
  return language === 'hi'
    ? 'इस परीक्षा की तैयारी सुविधा सक्रिय की जा रही है।'
    : 'Preparation access for this exam is being activated.';
}
