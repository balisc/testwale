export type PublicContentStatus = 'active' | 'coming_soon' | 'hidden' | 'archived';

/**
 * Canonical UI/indexing status derived from the existing catalog fields.
 * Inactive catalog rows are archived; unlisted items are hidden; an active row
 * becomes publicly actionable only after it has published questions.
 */
export function derivePublicContentStatus(input: {
  isListed?: boolean;
  isActive?: boolean;
  questionCount?: number | null;
}): PublicContentStatus {
  if (input.isListed === false) return 'hidden';
  if (input.isActive === false) return 'archived';
  const questionCount = Number(input.questionCount ?? 0);
  return Number.isFinite(questionCount) && questionCount > 0 ? 'active' : 'coming_soon';
}

export function contentCanStartPractice(status: PublicContentStatus) {
  return status === 'active';
}
