import { getCatalogSnapshot } from '@/lib/catalogCache';

const SUBTOPIC_SLUG = 'sources-of-indian-constitution';

export type ResolvedSubtopicPracticePath = {
  href: string;
  subjectSlug: string;
  topicSlug: string;
  subtopicSlug: string;
  subjectTitle: { en?: string; hi?: string };
  topicTitle: { en?: string; hi?: string };
  subtopicTitle: { en?: string; hi?: string };
};

/**
 * Resolve the real practice URL for a subtopic slug from the catalog cache.
 * Never invents a path when the subtopic is missing.
 */
export async function resolveSubtopicPracticeHref(
  subtopicSlug: string = SUBTOPIC_SLUG,
): Promise<ResolvedSubtopicPracticePath | null> {
  const slug = String(subtopicSlug ?? '').trim();
  if (!slug) return null;

  const { subjects, topics, subtopics } = await getCatalogSnapshot();
  const subtopic = subtopics.find((row) => row.slug === slug && row.is_active);
  if (!subtopic) return null;

  const topic = topics.find((row) => row.id === subtopic.topic_id && row.is_active);
  if (!topic) return null;

  const subject = subjects.find((row) => row.id === topic.subject_id && row.is_active);
  if (!subject) return null;

  return {
    href: `/subjects/${subject.slug}/${topic.slug}/${subtopic.slug}/practice`,
    subjectSlug: subject.slug,
    topicSlug: topic.slug,
    subtopicSlug: subtopic.slug,
    subjectTitle: subject.title,
    topicTitle: topic.title,
    subtopicTitle: subtopic.title,
  };
}

export const SOURCES_REVISION_SUBTOPIC_SLUG = SUBTOPIC_SLUG;
