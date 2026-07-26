import supabase, { SUPABASE_AVAILABLE } from '@/lib/supabase';
import { unstable_cache } from 'next/cache';
import {
  CATALOG_CACHE_TAG,
  CATALOG_REVALIDATE_SECONDS,
  getSubjectBySlugFromCache,
  getSubtopicBySlugFromCache,
  getTopicBySlugFromCache,
  listExamsFromCache,
  listSubtopicsByTopicFromCache,
  listTopicsBySubjectFromCache,
} from '@/lib/catalogCache';
import { getLocalizedText } from '@/lib/localizedText';
import {
  QUESTION_BATCH_CACHE_VERSION,
  QUESTION_BATCH_REVALIDATE_SECONDS,
  QUESTION_BATCH_TAG,
  questionBatchSubtopicTag,
  questionBatchTopicTag,
} from '@/lib/questionBatchCache';
import { getQuestionBankVersionCached } from '@/lib/questionBankVersion';
import {
  clampQuestionLimit,
  MAX_QUESTION_LIMIT,
  QUESTION_BATCH_PAGE_SIZE,
} from '@/lib/supabaseQueryLimits';
import type {
  Exam,
  LocalizedText,
  PublicQuestion,
  Question,
  QuestionBatchPage,
  SourceMetadata,
  Subject,
  Subtopic,
  SubtopicWithExamPriority,
  Topic,
  TopicWithPriority,
} from '@/types/polity';
import { parseSourceMetadata } from '@/lib/questions/parseQuestionSources';
import { QUESTIONS_PUBLIC_SELECT } from '@/lib/questionColumns';

/** Full-row select for service-role / internal use only — never for anon. */
const QUESTION_SELECT =
  'id, question_text, options, correct_option, explanation, difficulty, source, source_metadata, year, pyq_exam_name, exam_tags, attempt_count, correct_count';

/** Public catalog batch — matches questions column grants for anon/authenticated. */
const PUBLIC_QUESTION_SELECT = QUESTIONS_PUBLIC_SELECT;

const DEBUG = process.env.NODE_ENV !== 'production';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Stable cache-key segment for the first cursor page. */
const FIRST_PAGE_CURSOR_KEY = 'first';

const EMPTY_QUESTION_BATCH: QuestionBatchPage = {
  questions: [],
  nextCursor: null,
  hasMore: false,
};

export type GetQuestionBatchOptions = {
  cursor?: string | null;
  batchSize?: number;
};

type TopicRow = {
  id: string;
  subject_id: string;
  title: string;
  slug: string;
  description: string | null;
  icon_key: string | null;
  sort_order: number | null;
  subtopic_count: number | null;
  question_count: number | null;
  is_active: boolean;
};

type TopicPriorityRow = {
  topic_id: string;
  exam_code: string;
  priority: number;
  importance: string | null;
  is_recommended: boolean;
};

type SubtopicPriorityRow = {
  subtopic_id: string;
  topic_id: string;
  exam_code: string;
  priority: number;
  importance: string | null;
  importance_label: unknown;
  is_recommended: boolean;
};

export type GetSubtopicsByTopicParams = {
  topicId: string;
  examCode?: string | null;
  lang?: 'en' | 'hi';
};

function logQuery(name: string, params: Record<string, unknown>, data: unknown, error: unknown) {
  if (!DEBUG) return;
  console.log(`[polity] ${name} params:`, params);
  if (error) {
    const err = error as { code?: string; message?: string; details?: string; hint?: string };
    console.error(`[polity] ${name} error:`, {
      code: err.code,
      message: err.message,
      details: err.details,
      hint: err.hint,
    });
  } else {
    const count = Array.isArray(data) ? data.length : data ? 1 : 0;
    console.log(`[polity] ${name} ok — rows:`, count, Array.isArray(data) ? undefined : data);
  }
}

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

