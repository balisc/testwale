/**
 * Single cached snapshot of fixed catalog tables (subjects / topics / subtopics / exams).
 * All public catalog UI should read from here to avoid repeated Supabase egress.
 */
import { unstable_cache } from 'next/cache';
import supabase, { SUPABASE_AVAILABLE } from '@/lib/supabase';
import type { Exam, LocalizedText, Subject, Subtopic, Topic } from '@/types/polity';

/**
 * Counts live on catalog rows and are maintained by a DB trigger. Five-minute
 * refresh means a normal SQL question upload updates every public count without
 * requiring a manual application deployment or a large question-bank fetch.
 */
export const CATALOG_REVALIDATE_SECONDS = 300;
export const CATALOG_CACHE_TAG = 'catalog';

export type CatalogSnapshot = {
  subjects: Subject[];
  topics: Topic[];
  subtopics: Subtopic[];
  exams: Exam[];
};

const EMPTY_SNAPSHOT: CatalogSnapshot = {
  subjects: [],
  topics: [],
  subtopics: [],
  exams: [],
};

function parseLocalizedField(value: unknown): LocalizedText {
  if (!value) return {};
  if (typeof value === 'string') return { en: value, hi: value };
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    return {
      en: typeof obj.en === 'string' ? obj.en : undefined,
      hi: typeof obj.hi === 'string' ? obj.hi : undefined,
    };
  }
  return {};
}

function normalizeSubject(row: Record<string, unknown>): Subject {
  return {
    id: String(row.id),
    title: parseLocalizedField(row.title),
    slug: String(row.slug ?? ''),
    description: (() => {
      const parsed = parseLocalizedField(row.description);
      return parsed.en || parsed.hi ? parsed : null;
    })(),
    icon_key: row.icon_key != null ? String(row.icon_key) : null,
    hero_image_url: row.hero_image_url != null ? String(row.hero_image_url) : null,
    sort_order: typeof row.sort_order === 'number' ? row.sort_order : null,
    topic_count: typeof row.topic_count === 'number' ? row.topic_count : null,
    question_count: typeof row.question_count === 'number' ? row.question_count : null,
    is_active: Boolean(row.is_active),
  };
}

function normalizeTopic(row: Record<string, unknown>): Topic {
  return {
    id: String(row.id),
    subject_id: String(row.subject_id),
    title: parseLocalizedField(row.title),
    slug: String(row.slug ?? ''),
    description: (() => {
      const parsed = parseLocalizedField(row.description);
      return parsed.en || parsed.hi ? parsed : null;
    })(),
    icon_key: row.icon_key != null ? String(row.icon_key) : null,
    sort_order: typeof row.sort_order === 'number' ? row.sort_order : null,
    subtopic_count: typeof row.subtopic_count === 'number' ? row.subtopic_count : null,
    question_count: typeof row.question_count === 'number' ? row.question_count : null,
    is_active: Boolean(row.is_active),
  };
}

function normalizeSubtopic(row: Record<string, unknown>): Subtopic {
  return {
    id: String(row.id),
    topic_id: String(row.topic_id),
    title: parseLocalizedField(row.title),
    slug: String(row.slug ?? ''),
    description: (() => {
      const parsed = parseLocalizedField(row.description);
      return parsed.en || parsed.hi ? parsed : null;
    })(),
    sort_order: typeof row.sort_order === 'number' ? row.sort_order : null,
    question_count: typeof row.question_count === 'number' ? row.question_count : null,
    is_active: Boolean(row.is_active),
  };
}

function normalizeExam(row: Record<string, unknown>): Exam {
  return {
    id: String(row.id),
    code: String(row.code ?? ''),
    title: parseLocalizedField(row.title),
    description: (() => {
      const parsed = parseLocalizedField(row.description);
      return parsed.en || parsed.hi ? parsed : null;
    })(),
    sort_order: typeof row.sort_order === 'number' ? row.sort_order : null,
    is_active: Boolean(row.is_active),
  };
}

/** Preferred exam pill order — Basic, SSC, Railway, State One-Day first. */
const EXAM_DISPLAY_PRIORITY = [
  'BASIC',
  'SSC',
  'RAILWAY',
  'STATE_ONEDAY',
  'STATE_ONE_DAY',
  'UPSC',
  'STATE_PCS',
] as const;

