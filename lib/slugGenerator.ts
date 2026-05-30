type LocalizedText = string | { en: string; hi: string };

/**
 * Extract first 5-6 words from question text for SEO slug
 */
function extractKeywords(text: string): string {
  const words = text
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .slice(0, 6);

  return words.join('-').toLowerCase();
}

/**
 * Get text value from localized content
 */
function getText(value: LocalizedText, locale: 'en' | 'hi' = 'en'): string {
  if (typeof value === 'string') return value;
  return value[locale] || value.en;
}

/**
 * Generate SEO-friendly slug from question title and ID
 * Example: "what-is-ancient-history-meaning-q123"
 */
export function generateQuestionSlug(questionText: LocalizedText, questionId: string): string {
  const text = getText(questionText, 'en');
  const keywords = extractKeywords(text);
  return `${keywords}-q${questionId}`;
}

export function buildQuestionPath(questionId: string, questionText: LocalizedText): string {
  return `/question/${questionId}/${generateQuestionSlug(questionText, questionId)}`;
}

/**
 * Extract question ID from slug
 */
export function extractQuestionIdFromSlug(slug: string): string {
  const match = slug.match(/q(\d+)$/);
  if (match && match[1]) {
    return match[1];
  }
  const parts = slug.split('-');
  return parts[parts.length - 1];
}