function normalizeSourceMetadata(raw: unknown): SourceMetadata | null {
  const parsed = parseSourceMetadata(raw);
  if (!parsed) return null;
  return {
    primary_sources: parsed.primary_sources,
    secondary_sources: parsed.secondary_sources,
    ...(parsed.evidence_locator ? { evidence_locator: parsed.evidence_locator } : {}),
  };
}

function normalizePublicQuestion(row: Record<string, unknown>): PublicQuestion {
  return {
    id: String(row.id),
    question_text: parseLocalizedField(row.question_text),
    options: (row.options as PublicQuestion['options']) ?? {},
    difficulty: row.difficulty != null ? String(row.difficulty) : null,
    source: row.source != null ? String(row.source) : null,
    source_metadata: normalizeSourceMetadata(row.source_metadata),
    year: typeof row.year === 'number' ? row.year : row.year != null ? Number(row.year) : null,
    pyq_exam_name: row.pyq_exam_name != null ? String(row.pyq_exam_name) : null,
    exam_tags: Array.isArray(row.exam_tags) ? row.exam_tags.map(String) : null,
    // Crowd stats are not selectable by anon after column grants — filled after submit via secure API.
    attempt_count: 0,
    correct_count: 0,
  };
}

function applyVerifiedActiveQuestionFilters<T extends { eq: (col: string, val: boolean) => T }>(query: T): T {
  return query.eq('is_active', true).eq('is_verified', true);
}

function normalizeQuestion(row: Record<string, unknown>): Question {
  return {
    id: String(row.id),
    question_text: (row.question_text as Question['question_text']) ?? {},
    options: (row.options as Question['options']) ?? {},
    correct_option: String(row.correct_option ?? ''),
    explanation: (row.explanation as Question['explanation']) ?? {},
    difficulty: row.difficulty != null ? String(row.difficulty) : null,
    source: row.source != null ? String(row.source) : null,
    source_metadata: normalizeSourceMetadata(row.source_metadata),
    year: typeof row.year === 'number' ? row.year : row.year != null ? Number(row.year) : null,
    pyq_exam_name: row.pyq_exam_name != null ? String(row.pyq_exam_name) : null,
    exam_tags: Array.isArray(row.exam_tags) ? row.exam_tags.map(String) : null,
  };
}

