import { getSubjectCached, getTopicsCached } from './cachedCatalog';
import { getLocalizedText } from './localizedText';
import { resolveSubjectSlug } from './subjectRoutes';

export type CatalogTopicLabel = {
  en: string;
  hi: string;
};

/** Topic titles for a catalog subject (cached; no legacy *_questions tables). */
export async function fetchCatalogTopicLabels(subjectKey: string): Promise<CatalogTopicLabel[]> {
  const subjectSlug = resolveSubjectSlug(subjectKey);
  const subject = await getSubjectCached(subjectSlug);
  if (!subject?.id) {
    return [];
  }

  const topics = await getTopicsCached(subject.id);
  if (!topics.length) {
    return [];
  }

  return topics.map((row) => {
    const en = getLocalizedText(row.title, 'en');
    const hi = getLocalizedText(row.title, 'hi');
    return { en, hi: hi || en };
  });
}
