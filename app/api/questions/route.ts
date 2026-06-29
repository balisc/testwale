import { NextResponse } from 'next/server';
import questionsData from '@/data/questions.json';
import supabase from '@/lib/supabase';

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

const PAGE_SIZE = 1000;
const FAST_QUERY_LIMIT = 500;
import { HISTORY_QUESTION_COLUMNS, PUBLIC_QUESTION_COLUMNS } from '@/lib/questionColumns';
const HISTORY_SUBCATEGORY_HI: Record<string, string> = {
  ancient: 'प्राचीन',
  medieval: 'मध्यकालीन',
  modern: 'आधुनिक',
};

async function fetchAllQuestionsFromTable(tableName: string, subject?: string) {
  const rows: any[] = [];
  let offset = 0;

  while (true) {
    let query: any = supabase
      .from(tableName)
      .select(tableName === 'history_questions' ? HISTORY_QUESTION_COLUMNS : PUBLIC_QUESTION_COLUMNS)
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (subject && tableName === 'questions') {
      query = query.eq('subject', subject);
    }

    const result: any = await query;
    if (result.error) {
      throw result.error;
    }

    const chunk = (result.data ?? []) as any[];
    if (!chunk.length) {
      break;
    }

    rows.push(...chunk);

    if (chunk.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return rows;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const topic = url.searchParams.get('topic')?.trim();
    const subject = url.searchParams.get('subject')?.trim().toLowerCase();
    const limitParam = Number.parseInt(url.searchParams.get('limit') ?? '', 10);
    const responseLimit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), FAST_QUERY_LIMIT) : FAST_QUERY_LIMIT;

    if (subject && !SUBJECT_TABLES[subject]) {
      return NextResponse.json({ error: 'Invalid subject.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    if (topic && !isSafeSearchValue(topic)) {
      return NextResponse.json({ error: 'Invalid topic.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    if (!topic && !subject) {
      return NextResponse.json({ error: 'Subject or topic is required.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    const tableName = subject && SUBJECT_TABLES[subject] ? SUBJECT_TABLES[subject] : 'questions';

    let data: any[] = [];

    if (topic || subject) {
      let query: any = supabase
        .from(tableName)
        .select(tableName === 'history_questions' ? HISTORY_QUESTION_COLUMNS : PUBLIC_QUESTION_COLUMNS)
        .order('id', { ascending: true });

      if (tableName === 'questions' && subject) {
        const escapedSubject = escapeForLike(subject);
        const escapedSpacedSubject = escapeForLike(subject.replace(/-/g, ' '));
        query = query.or(
          `subject->>en.ilike.%${escapedSubject}%,subject->>hi.ilike.%${escapedSubject}%,subject->>en.ilike.%${escapedSpacedSubject}%,subject->>hi.ilike.%${escapedSpacedSubject}%`
        );
      }

      if (topic) {
        const escapedTopic = escapeForLike(topic);
        const historySubCategoryKey = subject === 'history' ? getHistorySubCategoryKey(topic) : '';
        if (historySubCategoryKey) {
          const hiValue = HISTORY_SUBCATEGORY_HI[historySubCategoryKey];
          query = query.or(
            `sub_category->>en.eq.${historySubCategoryKey},sub_category->>en.ilike.%${historySubCategoryKey}%,sub_category->>hi.ilike.%${hiValue}%`
          );
        } else {
          query = query.or(
            `topic->>en.ilike.%${escapedTopic}%,topic->>hi.ilike.%${escapedTopic}%`
          );
        }
      }

      const fastResult: any = await query.range(0, responseLimit - 1);
      if (fastResult.error) {
        throw fastResult.error;
      }

      data = (fastResult.data ?? []) as any[];
    } else {
      data = (await fetchAllQuestionsFromTable(tableName, subject)).slice(0, responseLimit);
    }

    if (topic) {
      const historySubCategoryKey = subject === 'history' ? getHistorySubCategoryKey(topic) : '';
      const filtered = data.filter((row: any) => {
        if (historySubCategoryKey) {
          const subCategoryText = extractTopicText(row.sub_category).toLowerCase();
          return subCategoryText.includes(historySubCategoryKey);
        }

        const topicText = extractTopicText(row.topic) || String(row.topic_en ?? row.topic_hi ?? '').trim();
        return topicText.toLowerCase().includes(topic.toLowerCase());
      });

      data = filtered;
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
            const topicText =
              extractTopicText(row.topic) ||
              String(row.topic_en ?? row.topic_hi ?? '').trim();
            return topicText.toLowerCase().includes(topic.toLowerCase());
          })
        : questionsData
      ).map((row: any, index: number) => ({
        ...row,
        id: row.id ?? String(index),
      }));

      return NextResponse.json({ questions: filteredQuestions.slice(0, responseLimit) }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const questions = (data as any[])
      .filter(isActiveRow)
      .map((row: any, index: number) => ({
        ...row,
        id: row.id ?? String(index),
      }));

    return NextResponse.json({ questions: questions.slice(0, responseLimit) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Questions API error:', error);
    return NextResponse.json(
      {
        error: 'Unable to load questions.',
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
