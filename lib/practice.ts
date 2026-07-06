import type { LocalizedOptions, LocalizedText, OptionKey } from '@/types/polity';

export type ScopedProgressSnapshot = {
  attempted: number;
  correct: number;
  wrong: number;
  accuracy: number;
};

export type SubmitAnswerResponse = {
  is_correct: boolean;
  correct_option: string;
  explanation: LocalizedText;
  attempt_count: number;
  correct_count: number;
  correct_percentage: number | null;
  is_new_attempt: boolean;
  already_attempted?: boolean;
  selected_option: string;
  /** Scoped progress for the practice page filter (subtopic > topic > subject). */
  progress?: PracticeProgress | null;
  subtopic_progress?: ScopedProgressSnapshot | null;
  topic_progress?: ScopedProgressSnapshot | null;
  subject_progress?: ScopedProgressSnapshot | null;
};

export type ReportQuestionResponse = {
  success: boolean;
  is_new_report: boolean;
  already_reported?: boolean;
  report_count: number;
  message?: string;
};

export type UserAttemptSummary = {
  question_id: string;
  selected_option: string;
  is_correct: boolean;
  attempted_at: string;
  correct_option?: string;
  explanation?: LocalizedText;
  attempt_count?: number;
  correct_count?: number;
  correct_percentage?: number | null;
};

export type PracticeProgress = {
  attempted: number;
  correct: number;
  wrong: number;
  accuracy: number;
  bySubject: Array<{
    subject_id: string | null;
    attempted: number;
    correct: number;
    accuracy: number;
  }>;
  byTopic: Array<{
    topic_id: string | null;
    attempted: number;
    correct: number;
    accuracy: number;
  }>;
};

export const REPORT_REASONS = [
  'Wrong answer',
  'Incorrect explanation',
  'Translation issue',
  'Duplicate question',
  'Typing error',
  'Other',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D'];

/** Supports both { en: {A..D} } and { A: {en, hi} } option shapes from Supabase JSONB. */
export function getOptionsForLang(
  options: LocalizedOptions | Record<string, unknown> | undefined,
  lang: 'en' | 'hi',
): Record<OptionKey, string> {
  const result: Record<OptionKey, string> = { A: '', B: '', C: '', D: '' };
  if (!options || typeof options !== 'object') return result;

  const maybeByLang = options as LocalizedOptions;
  if (maybeByLang.en || maybeByLang.hi) {
    const source =
      (lang === 'en' ? maybeByLang.en : maybeByLang.hi) ?? maybeByLang.en ?? maybeByLang.hi ?? {};
    for (const key of OPTION_KEYS) {
      result[key] = (source as Record<OptionKey, string | undefined>)[key] ?? '';
    }
    return result;
  }

  for (const key of OPTION_KEYS) {
    const entry = (options as Record<string, unknown>)[key];
    if (!entry) continue;
    if (typeof entry === 'string') {
      result[key] = entry;
      continue;
    }
    if (typeof entry === 'object' && entry !== null) {
      const localized = entry as { en?: string; hi?: string };
      result[key] = (lang === 'en' ? localized.en : localized.hi) ?? localized.en ?? localized.hi ?? '';
    }
  }

  return result;
}

export function getQuestionLocalizedText(value: LocalizedText | undefined, lang: 'en' | 'hi'): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (lang === 'en') return value.en || value.hi || '';
  return value.hi || value.en || '';
}

export function formatCorrectPercentage(percentage: number | null | undefined, lang: 'en' | 'hi'): string {
  if (percentage == null) {
    return lang === 'hi' ? 'पहला प्रयास करने वाले बनें' : 'Be the first to attempt';
  }
  return lang === 'hi'
    ? `इस प्रश्न को ${percentage}% students ने सही किया`
    : `${percentage}% of students got this question correct`;
}
