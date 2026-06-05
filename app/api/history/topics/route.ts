import { NextResponse } from 'next/server';
import questionsData from '@/data/questions.json';
import supabase from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase.from('history_questions').select('topic');

    if (error) {
      console.warn('History topics API fallback to local JSON:', error.message);
      const topics = Array.from(
        new Set(
          questionsData
            .map((row: any) => {
              if (!row.topic) return '';
              return typeof row.topic === 'string' ? row.topic : row.topic.en || row.topic.hi || '';
            })
            .filter(Boolean)
        )
      );
      return NextResponse.json({ topics });
    }

    const topics = Array.from(
      new Set(
        (data ?? [])
          .map((row: any) => {
            if (!row.topic) {
              return '';
            }
            return typeof row.topic === 'string'
              ? row.topic
              : row.topic.en || row.topic.hi || '';
          })
          .filter(Boolean)
      )
    );

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('History topics API error:', error);
    return NextResponse.json({ error: 'DB Connection Failed' }, { status: 500 });
  }
}