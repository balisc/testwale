import type { Exam } from '@/types/polity';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type ExamOnboardingState = {
  required: boolean;
  completedAt: string | null;
  targetExamProfileId: string | null;
  targetExamId: string | null;
  targetExamDate: string | null;
};

export function isValidExamId(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value.trim());
}

export function indiaDateKey(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
}

export function isValidCalendarDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year!, month! - 1, day!));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month! - 1 &&
    parsed.getUTCDate() === day
  );
}

export function validateTargetExamDate(value: unknown, today = indiaDateKey()): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!isValidCalendarDate(trimmed) || trimmed <= today) return null;
  return trimmed;
}

export function minFutureExamDateInput(today = indiaDateKey()): string {
  const [year, month, day] = today.split('-').map(Number);
  return new Date(Date.UTC(year!, month! - 1, day! + 1)).toISOString().slice(0, 10);
}

export function needsExamOnboarding(state: ExamOnboardingState): boolean {
  return state.required && !state.completedAt;
}

export function canContinueFromExamStep(examId: string | null): boolean {
  return isValidExamId(examId);
}

export function canSaveExamOnboarding(
  examId: string | null,
  examDate: string,
  today?: string,
): boolean {
  return isValidExamId(examId) && validateTargetExamDate(examDate, today) !== null;
}

export function activeExamsOnly(exams: Exam[]): Exam[] {
  return exams
    .filter((exam) => exam.is_active)
    .slice()
    .sort(
      (a, b) =>
        (a.sort_order ?? Number.MAX_SAFE_INTEGER) -
        (b.sort_order ?? Number.MAX_SAFE_INTEGER),
    );
}
