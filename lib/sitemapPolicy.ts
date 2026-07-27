/** Legacy subject keys that must never appear in sitemap or llms.txt as primary routes. */
export const LEGACY_REDIRECT_SUBJECT_KEYS = new Set(['polity']);

/** Legacy subject pages kept for UX but excluded from sitemap (thin / coming-soon). */
export const LEGACY_NOINDEX_SUBJECT_KEYS = new Set([
  'current-affairs',
  'general-knowledge',
]);

export function isLegacySitemapExcludedSubjectKey(subjectKey: string): boolean {
  const key = String(subjectKey ?? '').trim().toLowerCase();
  return LEGACY_REDIRECT_SUBJECT_KEYS.has(key) || LEGACY_NOINDEX_SUBJECT_KEYS.has(key);
}
