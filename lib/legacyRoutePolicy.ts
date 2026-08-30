import { getCatalogSnapshot } from '@/lib/catalogCache';
import { resolveSubjectSlug } from '@/lib/subjectRoutes';
import {
  getPublishedRevision,
  publishedRevisionPath,
} from '@/lib/revision/registry';

export type LegacyRouteReplacement = {
  destination: string;
  kind: 'topic' | 'subtopic-revision' | 'subtopic-practice';
};

export async function findLegacySubjectReplacement(routeSubject: string): Promise<string | null> {
  const subjectSlug = resolveSubjectSlug(routeSubject);
  if (!subjectSlug) return null;
  try {
    const snapshot = await getCatalogSnapshot();
    const subject = snapshot.subjects.find(
      (row) => row.is_active && row.slug === subjectSlug && Number(row.question_count ?? 0) > 0,
    );
    return subject ? `/subjects/${subject.slug}` : null;
  } catch {
    // A catalog outage must not turn a legacy fallback page into a 500.
    return null;
  }
}

/**
 * Finds only a semantically exact, data-driven replacement for a legacy quiz
 * slug. It never redirects unrelated empty pages to a subject or homepage.
 */
export async function findLegacyTopicReplacement(
  routeSubject: string,
  topicOrSubtopicSlug: string,
): Promise<LegacyRouteReplacement | null> {
  const subjectSlug = resolveSubjectSlug(routeSubject);
  const normalizedSlug = String(topicOrSubtopicSlug ?? '').trim().toLowerCase();
  if (!subjectSlug || !normalizedSlug) return null;

  let snapshot: Awaited<ReturnType<typeof getCatalogSnapshot>>;
  try {
    snapshot = await getCatalogSnapshot();
  } catch {
    // Preserve the existing legacy fallback during transient catalog failures.
    return null;
  }
  const subject = snapshot.subjects.find(
    (row) => row.is_active && row.slug === subjectSlug,
  );
  if (!subject) return null;

  const topic = snapshot.topics.find(
    (row) => row.is_active && row.subject_id === subject.id && row.slug === normalizedSlug,
  );
  if (topic) {
    return {
      destination: `/subjects/${subject.slug}/${topic.slug}`,
      kind: 'topic',
    };
  }

  const subtopic = snapshot.subtopics.find(
    (row) => row.is_active && row.slug === normalizedSlug && Number(row.question_count ?? 0) > 0,
  );
  if (!subtopic) return null;
  const parentTopic = snapshot.topics.find(
    (row) => row.is_active && row.subject_id === subject.id && row.id === subtopic.topic_id,
  );
  if (!parentTopic) return null;

  const revision = getPublishedRevision(subject.slug, parentTopic.slug, subtopic.slug);
  if (revision) {
    return {
      destination: publishedRevisionPath(revision),
      kind: 'subtopic-revision',
    };
  }
  return {
    destination: `/subjects/${subject.slug}/${parentTopic.slug}/practice/${subtopic.slug}`,
    kind: 'subtopic-practice',
  };
}
