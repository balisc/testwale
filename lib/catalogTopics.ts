import { getLocalizedText } from '@/lib/localizedText';
import {
  getSubjectBySlugFromCache,
  listTopicsBySubjectFromCache,
} from '@/lib/catalogCache';
import { resolveSubjectSlug } from '@/lib/subjectRoutes';
import type { TopicItem } from './questionTopics';
import { fetchTopicsFromQuestions } from './questionTopics';

export type { TopicItem };

/**
 * Load topic navigation from the 24h catalog snapshot.
 * Does not read the `questions` table.
 */
export async function fetchTopicsFromCatalog(subjectKey: string): Promise<TopicItem[]> {
  const subjectSlug = resolveSubjectSlug(subjectKey);
  const subject = await getSubjectBySlugFromCache(subjectSlug);
  if (!subject?.id) {
    return [];
  }

  const topics = await listTopicsBySubjectFromCache(subject.id);
  if (!topics.length) {
    return [];
  }

  return topics.map((row) => {
    const en = getLocalizedText(row.title, 'en');
    const hi = getLocalizedText(row.title, 'hi');
    return {
      en,
      hi: hi || en,
      count: typeof row.question_count === 'number' ? row.question_count : 0,
    };
  });
}

/**
 * Preferred topic source for legacy `/[subject]` routes:
 * catalog first, then temporary capped question-table fallback.
 */
export async function fetchTopicsForLegacySubject(
  subjectKey: string,
  subCategory?: string,
): Promise<TopicItem[]> {
  // History sub-categories (ancient/medieval/modern) are not modeled in catalog topics.
  if (!subCategory) {
    const catalogTopics = await fetchTopicsFromCatalog(subjectKey);
    if (catalogTopics.length > 0) {
      return catalogTopics;
    }
  }

  // TEMPORARY: legacy question-table aggregation when catalog has no rows.
  // Capped at MAX_LEGACY_TOPIC_SCAN (500). Migrate subject to catalog tables.
  return fetchTopicsFromQuestions(subjectKey, subCategory);
}
