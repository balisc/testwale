import { getCatalogSnapshot } from '@/lib/catalogCache';

export type CatalogSitemapPath = {
  path: string;
  priority: number;
};

/** Builds /subjects/* catalog URLs from the 24h cached snapshot (no live Supabase scan). */
export async function fetchCatalogSitemapPaths(): Promise<CatalogSitemapPath[]> {
  const paths: CatalogSitemapPath[] = [];
  const { subjects, topics, subtopics } = await getCatalogSnapshot();

  const topicsBySubject = new Map<string, typeof topics>();
  for (const topic of topics) {
    const list = topicsBySubject.get(topic.subject_id) ?? [];
    list.push(topic);
    topicsBySubject.set(topic.subject_id, list);
  }

  const subtopicsByTopic = new Map<string, typeof subtopics>();
  for (const subtopic of subtopics) {
    const list = subtopicsByTopic.get(subtopic.topic_id) ?? [];
    list.push(subtopic);
    subtopicsByTopic.set(subtopic.topic_id, list);
  }

  for (const subject of subjects) {
    const subjectSlug = String(subject.slug ?? '').trim();
    if (!subjectSlug) continue;

    paths.push({ path: `/subjects/${subjectSlug}`, priority: 0.85 });

    for (const topic of topicsBySubject.get(subject.id) ?? []) {
      const topicSlug = String(topic.slug ?? '').trim();
      if (!topicSlug) continue;

      const topicPath = `/subjects/${subjectSlug}/${topicSlug}`;
      paths.push({ path: topicPath, priority: 0.8 });
      paths.push({ path: `${topicPath}/practice`, priority: 0.75 });

      for (const subtopic of subtopicsByTopic.get(topic.id) ?? []) {
        const subtopicSlug = String(subtopic.slug ?? '').trim();
        if (!subtopicSlug) continue;
        paths.push({
          path: `${topicPath}/${subtopicSlug}/practice`,
          priority: 0.72,
        });
      }
    }
  }

  return paths;
}
