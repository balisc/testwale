import supabase from '@/lib/supabase';

export type CatalogSitemapPath = {
  path: string;
  priority: number;
};

/** Fetches /subjects/* catalog URLs for the sitemap. */
export async function fetchCatalogSitemapPaths(): Promise<CatalogSitemapPath[]> {
  const paths: CatalogSitemapPath[] = [];

  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('id, slug')
    .eq('is_active', true);

  if (subjectsError || !subjects?.length) return paths;

  for (const subject of subjects) {
    const subjectSlug = String(subject.slug ?? '').trim();
    if (!subjectSlug) continue;

    paths.push({ path: `/subjects/${subjectSlug}`, priority: 0.85 });

    const { data: topics } = await supabase
      .from('topics')
      .select('id, slug')
      .eq('subject_id', subject.id)
      .eq('is_active', true);

    if (!topics?.length) continue;

    for (const topic of topics) {
      const topicSlug = String(topic.slug ?? '').trim();
      if (!topicSlug) continue;

      const topicPath = `/subjects/${subjectSlug}/${topicSlug}`;
      paths.push({ path: topicPath, priority: 0.8 });
      paths.push({ path: `${topicPath}/practice`, priority: 0.75 });

      const { data: subtopics } = await supabase
        .from('subtopics')
        .select('slug')
        .eq('topic_id', topic.id)
        .eq('is_active', true);

      for (const subtopic of subtopics ?? []) {
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
