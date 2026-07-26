import { notFound } from 'next/navigation';
import {
  getSubjectBySlug,
  getSubtopicBySlug,
  getTopicBySlug,
} from '@/lib/polity';
import { resolveSubjectSlug } from '@/lib/subjectRoutes';
import type { Subject, Subtopic, Topic } from '@/types/polity';

/** Load active subject by URL slug (null when missing). Use in generateMetadata only. */
export async function loadSubjectByRouteSlug(routeSubject: string): Promise<{
  subject: Subject;
  subjectSlug: string;
} | null> {
  const subjectSlug = resolveSubjectSlug(routeSubject);
  const subject = await getSubjectBySlug(subjectSlug);
  if (!subject) return null;
  return { subject, subjectSlug };
}

/** Load active topic (null when missing). Use in generateMetadata only. */
export async function loadTopicByRouteSlugs(
  routeSubject: string,
  topicSlug: string,
): Promise<{ subject: Subject; subjectSlug: string; topic: Topic } | null> {
  const subjectRow = await loadSubjectByRouteSlug(routeSubject);
  if (!subjectRow) return null;
  const topic = await getTopicBySlug(subjectRow.subject.id, topicSlug);
  if (!topic) return null;
  return { ...subjectRow, topic };
}

/** Load active subtopic (null when missing). Use in generateMetadata only. */
export async function loadSubtopicByRouteSlugs(
  routeSubject: string,
  topicSlug: string,
  subtopicSlug: string,
): Promise<{ subject: Subject; subjectSlug: string; topic: Topic; subtopic: Subtopic } | null> {
  const topicRow = await loadTopicByRouteSlugs(routeSubject, topicSlug);
  if (!topicRow) return null;
  const subtopic = await getSubtopicBySlug(topicRow.topic.id, subtopicSlug);
  if (!subtopic) return null;
  return { ...topicRow, subtopic };
}

/** Resolve active subject or trigger HTTP 404 (page components only — not generateMetadata). */
export async function requireSubjectByRouteSlug(routeSubject: string): Promise<{
  subject: Subject;
  subjectSlug: string;
}> {
  const row = await loadSubjectByRouteSlug(routeSubject);
  if (!row) notFound();
  return row;
}

export async function requireTopicByRouteSlugs(
  routeSubject: string,
  topicSlug: string,
): Promise<{ subject: Subject; subjectSlug: string; topic: Topic }> {
  const row = await loadTopicByRouteSlugs(routeSubject, topicSlug);
  if (!row) notFound();
  return row;
}

export async function requireSubtopicByRouteSlugs(
  routeSubject: string,
  topicSlug: string,
  subtopicSlug: string,
): Promise<{ subject: Subject; subjectSlug: string; topic: Topic; subtopic: Subtopic }> {
  const row = await loadSubtopicByRouteSlugs(routeSubject, topicSlug, subtopicSlug);
  if (!row) notFound();
  return row;
}

/** Minimal metadata for routes that will 404 in the page component. */
export const NOT_FOUND_METADATA = {
  title: 'Page not found',
  robots: { index: false, follow: true },
} as const;
