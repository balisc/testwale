import { getCatalogSnapshot } from '@/lib/catalogCache';
import {
  hasPublishedRevisionForSubject,
  hasPublishedRevisionForTopic,
  listPublishedRevisionDocs,
  publishedRevisionPath,
} from '@/lib/revision/registry';
import {
  getPublicExamSelectorOptionsStrict,
  getPublicExamSyllabusStrict,
} from '@/lib/publicExamExplorer';

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
      const topicHasValue =
        Number(topic.question_count ?? 0) > 0 ||
        hasPublishedRevisionForTopic(subjectSlug, topicSlug);
      if (!topicHasValue) continue;

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

/** Public syllabus landing pages only. Interactive subtopic practice stays noindex. */
export async function fetchPublicExamSitemapPaths(): Promise<CatalogSitemapPath[]> {
  const options = await getPublicExamSelectorOptionsStrict();
  const publicExamSlugs = Array.from(new Set(options.flatMap((option) => {
    if (option.code === 'SSC_CGL') return ['ssc-cgl'];
    const match = option.href?.match(/^\/exams\/([^/?#]+)/);
    return match?.[1] ? [match[1]] : [];
  })));
  const snapshots = await Promise.all(publicExamSlugs.map(async (examSlug) => ({
    examSlug,
    snapshot: await getPublicExamSyllabusStrict(examSlug),
  })));
  const paths: CatalogSitemapPath[] = [];

  for (const { examSlug, snapshot } of snapshots) {
    if (!snapshot) continue;
    const topicPaths: CatalogSitemapPath[] = [];
    const subjectPaths: CatalogSitemapPath[] = [];

    for (const subject of snapshot.subjects) {
      const topics = snapshot.topics.filter((topic) => topic.subject_id === subject.id);
      let includedTopics = 0;

      for (const topic of topics) {
        const hasPublishedSubtopics = snapshot.subtopics.some(
          (subtopic) => subtopic.topic_id === topic.id,
        );
        if (!hasPublishedSubtopics) continue;

        topicPaths.push({
          path: `/exams/${examSlug}/${subject.slug}/${topic.slug}`,
          priority: 0.78,
        });
        includedTopics += 1;
      }

      if (includedTopics > 0) {
        subjectPaths.push({
          path: `/exams/${examSlug}/${subject.slug}`,
          priority: 0.82,
        });
      }
    }

    if (subjectPaths.length > 0) {
      paths.push(
        { path: `/exams/${examSlug}`, priority: 0.9 },
        ...subjectPaths,
        ...topicPaths,
      );
    }
  }

  return paths;
}