export async function getSubjectBySlug(subjectSlug: string): Promise<Subject | null> {
  const slug = String(subjectSlug ?? '').trim();
  const params = { subjectSlug: slug, supabaseConfigured: SUPABASE_AVAILABLE };

  if (!slug) {
    logQuery('getSubjectBySlug', params, null, { message: 'Empty slug passed' });
    return null;
  }

  const subject = await getSubjectBySlugFromCache(slug);
  logQuery('getSubjectBySlug', params, subject, null);
  return subject;
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

function examDisplayRank(code: string, sortOrder: number | null): number {
  const normalized = normalizeExamCode(code);
  const priorityIndex = EXAM_DISPLAY_PRIORITY.indexOf(
    normalized as (typeof EXAM_DISPLAY_PRIORITY)[number],
  );
  if (priorityIndex >= 0) return priorityIndex;
  return EXAM_DISPLAY_PRIORITY.length + (sortOrder ?? 999);
}

/** Sort exams for UI; hides ALL (separate “All Exams” pill) and puts core exams first. */
export function sortExamsForDisplay(exams: Exam[]): Exam[] {
  return exams
    .filter((exam) => normalizeExamCode(exam.code) !== 'ALL')
    .slice()
    .sort(
      (a, b) =>
        examDisplayRank(a.code, a.sort_order) - examDisplayRank(b.code, b.sort_order),
    );
}

export async function getAllExams(): Promise<Exam[]> {
  const exams = await listExamsFromCache();
  logQuery('getAllExams', {}, exams, null);
  return exams;
}

export async function getTopicsBySubject(subjectId: string): Promise<Topic[]> {
  const params = { subjectId };

  if (!subjectId) {
    logQuery('getTopicsBySubject', params, null, { message: 'subjectId is undefined' });
    return [];
  }

  const topics = await listTopicsBySubjectFromCache(subjectId);
  logQuery('getTopicsBySubject', params, topics, null);
  return topics;
}

export async function getExamWiseTopics(
  subjectId: string,
  examCode: string,
): Promise<TopicWithPriority[]> {
  const normalizedExamCode = normalizeExamCode(examCode);
  const params = { subjectId, examCode: normalizedExamCode };

  if (!subjectId || !normalizedExamCode) {
    logQuery('getExamWiseTopics', params, null, { message: 'Missing subjectId or examCode' });
    return [];
  }

  return unstable_cache(
    async () => {
      const { data: priorityRows, error: priorityError } = await supabase
        .from('topic_exam_priority')
        .select('topic_id, exam_code, priority, importance, is_recommended')
        .eq('exam_code', normalizedExamCode)
        .eq('is_recommended', true)
        .order('priority', { ascending: true });

      logQuery('getExamWiseTopics.priority', params, priorityRows, priorityError);

      if (priorityError) return [];

      const rows = (priorityRows ?? []) as TopicPriorityRow[];
      if (rows.length === 0) return [];

      const topicIds = rows.map((row) => row.topic_id);
      if (topicIds.length === 0) return [];

      const { data: topicRows, error: topicError } = await supabase
        .from('topics')
        .select(
          'id, subject_id, title, slug, description, icon_key, sort_order, subtopic_count, question_count, is_active',
        )
        .in('id', topicIds)
        .eq('subject_id', subjectId)
        .eq('is_active', true);

      logQuery('getExamWiseTopics.topics', { ...params, topicIds: topicIds.length }, topicRows, topicError);

      if (topicError) return [];

      const priorityMap = new Map(rows.map((row) => [row.topic_id, row]));

      return (topicRows as Record<string, unknown>[])
        .map((row) => {
          const topic = normalizeTopic(row);
          const priorityRow = priorityMap.get(topic.id);
          return {
            id: topic.id,
            title: topic.title,
            slug: topic.slug,
            description: topic.description,
            icon_key: topic.icon_key,
            subtopic_count: topic.subtopic_count,
            question_count: topic.question_count,
            priority: priorityRow?.priority ?? 999,
            importance: (() => {
              const parsed = parseLocalizedField(priorityRow?.importance);
              return parsed.en || parsed.hi ? parsed : 'medium';
            })(),
            is_recommended: priorityRow?.is_recommended ?? true,
          } satisfies TopicWithPriority;
        })
        .sort((a, b) => a.priority - b.priority);
    },
    ['polity-exam-topics', subjectId, normalizedExamCode],
    { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_CACHE_TAG] },
  )();
}

export async function getTopicBySlug(subjectId: string, topicSlug: string): Promise<Topic | null> {
  const params = { subjectId, topicSlug: String(topicSlug ?? '').trim() };

  if (!subjectId || !params.topicSlug) {
    logQuery('getTopicBySlug', params, null, { message: 'Missing subjectId or topicSlug' });
    return null;
  }

  const topic = await getTopicBySlugFromCache(subjectId, params.topicSlug);
  logQuery('getTopicBySlug', params, topic, null);
  return topic;
}

async function getDefaultSubtopicsByTopic(topicId: string): Promise<SubtopicWithExamPriority[]> {
  const params = { topicId, mode: 'default' };
  const subtopics = await listSubtopicsByTopicFromCache(topicId);
  logQuery('getSubtopicsByTopic.default', params, subtopics, null);
  return subtopics;
}

