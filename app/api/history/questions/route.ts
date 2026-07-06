import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { subCategoryMatches, topicMatches } from '@/lib/topicMatching';
import { legacyColumnsForTable } from '@/lib/questionColumns';
import {
  missingQuestionListFilterResponse,
  questionListJsonResponse,
  resolveQuestionListLimit,
} from '@/lib/publicQuestionApiGuards';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MAX_TOPIC_LENGTH = 120;
const SAFE_TOPIC_PATTERN = /^[\p{L}\p{N}\s\-&().]+$/u;

const HISTORY_SUBCATEGORY_HI: Record<string, string> = {
  ancient: 'प्राचीन',
  medieval: 'मध्यकालीन',
  modern: 'आधुनिक',
};

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

async function fetchQuestionsFromSupabase(tableName: string, subject: string, topic: string, limit: number) {
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
    let fastQuery: any = supabase
      .from(tableName)
      .select(legacyColumnsForTable(tableName))
      .order('id', { ascending: true });

    if (inferredSubCategory) {
      const hiValue = HISTORY_SUBCATEGORY_HI[inferredSubCategory];
      fastQuery = fastQuery.or(
        `sub_category->>en.eq.${inferredSubCategory},sub_category->>en.ilike.%${inferredSubCategory}%,sub_category->>hi.ilike.%${hiValue}%`,
      );
    } else {
      fastQuery = fastQuery.or(`topic->>en.ilike.%${escapedTopic}%,topic->>hi.ilike.%${escapedTopic}%`);
    }

    const fastResult: any = await fastQuery.range(0, limit - 1);
    if (fastResult.error) {
      throw fastResult.error;
    }

    return ((fastResult.data ?? []) as any[])
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
    const responseLimit = resolveQuestionListLimit(url.searchParams.get('limit'));

    if (!topic) {
      return missingQuestionListFilterResponse();
    }

    if (topic.length > MAX_TOPIC_LENGTH || !SAFE_TOPIC_PATTERN.test(topic)) {
      return NextResponse.json({ error: 'Invalid topic' }, { status: 400 });
    }

    const subject = 'history';
    let questions: any[] = [];

    for (const tableName of ['history_questions', 'questions']) {
      questions = await fetchQuestionsFromSupabase(tableName, subject, topic, responseLimit);
      if (questions.length) {
        break;
      }
    }

    return questionListJsonResponse(
      questions.map((row: any, index: number) => ({ id: row.id ?? String(index), ...row })),
      responseLimit,
    );
  } catch (error) {
    console.error('History questions API error:', error);
    return NextResponse.json(
      {
        error: 'Unable to load history questions.',
      },
      { status: 500 },
    );
  }
}
