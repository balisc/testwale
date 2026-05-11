import { NextResponse } from 'next/server';
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

    const { data, error } = await supabase
      .from('history_questions')
      .select('*')
      .or(`topic->>en.ilike.%${escapeForLike(topic)}%,topic->>hi.ilike.%${escapeForLike(topic)}%`);

    if (error) {
      throw new Error(error.message);
    }

    const questions = (data ?? []).map((row, index) => ({
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
