/**
 * Central cached catalog accessors (24h server cache).
 * Prefer these over direct Supabase calls from pages/API routes.
 */
import {
  getSubjectBySlugFromCache,
  getSubtopicBySlugFromCache,
  getTopicBySlugFromCache,
  listExamsFromCache,
  listSubjectsFromCache,
  listSubtopicsByTopicFromCache,
  listTopicsBySubjectFromCache,
} from '@/lib/catalogCache';
import {
  getExamWiseTopics,
  getQuestionsBySubtopic,
  getSubtopicsByTopic,
} from '@/lib/polity';
import type { Exam, Subject, Subtopic, Topic, TopicWithPriority } from '@/types/polity';

export const getSubjectsCached = listSubjectsFromCache;

export async function getSubjectCached(subjectSlug: string) {
  return getSubjectBySlugFromCache(subjectSlug);
}

export async function getTopicsCached(subjectId: string): Promise<Topic[]> {
  return listTopicsBySubjectFromCache(subjectId);
}

export async function getExamTopicsCached(
  subjectId: string,
  examCode: string,
): Promise<TopicWithPriority[]> {
  return getExamWiseTopics(subjectId, examCode);
}

export async function getTopicCached(subjectId: string, topicSlug: string) {
  return getTopicBySlugFromCache(subjectId, topicSlug);
}

export async function getSubtopicsCached(topicId: string): Promise<Subtopic[]> {
  return listSubtopicsByTopicFromCache(topicId);
}

/** Exam-aware subtopics (falls back to full topic list when exam is ALL / missing). */
export async function getSubtopicsForExamCached(topicId: string, examCode?: string) {
  return getSubtopicsByTopic({ topicId, examCode });
}

export async function getSubtopicCached(topicId: string, subtopicSlug: string) {
  return getSubtopicBySlugFromCache(topicId, subtopicSlug);
}

export async function getExamsCached(): Promise<Exam[]> {
  return listExamsFromCache();
}

export async function getPracticeQuestionsCached(subtopicId: string, examCode?: string) {
  return getQuestionsBySubtopic(subtopicId, examCode);
}

export const CATALOG_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
} as const;

export type { Subject };