async function getExamWiseSubtopics(
  topicId: string,
  examCode: string,
): Promise<SubtopicWithExamPriority[]> {
  const params = { topicId, examCode, mode: 'exam' };

  const { data: priorityRows, error: priorityError } = await supabase
    .from('subtopic_exam_priority')
    .select(
      'subtopic_id, topic_id, exam_code, priority, importance, importance_label, is_recommended',
    )
    .eq('topic_id', topicId)
    .eq('exam_code', examCode)
    .eq('is_recommended', true)
    .order('priority', { ascending: true });

  if (DEBUG) {
    console.log('topicId', topicId);
    console.log('examCode', examCode);
    console.log('priorityRows', priorityRows);
    console.log('error', priorityError);
  }

  logQuery('getSubtopicsByTopic.priority', params, priorityRows, priorityError);

  if (priorityError) return [];

  const rows = (priorityRows ?? []) as SubtopicPriorityRow[];
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.subtopic_id);
  const { data: subtopicRows, error: subtopicError } = await supabase
    .from('subtopics')
    .select('id, topic_id, title, slug, description, sort_order, question_count, is_active')
    .in('id', ids)
    .eq('is_active', true);

  logQuery('getSubtopicsByTopic.subtopics', { ...params, ids: ids.length }, subtopicRows, subtopicError);

  if (subtopicError) return [];

  const subtopicMap = new Map(
    (subtopicRows ?? []).map((row: Record<string, unknown>) => [
      String(row.id),
      normalizeSubtopic(row),
    ]),
  );

  const finalSubtopics = rows
    .map((priorityRow) => {
      const subtopic = subtopicMap.get(String(priorityRow.subtopic_id));
      if (!subtopic) return null;

      const importanceLabel = parseLocalizedField(priorityRow.importance_label);

      return {
        ...subtopic,
        exam_priority: priorityRow.priority,
        importance: priorityRow.importance != null ? String(priorityRow.importance) : null,
        importance_label: importanceLabel.en || importanceLabel.hi ? importanceLabel : null,
        is_recommended: Boolean(priorityRow.is_recommended),
      } as SubtopicWithExamPriority;
    })
    .filter((item): item is SubtopicWithExamPriority => item !== null)
    .sort((a, b) => (a.exam_priority ?? 999) - (b.exam_priority ?? 999))
    .map((item, index) => ({
      ...item,
      priority: index + 1,
    }));

  if (DEBUG) {
    console.log('finalSubtopics', finalSubtopics);
  }

  return finalSubtopics;
}

export async function getSubtopicsByTopic({
  topicId,
  examCode,
}: GetSubtopicsByTopicParams): Promise<SubtopicWithExamPriority[]> {
  if (!topicId) {
    logQuery('getSubtopicsByTopic', { topicId, examCode }, null, { message: 'topicId is undefined' });
    return [];
  }

  const normalizedExam = examCode ? normalizeExamCode(examCode) : undefined;

  if (normalizedExam && normalizedExam !== 'ALL') {
    return unstable_cache(
      async () => getExamWiseSubtopics(topicId, normalizedExam),
      ['polity-subtopics', topicId, normalizedExam],
      { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_CACHE_TAG] },
    )();
  }

  return getDefaultSubtopicsByTopic(topicId);
}

export async function getSubtopicBySlug(topicId: string, subtopicSlug: string): Promise<Subtopic | null> {
  const params = { topicId, subtopicSlug: String(subtopicSlug ?? '').trim() };

  if (!topicId || !params.subtopicSlug) {
    logQuery('getSubtopicBySlug', params, null, { message: 'Missing topicId or subtopicSlug' });
    return null;
  }

  const cached = await getSubtopicBySlugFromCache(topicId, params.subtopicSlug);
  if (cached) {
    logQuery('getSubtopicBySlug', params, cached, null);
    return cached;
  }

  if (!SUPABASE_AVAILABLE) {
    logQuery('getSubtopicBySlug', params, null, { message: 'Cache miss; Supabase unavailable' });
    return null;
  }

  const { data, error } = await supabase
    .from('subtopics')
    .select('id, topic_id, title, slug, description, sort_order, question_count, is_active')
    .eq('topic_id', topicId)
    .eq('slug', params.subtopicSlug)
    .eq('is_active', true)
    .maybeSingle();

  logQuery('getSubtopicBySlug.fallback', params, data, error);
  if (error || !data) return null;
  return normalizeSubtopic(data as Record<string, unknown>);
}

