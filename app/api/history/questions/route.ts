import { NextResponse } from 'next/server';
import questionsData from '@/data/questions.json';
import supabase from '@/lib/supabase';
import { subCategoryMatches, topicMatches } from '@/lib/topicMatching';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PAGE_SIZE = 1000;
const FAST_QUERY_LIMIT = 3000;
const MAX_TOPIC_LENGTH = 120;
const SAFE_TOPIC_PATTERN = /^[\p{L}\p{N}\s\-&().]+$/u;
import { BASE_QUESTION_COLUMNS, HISTORY_QUESTION_COLUMNS } from '@/lib/questionColumns';
const HISTORY_SUBCATEGORY_HI: Record<string, string> = {
  ancient: 'प्राचीन',
  medieval: 'मध्यकालीन',
  modern: 'आधुनिक',
};

async function fetchAllRowsFromTable(tableName: string) {
  const rows: any[] = [];
  let offset = 0;

  while (true) {
    const result: any = await supabase
      .from(tableName)
      .select(tableName === 'history_questions' ? HISTORY_QUESTION_COLUMNS : BASE_QUESTION_COLUMNS)
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

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

function isQuestionVisible(row: any) {
  const status = typeof row?.status === 'string' ? row.status.trim().toLowerCase() : '';
  return !status || status === 'active' || status === 'published';
}

function topicMatchesRow(row: any, topic: string) {
  const normalizedTarget = topic?.trim();
  if (!normalizedTarget) return false;

  const candidateValues = [row.topic, row.sub_category, row.topic_en, row.topic_hi, row.sub_category_en, row.sub_category_hi];
  for (const value of candidateValues) {
    if (topicMatches(value, normalizedTarget)) {
      return true;
    }
  }

  const subCategoryValue = row.sub_category ?? row.sub_category_en ?? row.sub_category_hi;
  return subCategoryMatches(subCategoryValue, normalizedTarget);
}

async function fetchQuestionsFromSupabase(tableName: string, subject: string, topic: string) {
  try {
    const normalizedTopic = topic.trim().toLowerCase();
    const inferredSubCategory = normalizedTopic.includes('modern')
      ? 'modern'
      : normalizedTopic.includes('medieval')
      ? 'medieval'
      : normalizedTopic.includes('ancient')
      ? 'ancient'
      : '';

    const escapedTopic = topic.replace(/([%_\\])/g, '\\$1');
    let fastQuery: any = supabase.from(tableName).select(tableName === 'history_questions' ? HISTORY_QUESTION_COLUMNS : BASE_QUESTION_COLUMNS).order('id', { ascending: true });

    if (inferredSubCategory) {
      const hiValue = HISTORY_SUBCATEGORY_HI[inferredSubCategory];
      fastQuery = fastQuery.or(
        `sub_category->>en.eq.${inferredSubCategory},sub_category->>en.ilike.%${inferredSubCategory}%,sub_category->>hi.ilike.%${hiValue}%`
      );
    } else {
      fastQuery = fastQuery.or(
        `topic->>en.ilike.%${escapedTopic}%,topic->>hi.ilike.%${escapedTopic}%`
      );
    }

    const fastResult: any = await fastQuery.range(0, FAST_QUERY_LIMIT - 1);
    if (fastResult.error) {
      throw fastResult.error;
    }

    const fastRows = ((fastResult.data ?? []) as any[])
      .filter(isQuestionVisible)
      .filter((row: any) => topicMatchesRow(row, topic));
    if (fastRows.length) {
      return fastRows;
    }

    let rows: any[] = [];

    if (tableName === 'questions') {
      rows = await fetchAllRowsFromTable(tableName);
      rows = rows.filter((row: any) => String(row.subject ?? '').toLowerCase().includes(subject));
    } else {
      rows = await fetchAllRowsFromTable(tableName);
    }

    return rows
      .filter(isQuestionVisible)
      .filter((row: any) => topicMatchesRow(row, topic));
  } catch (error) {
    console.warn(`History questions query failed for ${tableName}:`, error instanceof Error ? error.message : error);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const topic = url.searchParams.get('topic')?.trim();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    if (topic.length > MAX_TOPIC_LENGTH || !SAFE_TOPIC_PATTERN.test(topic)) {
      return NextResponse.json({ error: 'Invalid topic' }, { status: 400 });
    }

    const subject = 'history';
    let questions: any[] = [];

    for (const tableName of ['history_questions', 'questions']) {
      questions = await fetchQuestionsFromSupabase(tableName, subject, topic);
      if (questions.length) {
        break;
      }
    }

    if (!questions.length) {
      return NextResponse.json({ questions: [] });
    }

    console.log(`Fetched ${questions.length} history questions for topic: ${topic}`);
    return NextResponse.json({
      questions: questions.map((row: any, index: number) => ({ id: row.id ?? String(index), ...row })),
    });
  } catch (error) {
    console.error('History questions API error:', error);
    return NextResponse.json(
      {
        error: 'Unable to load history questions.',
      },
      { status: 500 }
    );
  }
}
