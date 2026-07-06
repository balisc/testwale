/**
 * Central cached catalog accessors (24h server cache).
 * Prefer these over direct Supabase calls from pages/API routes.
 */
import { unstable_cache } from 'next/cache';
import supabase, { SUPABASE_AVAILABLE } from '@/lib/supabase';
import {
  getAllExams,
  getExamWiseTopics,
  getQuestionsBySubtopic,
  getSubjectBySlug,
  getSubtopicBySlug,
  getSubtopicsByTopic,
  getTopicBySlug,
  getTopicsBySubject,
} from '@/lib/polity';
import type { Exam, Subject, Subtopic, Topic, TopicWithPriority } from '@/types/polity';

const REVALIDATE_SECONDS = 86400;

export const getSubjectsCached = unstable_cache(
  async (): Promise<Subject[]> => {
    if (!SUPABASE_AVAILABLE) return [];
    const { data, error } = await supabase
      .from('subjects')
      .select(
        'id, title, slug, description, icon_key, hero_image_url, sort_order, topic_count, question_count, is_active',
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) return [];
    return (data ?? []) as Subject[];
  },
  ['catalog-all-subjects'],
  { revalidate: REVALIDATE_SECONDS, tags: ['catalog'] },
);

export async function getSubjectCached(subjectSlug: string) {
  return getSubjectBySlug(subjectSlug);
}

export async function getTopicsCached(subjectId: string): Promise<Topic[]> {
  return getTopicsBySubject(subjectId);
}

export async function getExamTopicsCached(
  subjectId: string,
  examCode: string,
): Promise<TopicWithPriority[]> {
  return getExamWiseTopics(subjectId, examCode);
}

export async function getTopicCached(subjectId: string, topicSlug: string) {
  return getTopicBySlug(subjectId, topicSlug);
}

export async function getSubtopicsCached(topicId: string): Promise<Subtopic[]> {
  return getSubtopicsByTopic({ topicId });
}

export async function getSubtopicCached(topicId: string, subtopicSlug: string) {
  return getSubtopicBySlug(topicId, subtopicSlug);
}

export async function getExamsCached(): Promise<Exam[]> {
  return getAllExams();
}

export async function getPracticeQuestionsCached(subtopicId: string, examCode?: string) {
  return getQuestionsBySubtopic(subtopicId, examCode);
}

export const CATALOG_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
} as const;