function normalizeExamCode(code: string): string {
  return String(code ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

function examDisplayRank(code: string, sortOrder: number | null): number {
  const normalized = normalizeExamCode(code);
  const priorityIndex = EXAM_DISPLAY_PRIORITY.indexOf(
    normalized as (typeof EXAM_DISPLAY_PRIORITY)[number],
  );
  if (priorityIndex >= 0) return priorityIndex;
  return EXAM_DISPLAY_PRIORITY.length + (sortOrder ?? 999);
}

function sortExamsForDisplay(exams: Exam[]): Exam[] {
  return exams
    .filter((exam) => normalizeExamCode(exam.code) !== 'ALL')
    .slice()
    .sort(
      (a, b) =>
        examDisplayRank(a.code, a.sort_order) - examDisplayRank(b.code, b.sort_order),
    );
}

async function fetchCatalogSnapshot(): Promise<CatalogSnapshot> {
  if (!SUPABASE_AVAILABLE) return EMPTY_SNAPSHOT;

  const [subjectsResult, topicsResult, subtopicsResult, examsResult] = await Promise.all([
    supabase
      .from('subjects')
      .select(
        'id, title, slug, description, icon_key, hero_image_url, sort_order, topic_count, question_count, is_active',
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('topics')
      .select(
        'id, subject_id, title, slug, description, icon_key, sort_order, subtopic_count, question_count, is_active',
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('subtopics')
      .select('id, topic_id, title, slug, description, sort_order, question_count, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('exams')
      .select('id, code, title, description, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ]);

  if (subjectsResult.error || topicsResult.error || subtopicsResult.error || examsResult.error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[catalogCache] snapshot fetch error', {
        subjects: subjectsResult.error?.message,
        topics: topicsResult.error?.message,
        subtopics: subtopicsResult.error?.message,
        exams: examsResult.error?.message,
      });
    }
    return EMPTY_SNAPSHOT;
  }

  return {
    subjects: (subjectsResult.data ?? []).map((row: Record<string, unknown>) =>
      normalizeSubject(row),
    ),
    topics: (topicsResult.data ?? []).map((row: Record<string, unknown>) => normalizeTopic(row)),
    subtopics: (subtopicsResult.data ?? []).map((row: Record<string, unknown>) =>
      normalizeSubtopic(row),
    ),
    exams: sortExamsForDisplay(
      (examsResult.data ?? []).map((row: Record<string, unknown>) => normalizeExam(row)),
    ),
  };
}

/** One small catalog round-trip set per five minutes (or explicit tag invalidation). */
export const getCatalogSnapshot = unstable_cache(fetchCatalogSnapshot, ['catalog-snapshot-v3'], {
  revalidate: CATALOG_REVALIDATE_SECONDS,
  tags: [CATALOG_CACHE_TAG],
});

export async function getSubjectByIdFromCache(subjectId: string): Promise<Subject | null> {
  if (!subjectId) return null;
  const { subjects } = await getCatalogSnapshot();
  return subjects.find((subject) => subject.id === subjectId) ?? null;
}

export async function getTopicByIdFromCache(topicId: string): Promise<Topic | null> {
  if (!topicId) return null;
  const { topics } = await getCatalogSnapshot();
  return topics.find((topic) => topic.id === topicId) ?? null;
}

export async function getSubtopicByIdFromCache(subtopicId: string): Promise<Subtopic | null> {
  if (!subtopicId) return null;
  const { subtopics } = await getCatalogSnapshot();
  return subtopics.find((subtopic) => subtopic.id === subtopicId) ?? null;
}

export async function listSubjectsFromCache(): Promise<Subject[]> {
  return (await getCatalogSnapshot()).subjects;
}

export async function getSubjectBySlugFromCache(subjectSlug: string): Promise<Subject | null> {
  const slug = String(subjectSlug ?? '').trim();
  if (!slug) return null;
  const { subjects } = await getCatalogSnapshot();
  return subjects.find((subject) => subject.slug === slug) ?? null;
}

export async function listTopicsBySubjectFromCache(subjectId: string): Promise<Topic[]> {
  if (!subjectId) return [];
  const { topics } = await getCatalogSnapshot();
  return topics.filter((topic) => topic.subject_id === subjectId);
}

export async function getTopicBySlugFromCache(
  subjectId: string,
  topicSlug: string,
): Promise<Topic | null> {
  const slug = String(topicSlug ?? '').trim();
  if (!subjectId || !slug) return null;
  const { topics } = await getCatalogSnapshot();
  return topics.find((topic) => topic.subject_id === subjectId && topic.slug === slug) ?? null;
}

export async function listSubtopicsByTopicFromCache(topicId: string): Promise<Subtopic[]> {
  if (!topicId) return [];
  const { subtopics } = await getCatalogSnapshot();
  return subtopics.filter((subtopic) => subtopic.topic_id === topicId);
}

export async function getSubtopicBySlugFromCache(
  topicId: string,
  subtopicSlug: string,
): Promise<Subtopic | null> {
  const slug = String(subtopicSlug ?? '').trim();
  if (!topicId || !slug) return null;
  const { subtopics } = await getCatalogSnapshot();
  return (
    subtopics.find((subtopic) => subtopic.topic_id === topicId && subtopic.slug === slug) ?? null
  );
}

export async function listExamsFromCache(): Promise<Exam[]> {
  return (await getCatalogSnapshot()).exams;
}