function clampBatchSize(raw?: number): number {
  return clampQuestionLimit(raw, QUESTION_BATCH_PAGE_SIZE);
}

function isValidQuestionCursor(cursor: string): boolean {
  return UUID_PATTERN.test(cursor);
}

function resolveExamCacheKey(examCode?: string): string {
  const normalized = examCode ? normalizeExamCode(examCode) : undefined;
  return normalized && normalized !== 'ALL' ? normalized : 'all';
}

function buildQuestionBatchPage(rows: PublicQuestion[], batchSize: number): QuestionBatchPage {
  const hasMore = rows.length > batchSize;
  const questions = hasMore ? rows.slice(0, batchSize) : rows;
  const nextCursor = hasMore && questions.length > 0 ? questions[questions.length - 1]!.id : null;
  return { questions, nextCursor, hasMore };
}

type QuestionBatchScope =
  | { kind: 'subtopic'; subtopicId: string }
  | { kind: 'topic'; topicId: string };

async function fetchQuestionBatchPage(
  scope: QuestionBatchScope,
  normalizedExam: string | undefined,
  queryCursor: string | null,
  batchSize: number,
  logName: string,
  logParams: Record<string, unknown>,
): Promise<QuestionBatchPage> {
  const scopeColumn = scope.kind === 'subtopic' ? 'subtopic_id' : 'topic_id';
  const scopeId = scope.kind === 'subtopic' ? scope.subtopicId : scope.topicId;

  let query = applyVerifiedActiveQuestionFilters(
    supabase.from('questions').select(PUBLIC_QUESTION_SELECT).eq(scopeColumn, scopeId),
  );

  if (queryCursor) {
    query = query.lt('id', queryCursor);
  }

  if (normalizedExam && normalizedExam !== 'ALL') {
    query = query.contains('exam_tags', [normalizedExam]);
  }

  const { data, error } = await query.order('id', { ascending: false }).limit(batchSize + 1);

  logQuery(logName, { ...logParams, queryCursor, batchSize }, data, error);

  if (error) return EMPTY_QUESTION_BATCH;

  const rows = (data ?? []).map((row: Record<string, unknown>) => normalizePublicQuestion(row));
  return buildQuestionBatchPage(rows, batchSize);
}

export async function getQuestionBatchBySubtopic(
  subtopicId: string,
  examCode?: string,
  options?: GetQuestionBatchOptions,
): Promise<QuestionBatchPage> {
  const normalizedExam = examCode ? normalizeExamCode(examCode) : undefined;
  const batchSize = clampBatchSize(options?.batchSize);
  const examKey = resolveExamCacheKey(normalizedExam);
  const params = { subtopicId, examCode: normalizedExam, batchSize };

  if (!subtopicId) {
    logQuery('getQuestionBatchBySubtopic', params, null, { message: 'subtopicId is undefined' });
    return EMPTY_QUESTION_BATCH;
  }

  const trimmedCursor = options?.cursor?.trim();
  if (trimmedCursor && !isValidQuestionCursor(trimmedCursor)) {
    logQuery('getQuestionBatchBySubtopic', { ...params, cursor: trimmedCursor }, null, {
      message: 'Invalid cursor',
    });
    return EMPTY_QUESTION_BATCH;
  }

  const cursorKey = trimmedCursor || FIRST_PAGE_CURSOR_KEY;
  const queryCursor = trimmedCursor || null;
  const bankVersion = await getQuestionBankVersionCached('subtopic', subtopicId);

  return unstable_cache(
    async () =>
      fetchQuestionBatchPage(
        { kind: 'subtopic', subtopicId },
        normalizedExam,
        queryCursor,
        batchSize,
        'getQuestionBatchBySubtopic',
        params,
      ),
    [
      'polity-question-batch-subtopic',
      QUESTION_BATCH_CACHE_VERSION,
      subtopicId,
      bankVersion,
      examKey,
      cursorKey,
      String(batchSize),
    ],
    {
      revalidate: QUESTION_BATCH_REVALIDATE_SECONDS,
      tags: [QUESTION_BATCH_TAG, questionBatchSubtopicTag(subtopicId)],
    },
  )();
}

