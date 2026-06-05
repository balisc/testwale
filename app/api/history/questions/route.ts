import { NextResponse } from 'next/server';
import questionsData from '@/data/questions.json';
import supabase from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function escapeForLike(value: string) {
  return value.replace(/([%_])/g, '\\$1');
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const topic = url.searchParams.get('topic')?.trim();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const escapedTopic = escapeForLike(topic);
    const { data, error } = await supabase
      .from('history_questions')
      .select('*')
      .or(`topic->>en.ilike.%${escapedTopic}%,topic->>hi.ilike.%${escapedTopic}%,topic.ilike.%${escapedTopic}%`);

    if (error) {
      console.warn('History questions API fallback to local JSON:', error.message);
      const filteredQuestions = questionsData
        .filter((row: any) => {
          const topicText = typeof row.topic === 'string' ? row.topic : row.topic?.en || row.topic?.hi || '';
          return topicText.toLowerCase().includes(topic.toLowerCase());
        })
        .map((row: any, index) => ({ id: row.id ?? String(index), ...row }));

      return NextResponse.json({ questions: filteredQuestions });
    }

    const questions = (data ?? []).map((row: any, index: number) => ({
      id: row.id ?? String(index),
      ...row,
    }));

    console.log(`Fetched ${questions.length} history questions for topic: ${topic}`);
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('History questions API error:', error);
    return NextResponse.json(
      {
        error: 'Supabase query failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
