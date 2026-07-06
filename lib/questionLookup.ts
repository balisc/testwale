import questionsData from '@/data/questions.json';
import supabase from '@/lib/supabase';
import {
  CATALOG_PRE_SUBMIT_COLUMNS,
  legacyColumnsForTable,
} from '@/lib/questionColumns';
import { SUBJECT_TABLES } from '@/lib/subjects';
import { extractQuestionIdFromSlug, generateQuestionSlug, slugifySubject } from '@/lib/slugGenerator';

type LocalizedText = string | { en?: string; hi?: string };
export type QuestionRecord = Record<string, any>;

export type QuestionLookupContext = {
  topicSlug?: string;
  questionSlug?: string;
  subjectKey?: string;
};

const SAFE_QUESTION_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const GENERIC_QUESTIONS_TABLE = 'questions';

function getText(value: LocalizedText | undefined, locale: 'en' | 'hi' = 'en'): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] || value.en || value.hi || '';
}

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
  const { data, error } = await supabase
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

export async function fetchQuestionById(
  questionId: string,
  context?: QuestionLookupContext,
): Promise<QuestionRecord | null> {
  if (!SAFE_QUESTION_ID_PATTERN.test(questionId)) {
    return null;
  }

  const primaryTable = resolveQuestionTable(context?.subjectKey);
  const primary = await queryQuestionTable(primaryTable, questionId);

  if (primary) {
    const { _sourceTable, ...question } = primary;
    return question;
  }

  if (primaryTable !== GENERIC_QUESTIONS_TABLE) {
    const catalog = await queryQuestionTable(GENERIC_QUESTIONS_TABLE, questionId);
    if (catalog) {
      const { _sourceTable, ...question } = catalog;
      return question;
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

  if (normalized.includes('history')) return 'history';
  if (normalized.includes('polity')) return 'polity';
  if (normalized.includes('science')) return 'science';
  if (normalized.includes('economics')) return 'economics';
  if (normalized.includes('geography')) return 'geography';
  if (normalized.includes('math')) return 'math';
  if (normalized.includes('reasoning')) return 'reasoning';
  if (normalized.includes('current-affairs')) return 'current-affairs';
  if (normalized.includes('general-knowledge')) return 'general-knowledge';

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