export async function getQuestionBatchByTopic(
  topicId: string,
  examCode?: string,
  options?: GetQuestionBatchOptions,
): Promise<QuestionBatchPage> {
  const normalizedExam = examCode ? normalizeExamCode(examCode) : undefined;
  const batchSize = clampBatchSize(options?.batchSize);
  const examKey = resolveExamCacheKey(normalizedExam);
  const params = { topicId, examCode: normalizedExam, batchSize };

  if (!topicId) {
    logQuery('getQuestionBatchByTopic', params, null, { message: 'topicId is undefined' });
    return EMPTY_QUESTION_BATCH;
  }

  const trimmedCursor = options?.cursor?.trim();
  if (trimmedCursor && !isValidQuestionCursor(trimmedCursor)) {
    logQuery('getQuestionBatchByTopic', { ...params, cursor: trimmedCursor }, null, {
      message: 'Invalid cursor',
    });
    return EMPTY_QUESTION_BATCH;
  }

  const cursorKey = trimmedCursor || FIRST_PAGE_CURSOR_KEY;
  const queryCursor = trimmedCursor || null;
  const bankVersion = await getQuestionBankVersionCached('topic', topicId);

  return unstable_cache(
    async () =>
      fetchQuestionBatchPage(
        { kind: 'topic', topicId },
        normalizedExam,
        queryCursor,
        batchSize,
        'getQuestionBatchByTopic',
        params,
      ),
    [
      'polity-question-batch-topic',
      QUESTION_BATCH_CACHE_VERSION,
      topicId,
      bankVersion,
      examKey,
      cursorKey,
      String(batchSize),
    ],
    {
      revalidate: QUESTION_BATCH_REVALIDATE_SECONDS,
      tags: [QUESTION_BATCH_TAG, questionBatchTopicTag(topicId)],
    },
  )();
}

export async function getQuestionsBySubtopic(
  subtopicId: string,
  examCode?: string,
): Promise<PublicQuestion[]> {
  const page = await getQuestionBatchBySubtopic(subtopicId, examCode, {
    batchSize: MAX_QUESTION_LIMIT,
  });
  return page.questions;
}

export async function getMixedQuestionsByTopic(topicId: string, examCode?: string): Promise<PublicQuestion[]> {
  const page = await getQuestionBatchByTopic(topicId, examCode, { batchSize: MAX_QUESTION_LIMIT });
  return page.questions;
}

/** Normalize URL exam param to DB exam_code (e.g. ssc → SSC). */
export function normalizeExamCode(exam?: string | null): string {
  return String(exam ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
}

export function buildExamQuery(exam?: string | null): string | undefined {
  if (!exam || exam.toUpperCase() === 'ALL') return undefined;
  return normalizeExamCode(exam);
}

export function examLabel(exams: Exam[], code: string): string {
  const normalized = normalizeExamCode(code);
  const match = exams.find((exam) => normalizeExamCode(exam.code) === normalized);
  return match ? getLocalizedText(match.title, 'en') : code;
}

export function resolveExamCodeFromDb(exams: Exam[], urlExam: string): string {
  const normalized = normalizeExamCode(urlExam);
  const match = exams.find((exam) => normalizeExamCode(exam.code) === normalized);
  return match?.code ?? normalized;
}
