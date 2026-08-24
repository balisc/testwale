import type { Exam } from '@/types/polity';

/** Preferred exam pill order — Basic, SSC, Railway, State One-Day first. */
const EXAM_DISPLAY_PRIORITY = [
  'BASIC',
  'SSC',
  'RAILWAY',
  'STATE_ONEDAY',
  'STATE_ONE_DAY',
  'UPSC',
  'STATE_PCS',
] as const;

/** Normalize URL exam params to the database exam-code format (for example, ssc-cgl → SSC_CGL). */
export function normalizeExamCode(exam?: string | null): string {
  return String(exam ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
}

function examDisplayRank(code: string, sortOrder: number | null): number {
  const normalized = normalizeExamCode(code);
  const priorityIndex = EXAM_DISPLAY_PRIORITY.indexOf(
    normalized as (typeof EXAM_DISPLAY_PRIORITY)[number],
  );
  if (priorityIndex >= 0) return priorityIndex;
  return EXAM_DISPLAY_PRIORITY.length + (sortOrder ?? 999);
}

/** Sort exams for UI; hides ALL (rendered separately) and puts core exams first. */
export function sortExamsForDisplay(exams: Exam[]): Exam[] {
  return exams
    .filter((exam) => normalizeExamCode(exam.code) !== 'ALL')
    .slice()
    .sort(
      (a, b) =>
        examDisplayRank(a.code, a.sort_order) - examDisplayRank(b.code, b.sort_order),
    );
}
