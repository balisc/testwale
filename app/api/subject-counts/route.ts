import { NextResponse } from 'next/server';
import supabase from '../../../lib/supabase';

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

export async function GET() {
  const counts: Record<string, number> = {};
  for (const [subject, table] of Object.entries(SUBJECT_TABLES)) {
    const result = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (result.error) {
      return NextResponse.json(
        { error: `Unable to load counts for ${subject}: ${result.error.message}` },
        { status: 500 }
      );
    }
    counts[subject] = result.count ?? 0;
  }

  return NextResponse.json(counts, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
