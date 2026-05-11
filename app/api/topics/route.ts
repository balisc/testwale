import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase.from('history_questions').select('topic');

    if (error) {
      throw new Error(error.message);
    }

    // Extract unique topics
    const uniqueTopics = Array.from(
      new Set(
        (data ?? [])
          .map((row) => row.topic)
          .filter((topic) => topic && (topic.en || topic.hi))
      )
    ) as Array<{ en: string; hi: string }>;

    console.log(`Fetched ${uniqueTopics.length} unique topics`);
    return NextResponse.json({ topics: uniqueTopics });
  } catch (error) {
    console.error('Topics API error:', error);
    return NextResponse.json(
      {
        error: 'Supabase query failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
