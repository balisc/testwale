import { getCatalogSnapshot, listSubjectsFromCache } from '@/lib/catalogCache';
import { getLocalizedText } from './localizedText';
import { catalogSlugToSubjectKey } from './subjectRoutes';
import type { LocalizedText } from '@/types/polity';

export type CatalogSiteStats = {
  questions: number;
  subjects: number;
  topics: number;
};

export type CatalogSearchSuggestion = {
  subjectKey: string;
  topicEn: string;
  topicHi: string;
};

/**
 * Site-wide stats from the cached catalog snapshot.
 * Question total uses sum of subject.question_count (no live `questions` count query).
 */
export async function getCatalogSiteStats(): Promise<CatalogSiteStats | null> {
  const { subjects, topics } = await getCatalogSnapshot();
  if (!subjects.length && !topics.length) return null;

  const questions = subjects.reduce(
    (sum, row) => sum + Number(row.question_count ?? 0),
    0,
  );

  return {
    questions,
    subjects: subjects.length,
    topics: topics.length,
  };
}

/** Search suggestions from cached catalog topics. */
export async function getCatalogSearchSuggestions(limit = 40): Promise<CatalogSearchSuggestion[]> {
  const { subjects, topics } = await getCatalogSnapshot();
  if (!topics.length) return [];

  const subjectSlugById = new Map(subjects.map((subject) => [subject.id, subject.slug]));
  const suggestions: CatalogSearchSuggestion[] = [];
  const seen = new Set<string>();

  for (const row of topics) {
    if (suggestions.length >= limit) break;

    const subjectSlug = subjectSlugById.get(row.subject_id);
    if (!subjectSlug) continue;

    const subjectKey = catalogSlugToSubjectKey(String(subjectSlug));
    const title = row.title as LocalizedText;
    const topicEn = getLocalizedText(title, 'en');
    const topicHi = getLocalizedText(title, 'hi');
    if (!topicEn && !topicHi) continue;

    const key = `${subjectKey}:${topicEn.toLowerCase()}:${topicHi.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    suggestions.push({ subjectKey, topicEn, topicHi });
  }

  return suggestions;
}

/** Sum of question_count from active catalog subjects (fallback stats). */
export async function getCatalogQuestionTotalFromSubjects(): Promise<number | null> {
  const subjects = await listSubjectsFromCache();
  if (!subjects.length) return null;
  return subjects.reduce((sum, row) => sum + Number(row.question_count ?? 0), 0);
}
