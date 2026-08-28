import questionsData from '@/data/questions.json';
import {
  getSubjectByIdFromCache,
  getSubtopicByIdFromCache,
  getTopicByIdFromCache,
} from '@/lib/catalogCache';
import supabase from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  CATALOG_PRE_SUBMIT_COLUMNS,
  legacyColumnsForTable,
} from '@/lib/questionColumns';
import { SUBJECT_TABLES } from '@/lib/subjects';
import { extractQuestionIdFromSlug, slugifySubject } from '@/lib/slugGenerator';

type LocalizedText = string | { en?: string; hi?: string };
export type QuestionRecord = Record<string, any>;

export type QuestionLookupContext = {
  topicSlug?: string;
  questionSlug?: string;
  subjectKey?: string;
};

const SAFE_QUESTION_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GENERIC_QUESTIONS_TABLE = 'questions';

function isPublicQuestion(row: QuestionRecord | null | undefined) {
  if (!row) return false;
  const status = typeof row.status === 'string' ? row.status.trim().toLowerCase() : '';
  return !status || status === 'active' || status === 'published';
}

function resolveQuestionTable(subjectKey?: string): string {
  if (subjectKey && SUBJECT_TABLES[subjectKey]) {
    return SUBJECT_TABLES[subjectKey];
  }
  return GENERIC_QUESTIONS_TABLE;
}

function columnsForTable(tableName: string): string {
  if (tableName === GENERIC_QUESTIONS_TABLE) {
    return CATALOG_PRE_SUBMIT_COLUMNS;
  }
  return legacyColumnsForTable(tableName);
}

async function queryQuestionTable(
  tableName: string,
  questionId: string,
): Promise<QuestionRecord | null> {
  const client = tableName === GENERIC_QUESTIONS_TABLE ? supabase : getSupabaseAdmin();
  if (!client) return null;
  const { data, error } = await client
    .from(tableName)
    .select(columnsForTable(tableName))
    .eq('id', questionId)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[questionLookup] ${tableName}:`, error.message ?? error);
    }
    return null;
  }

  if (!isPublicQuestion(data as QuestionRecord | null)) {
    return null;
  }

  return { ...(data as QuestionRecord), _sourceTable: tableName };
}

/** Map catalog rows to the shape question pages / SEO helpers expect. */
async function normalizeFetchedQuestion(row: QuestionRecord): Promise<QuestionRecord> {
  const { _sourceTable, ...rest } = row;
  const isCatalog = _sourceTable === GENERIC_QUESTIONS_TABLE || Boolean(rest.question_text && !rest.question);

  if (!isCatalog) {
    return rest;
  }

  const [subject, topic, subtopic] = await Promise.all([
    rest.subject_id ? getSubjectByIdFromCache(String(rest.subject_id)) : null,
    rest.topic_id ? getTopicByIdFromCache(String(rest.topic_id)) : null,
    rest.subtopic_id ? getSubtopicByIdFromCache(String(rest.subtopic_id)) : null,
  ]);

  return {
    ...rest,
    question: rest.question ?? rest.question_text,
    subject: rest.subject ?? subject?.title ?? undefined,
    topic: rest.topic ?? topic?.title ?? undefined,
    subtopic: rest.subtopic ?? subtopic?.title ?? undefined,
    topic_slug: topic?.slug || undefined,
    subtopic_slug: subtopic?.slug || undefined,
    subject_slug: subject?.slug || undefined,
    answer: rest.answer ?? rest.correct_option ?? undefined,
  };
}

export async function fetchQuestionById(
  questionId: string,
  context?: QuestionLookupContext,
): Promise<QuestionRecord | null> {
  if (!SAFE_QUESTION_ID_PATTERN.test(questionId)) {
    return null;
  }

  const isUuid = UUID_PATTERN.test(questionId);

  // Catalog practice IDs are UUIDs — try unified `questions` first to avoid legacy integer tables.
  if (isUuid) {
    const catalog = await queryQuestionTable(GENERIC_QUESTIONS_TABLE, questionId);
    if (catalog) {
      return normalizeFetchedQuestion(catalog);
    }
  }

  const primaryTable = resolveQuestionTable(context?.subjectKey);
  if (!(isUuid && primaryTable === GENERIC_QUESTIONS_TABLE)) {
    const primary = await queryQuestionTable(primaryTable, questionId);
    if (primary) {
      return normalizeFetchedQuestion(primary);
    }
  }

  if (!isUuid && primaryTable !== GENERIC_QUESTIONS_TABLE) {
    const catalog = await queryQuestionTable(GENERIC_QUESTIONS_TABLE, questionId);
    if (catalog) {
      return normalizeFetchedQuestion(catalog);
    }
  }

  const fallbackQuestion = (questionsData as QuestionRecord[]).find(
    (item) => String(item.id) === questionId,
  );
  if (isPublicQuestion(fallbackQuestion ?? null) && fallbackQuestion) {
    return fallbackQuestion;
  }

  return null;
}

export function inferSubjectKeyFromTopicSlug(topicSlug: string): string | undefined {
  const normalized = slugifySubject(topicSlug.replace(/-/g, ' ')).trim();
  if (!normalized) return undefined;

  // Exact / prefix matches only — avoid "constitutional-history-making" → legacy history table.
  if (normalized === 'history' || normalized.startsWith('history-')) return 'history';
  if (normalized === 'polity' || normalized.startsWith('polity-') || normalized === 'indian-polity') {
    return 'polity';
  }
  if (normalized === 'science' || normalized.startsWith('science-')) return 'science';
  if (normalized === 'economics' || normalized.startsWith('economics-')) return 'economics';
  if (normalized === 'geography' || normalized.startsWith('geography-')) return 'geography';
  if (normalized === 'math' || normalized.startsWith('math-')) return 'math';
  if (normalized === 'reasoning' || normalized.startsWith('reasoning-')) return 'reasoning';
  if (normalized === 'current-affairs' || normalized.startsWith('current-affairs-')) {
    return 'current-affairs';
  }
  if (normalized === 'general-knowledge' || normalized.startsWith('general-knowledge-')) {
    return 'general-knowledge';
  }

  return undefined;
}

export function decodeQuizTopicFromSlug(topicSlug: string): string {
  return topicSlug.replace(/-/g, ' ').trim();
}

export function buildQuestionLookupContext(options: {
  topicSlug?: string;
  questionSlug?: string;
  subjectKey?: string;
}): QuestionLookupContext {
  return {
    topicSlug: options.topicSlug?.trim() || undefined,
    questionSlug: options.questionSlug?.trim() || undefined,
    subjectKey: options.subjectKey?.trim() || undefined,
  };
}

export function extractQuestionIdFromQuestionSlug(questionSlug: string): string {
  return extractQuestionIdFromSlug(questionSlug);
}

export function getQuestionTextField(question: QuestionRecord | null | undefined): LocalizedText | undefined {
  if (!question) return undefined;
  return question.question ?? question.question_text;
}
