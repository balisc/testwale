import { NextResponse } from 'next/server';
import questionsData from '@/data/questions.json';
import supabase from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function escapeForLike(value: string) {
  return value.replace(/([%_\\])/g, '\\$1');
}

function extractTopicText(topic: unknown) {
  if (!topic) return '';
  if (typeof topic === 'string') return topic.trim();
  if (typeof topic === 'object') {
    return String((topic as any).en ?? (topic as any).hi ?? '').trim();
  }
  return '';
}

function isActiveRow(row: any) {
  if (row?.status == null) return true;
  return String(row.status).trim().toLowerCase() === 'active';
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const topic = url.searchParams.get('topic')?.trim();

    const query = supabase.from('questions').select('*').eq('status', 'active');
    let result: any;

    if (topic) {
      const filter = [
        `topic->>en.ilike.%${escapeForLike(topic)}%`,
        `topic->>hi.ilike.%${escapeForLike(topic)}%`,
      ].join(',');

      result = await query.or(filter);
      if (result.error) {
        console.warn('Questions API filter fallback:', result.error.message);
      }
    } else {
      result = await query;
    }

    let data = result?.data;

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

      return NextResponse.json({ questions: filteredQuestions }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const questions = (data as any[])
      .filter(isActiveRow)
      .map((row: any, index: number) => ({
        ...row,
        id: row.id ?? String(index),
      }));

    return NextResponse.json({ questions }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Questions API error:', error);
    return NextResponse.json(
      {
        error: 'Supabase query failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
