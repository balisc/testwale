import { getAllExams, normalizeExamCode } from '@/lib/polity';
import { findRankedExamOption, listRankedExamOptions } from '@/lib/polity/examRankingV2';

export type ResolvedPracticeExam = {
  /** Normalized exam path from URL (e.g. CTET_P2_SST). */
  selectionCode: string;
  /** Value for questions.exam_tags filtering — legacy code or family_code. */
  questionTag?: string;
  source: 'legacy' | 'ranked_family' | 'ranked_unmapped';
};

/**
 * Resolve a URL/context exam code to the tag stored on questions.exam_tags.
 * Ranked v2 paths map through family_code; legacy pills use catalog exam codes directly.
 */
export async function resolvePracticeExam(
  examCode: string | null | undefined,
): Promise<ResolvedPracticeExam | null> {
  if (!examCode) return null;

  const selectionCode = normalizeExamCode(examCode);
  if (!selectionCode || selectionCode === 'ALL') return null;

  const legacyExams = await getAllExams();
  const legacyMatch = legacyExams.find(
    (exam) => normalizeExamCode(exam.code) === selectionCode,
  );
  if (legacyMatch) {
    return {
      selectionCode,
      questionTag: legacyMatch.code,
      source: 'legacy',
    };
  }

  const rankedExams = await listRankedExamOptions();
  const rankedMatch = findRankedExamOption(rankedExams, selectionCode);
  if (!rankedMatch) return null;

  const familyTag = rankedMatch.family_code
    ? normalizeExamCode(rankedMatch.family_code)
    : undefined;

  return {
    selectionCode,
    questionTag: familyTag,
    source: familyTag ? 'ranked_family' : 'ranked_unmapped',
  };
}

/** Whether value is a known legacy code or ranked family tag on questions.exam_tags. */
async function isKnownQuestionExamTag(tag: string): Promise<boolean> {
  const normalized = normalizeExamCode(tag);
  const legacy = (await getAllExams()).some(
    (exam) => normalizeExamCode(exam.code) === normalized,
  );
  if (legacy) return true;

  const rankedExams = await listRankedExamOptions();
  return rankedExams.some(
    (exam) => exam.family_code && normalizeExamCode(exam.family_code) === normalized,
  );
}

/** Whether the exam path is a known legacy pill or ranked Polity exam. */
export async function isKnownExamSelection(
  examCode: string | null | undefined,
): Promise<boolean> {
  if (!examCode) return true;
  const normalized = normalizeExamCode(examCode);
  if (!normalized || normalized === 'ALL') return true;
  if ((await resolvePracticeExam(normalized)) != null) return true;
  return isKnownQuestionExamTag(normalized);
}

/** Tag for question batch / mastery RPC filters. Undefined = no exam filter. */
export async function resolvePracticeExamQuestionTag(
  examCode: string | null | undefined,
): Promise<string | undefined> {
  const resolved = await resolvePracticeExam(examCode);
  if (resolved) return resolved.questionTag;

  if (!examCode) return undefined;
  const normalized = normalizeExamCode(examCode);
  if (await isKnownQuestionExamTag(normalized)) return normalized;
  return undefined;
}
