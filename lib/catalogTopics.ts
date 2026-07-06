import supabase from '@/lib/supabase';
import { getLocalizedText } from '@/lib/localizedText';
import { resolveSubjectSlug } from '@/lib/subjectRoutes';
import type { TopicItem } from './questionTopics';
import { fetchTopicsFromQuestions } from './questionTopics';

export type { TopicItem };

/**
 * Load topic navigation from catalog tables (`subjects` / `topics`).
 * Does not read the `questions` table.
 */
export async function fetchTopicsFromCatalog(subjectKey: string): Promise<TopicItem[]> {
  const subjectSlug = resolveSubjectSlug(subjectKey);

  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .select('id')
    .eq('slug', subjectSlug)
    .eq('is_active', true)
    .maybeSingle();

  if (subjectError || !subject?.id) {
    return [];
  }

  const { data: topics, error: topicsError } = await supabase
    .from('topics')
    .select('title, question_count')
    .eq('subject_id', subject.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (topicsError || !topics?.length) {
    return [];
  }

  return topics.map((row: { title: unknown; question_count: number | null }) => {
    const title = row.title as { en?: string; hi?: string } | string | null;
    const en = getLocalizedText(title, 'en');
    const hi = getLocalizedText(title, 'hi');
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
