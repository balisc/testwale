import { NextResponse } from 'next/server';
import questionsData from '@/data/questions.json';
import supabase from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function extractTopicText(rawTopic: unknown): string {
  if (rawTopic === null || rawTopic === undefined) {
    return '';
  }

  let text = '';
  if (typeof rawTopic === 'string') {
    text = rawTopic.trim();
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed)) {
          text = parsed.map((item) => String(item).trim()).join(' ');
        } else {
          text = String((parsed as any).en ?? (parsed as any).hi ?? Object.values(parsed).join(' ')).trim();
        }
      }
    } catch {
      // Keep raw text.
    }
  } else if (Array.isArray(rawTopic)) {
    text = rawTopic.map((item) => String(item).trim()).join(' ');
  } else if (typeof rawTopic === 'object') {
    text = String((rawTopic as any).en ?? (rawTopic as any).hi ?? Object.values(rawTopic).join(' ')).trim();
  } else {
    text = String(rawTopic).trim();
  }

  return text.trim();
}

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
            return extractTopicText(row.topic);
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
        error: 'Unable to load topics.',
      },
      { status: 500 }
    );
  }
}
