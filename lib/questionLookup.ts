import questionsData from '@/data/questions.json';
import supabase from '@/lib/supabase';
import { PUBLIC_QUESTION_COLUMNS } from '@/lib/questionColumns';
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

const SUBJECT_QUESTION_TABLES = Object.values(SUBJECT_TABLES);

const QUESTION_TABLES = [...SUBJECT_QUESTION_TABLES, GENERIC_QUESTIONS_TABLE] as const;

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

function getTableSearchOrder(subjectKey?: string): string[] {
  const preferredTable = subjectKey ? SUBJECT_TABLES[subjectKey] : undefined;
  const subjectTables = preferredTable
    ? [preferredTable, ...SUBJECT_QUESTION_TABLES.filter((table) => table !== preferredTable)]
    : [...SUBJECT_QUESTION_TABLES];

  return [...new Set([...subjectTables, GENERIC_QUESTIONS_TABLE])];
}

function scoreQuestionCandidate(question: QuestionRecord, context?: QuestionLookupContext): number {
  let score = 0;
  const questionTopicSlug = slugifySubject(getText(question.topic, 'en')).trim();
  const questionSlug = generateQuestionSlug(question.question, String(question.id)).trim();

  if (context?.questionSlug && questionSlug === context.questionSlug.trim()) {
    score += 100;
  }

  if (context?.topicSlug && questionTopicSlug === context.topicSlug.trim()) {
    score += 50;
  }

  if (context?.subjectKey) {
    const subjectText = slugifySubject(getText(question.subject, 'en')).trim();
    if (subjectText === context.subjectKey.trim()) {
      score += 25;
    }
    if (SUBJECT_TABLES[context.subjectKey] && question._sourceTable === SUBJECT_TABLES[context.subjectKey]) {
      score += 40;
    }
  }

  if (question._sourceTable && question._sourceTable !== GENERIC_QUESTIONS_TABLE) {
    score += 10;
  }

  if (question._sourceTable === GENERIC_QUESTIONS_TABLE) {
    score -= 100;
  }

  return score;
}

function pickBestQuestionCandidate(candidates: QuestionRecord[], context?: QuestionLookupContext) {
  if (!candidates.length) return null;
  if (candidates.length === 1) return candidates[0];

  return [...candidates].sort(
    (a, b) => scoreQuestionCandidate(b, context) - scoreQuestionCandidate(a, context)
  )[0];
}

export async function fetchQuestionById(
  questionId: string,
  context?: QuestionLookupContext
): Promise<QuestionRecord | null> {
  if (!SAFE_QUESTION_ID_PATTERN.test(questionId)) {
    return null;
  }

  const candidates: QuestionRecord[] = [];

  for (const tableName of getTableSearchOrder(context?.subjectKey)) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select(PUBLIC_QUESTION_COLUMNS)
        .eq('id', questionId)
        .maybeSingle();

      if (error) {
        console.warn(`Supabase lookup failed for table ${tableName}:`, error.message ?? error);
        continue;
      }

      if (isPublicQuestion(data as QuestionRecord | null)) {
        candidates.push({ ...(data as QuestionRecord), _sourceTable: tableName });
      }
    } catch (err) {
      console.warn(`Supabase query error for table ${tableName}:`, err);
    }
  }

  const fallbackQuestion = (questionsData as QuestionRecord[]).find((item) => String(item.id) === questionId);
  if (isPublicQuestion(fallbackQuestion ?? null) && fallbackQuestion) {
    candidates.push({ ...fallbackQuestion, _sourceTable: 'questions.json' });
  }

  const bestMatch = pickBestQuestionCandidate(candidates, context);
  if (!bestMatch) return null;

  const { _sourceTable, ...question } = bestMatch;
  return question;
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
