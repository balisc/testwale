import { NextResponse } from 'next/server';
import questionsData from '@/data/questions.json';
import supabase from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase.from('history_questions').select('topic');

    if (error) {
      console.warn('Topics API fallback to local JSON:', error.message);
      const uniqueTopics = Array.from(
        new Set(
          questionsData
            .map((row) => {
              const topicValue = (row as any).topic;
              if (!topicValue) return '';
              if (typeof topicValue === 'string') {
                return topicValue;
              }
              return topicValue.en || topicValue.hi || '';
            })
            .filter(Boolean)
        )
      ).map((topic) => ({ en: topic, hi: topic })) as Array<{ en: string; hi: string }>;

      return NextResponse.json({ topics: uniqueTopics });
    }

    const uniqueTopicStrings = Array.from(
      new Set(
        (data ?? [])
          .map((row: any) => {
            const topicValue = row.topic;
            if (!topicValue) return '';
            if (typeof topicValue === 'string') return topicValue;
            return topicValue.en || topicValue.hi || '';
          })
          .filter(Boolean)
      )
    );

    const uniqueTopics = uniqueTopicStrings.map((topic) => ({ en: topic, hi: topic }));

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
