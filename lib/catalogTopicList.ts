import supabase from './supabase';
import { getLocalizedText } from './localizedText';
import { resolveSubjectSlug } from './subjectRoutes';

export type CatalogTopicLabel = {
  en: string;
  hi: string;
};

/** Topic titles for a catalog subject (no legacy *_questions tables). */
export async function fetchCatalogTopicLabels(subjectKey: string): Promise<CatalogTopicLabel[]> {
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
    .select('title')
    .eq('subject_id', subject.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (topicsError || !topics?.length) {
    return [];
  }

  return topics.map((row: { title: unknown }) => {
    const title = row.title as { en?: string; hi?: string } | string | null;
    const en = getLocalizedText(title, 'en');
    const hi = getLocalizedText(title, 'hi');
    return { en, hi: hi || en };
  });
}
