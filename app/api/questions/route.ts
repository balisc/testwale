import { NextResponse } from 'next/server';
import questionsData from '@/data/questions.json';
import supabase from '@/lib/supabase';
import { HISTORY_QUESTION_COLUMNS, PUBLIC_QUESTION_COLUMNS } from '@/lib/questionColumns';
import {
  hasRequiredQuestionListFilter,
  missingQuestionListFilterResponse,
  parseQuestionListFilters,
  questionListJsonResponse,
  resolveQuestionListLimit,
} from '@/lib/publicQuestionApiGuards';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SUBJECT_TABLES: Record<string, string> = {
  history: 'history_questions',
  science: 'science_questions',
  polity: 'polity_questions',
  economics: 'economics_questions',
  geography: 'geography_questions',
  'general-knowledge': 'general_knowledge_questions',
  math: 'math_questions',
  'current-affairs': 'current_affairs_questions',
  reasoning: 'reasoning_questions',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function escapeForLike(value: string) {
  return value.replace(/([%_\\,()])/g, '\\$1');
}

const MAX_QUERY_LENGTH = 120;
const SAFE_QUERY_PATTERN = /^[\p{L}\p{N}\s\-&().]+$/u;

function isSafeSearchValue(value: string) {
  return value.length <= MAX_QUERY_LENGTH && SAFE_QUERY_PATTERN.test(value);
}

function extractTopicText(topic: unknown) {
  if (!topic) return '';
  if (typeof topic === 'string') return topic.trim();
  if (typeof topic === 'object') {
    return String((topic as any).en ?? (topic as any).hi ?? '').trim();
  }
  return '';
}

function extractSubjectText(rawSubject: unknown): string {
  if (rawSubject === null || rawSubject === undefined) return '';
  if (typeof rawSubject === 'string') return rawSubject.trim();
  if (typeof rawSubject === 'object') {
    if (Array.isArray(rawSubject)) {
      return rawSubject.map((item) => String(item).trim()).join(' ');
    }
    return String((rawSubject as any).en ?? (rawSubject as any).hi ?? Object.values(rawSubject as any).join(' ')).trim();
  }
  return String(rawSubject).trim();
}

function getHistorySubCategoryKey(topic: string) {
  const normalizedTopic = topic.trim().toLowerCase();
  if (normalizedTopic.includes('modern')) return 'modern';
  if (normalizedTopic.includes('medieval')) return 'medieval';
  if (normalizedTopic.includes('ancient')) return 'ancient';
  return '';
}

function isActiveRow(row: any) {
  if (row?.status == null) return true;
  return String(row.status).trim().toLowerCase() === 'active';
}

const HISTORY_SUBCATEGORY_HI: Record<string, string> = {
  ancient: 'प्राचीन',
  medieval: 'मध्यकालीन',
  modern: 'आधुनिक',
};

async function resolveSubtopicId(subtopicSlug: string, topicId?: string): Promise<string | null> {
  let query = supabase.from('subtopics').select('id').eq('slug', subtopicSlug).eq('is_active', true);
  if (topicId && UUID_PATTERN.test(topicId)) {
    query = query.eq('topic_id', topicId);
  }
  const { data, error } = await query.maybeSingle();
  if (error || !data?.id) return null;
  return String(data.id);
}

async function fetchCatalogQuestions(
  filters: ReturnType<typeof parseQuestionListFilters>,
  responseLimit: number,
) {
  let query = supabase
    .from('questions')
    .select(PUBLIC_QUESTION_COLUMNS)
    .eq('is_active', true)
    .eq('is_verified', true)
    .order('id', { ascending: true });

  if (filters.subtopicId && UUID_PATTERN.test(filters.subtopicId)) {
    query = query.eq('subtopic_id', filters.subtopicId);
  } else if (filters.subtopicSlug) {
    const subtopicId = await resolveSubtopicId(filters.subtopicSlug, filters.topicId);
    if (!subtopicId) {
      return [];
    }
    query = query.eq('subtopic_id', subtopicId);
  }

  if (filters.topicId && UUID_PATTERN.test(filters.topicId)) {
    query = query.eq('topic_id', filters.topicId);
  }

  const { data, error } = await query.range(0, responseLimit - 1);
  if (error) {
    throw error;
  }

  return (data ?? []) as any[];
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filters = parseQuestionListFilters(url.searchParams);
    const responseLimit = resolveQuestionListLimit(url.searchParams.get('limit'));

    if (!hasRequiredQuestionListFilter(filters)) {
      return missingQuestionListFilterResponse();
    }

    if (filters.subject && !SUBJECT_TABLES[filters.subject]) {
      return NextResponse.json({ error: 'Invalid subject.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    if (filters.topic && !isSafeSearchValue(filters.topic)) {
      return NextResponse.json({ error: 'Invalid topic.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    if (filters.subtopicId || filters.subtopicSlug || filters.topicId) {
      const catalogRows = await fetchCatalogQuestions(filters, responseLimit);
      return questionListJsonResponse(catalogRows, responseLimit);
    }

    const topic = filters.topic;
    const subject = filters.subject;
    const tableName = subject && SUBJECT_TABLES[subject] ? SUBJECT_TABLES[subject] : 'questions';

    let query: any = supabase
      .from(tableName)
      .select(tableName === 'history_questions' ? HISTORY_QUESTION_COLUMNS : PUBLIC_QUESTION_COLUMNS)
      .order('id', { ascending: true });

    if (tableName === 'questions' && subject) {
      const escapedSubject = escapeForLike(subject);
      const escapedSpacedSubject = escapeForLike(subject.replace(/-/g, ' '));
      query = query.or(
        `subject->>en.ilike.%${escapedSubject}%,subject->>hi.ilike.%${escapedSubject}%,subject->>en.ilike.%${escapedSpacedSubject}%,subject->>hi.ilike.%${escapedSpacedSubject}%`,
      );
    }

    if (topic) {
      const escapedTopic = escapeForLike(topic);
      const historySubCategoryKey = subject === 'history' ? getHistorySubCategoryKey(topic) : '';
      if (historySubCategoryKey) {
        const hiValue = HISTORY_SUBCATEGORY_HI[historySubCategoryKey];
        query = query.or(
          `sub_category->>en.eq.${historySubCategoryKey},sub_category->>en.ilike.%${historySubCategoryKey}%,sub_category->>hi.ilike.%${hiValue}%`,
        );
      } else {
        query = query.or(`topic->>en.ilike.%${escapedTopic}%,topic->>hi.ilike.%${escapedTopic}%`);
      }
    }

    const fastResult: any = await query.range(0, responseLimit - 1);
    if (fastResult.error) {
      throw fastResult.error;
    }

    let data = (fastResult.data ?? []) as any[];

    if (topic) {
      const historySubCategoryKey = subject === 'history' ? getHistorySubCategoryKey(topic) : '';
      data = data.filter((row: any) => {
        if (historySubCategoryKey) {
          const subCategoryText = extractTopicText(row.sub_category).toLowerCase();
          return subCategoryText.includes(historySubCategoryKey);
        }

        const topicText = extractTopicText(row.topic) || String(row.topic_en ?? row.topic_hi ?? '').trim();
        return topicText.toLowerCase().includes(topic.toLowerCase());
      });
    }

    if (subject && tableName === 'questions') {
      data = data.filter((row: any) => {
        const subjectText = extractSubjectText(row.subject).toLowerCase();
        const normalizedSubject = subject.replace(/-/g, ' ');
        return subjectText.includes(subject) || subjectText.includes(normalizedSubject);
      });
    }

    if (!Array.isArray(data)) {
      const filteredQuestions = (topic
        ? questionsData.filter((row: any) => {
            const topicText = extractTopicText(row.topic) || String(row.topic_en ?? row.topic_hi ?? '').trim();
            return topicText.toLowerCase().includes(topic.toLowerCase());
          })
        : questionsData
      ).map((row: any, index: number) => ({
        ...row,
        id: row.id ?? String(index),
      }));

      return questionListJsonResponse(filteredQuestions, responseLimit);
    }

    const questions = (data as any[])
      .filter(isActiveRow)
      .map((row: any, index: number) => ({
        ...row,
        id: row.id ?? String(index),
      }));

    return questionListJsonResponse(questions, responseLimit);
  } catch (error) {
    console.error('Questions API error:', error);
    return NextResponse.json(
      {
        error: 'Unable to load questions.',
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
