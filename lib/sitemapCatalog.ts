import { getCatalogSnapshot } from '@/lib/catalogCache';
import {
  hasPublishedRevisionForSubject,
  listPublishedRevisionDocs,
  publishedRevisionPath,
} from '@/lib/revision/registry';

export type CatalogSitemapPath = {
  path: string;
  priority: number;
  lastModified?: string;
};

/** Builds /subjects/* catalog URLs from the cached snapshot (no per-URL Supabase scan). */
export async function fetchCatalogSitemapPaths(): Promise<CatalogSitemapPath[]> {
  const paths: CatalogSitemapPath[] = [];
  const { subjects, topics } = await getCatalogSnapshot();

  const topicsBySubject = new Map<string, typeof topics>();
  for (const topic of topics) {
    const list = topicsBySubject.get(topic.subject_id) ?? [];
    list.push(topic);
    topicsBySubject.set(topic.subject_id, list);
  }

  for (const subject of subjects) {
    const subjectSlug = String(subject.slug ?? '').trim();
    if (!subjectSlug || !subject.is_active) continue;

    const subjectHasValue =
      Number(subject.question_count ?? 0) > 0 || hasPublishedRevisionForSubject(subjectSlug);
    if (!subjectHasValue) continue;

    paths.push({ path: `/subjects/${subjectSlug}`, priority: 0.85 });

    for (const topic of topicsBySubject.get(subject.id) ?? []) {
      const topicSlug = String(topic.slug ?? '').trim();
      if (!topicSlug || !topic.is_active) continue;

      paths.push({ path: `/subjects/${subjectSlug}/${topicSlug}`, priority: 0.8 });
      // Practice sessions stay noindex — never add them here.
    }
  }

  for (const doc of listPublishedRevisionDocs()) {
    paths.push({
      path: publishedRevisionPath(doc),
      priority: 0.75,
      lastModified: doc.lastReviewed,
    });
  }

  return paths;
}
