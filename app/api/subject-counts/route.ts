import { NextResponse } from 'next/server';
import supabase from '../../../lib/supabase';
import questionsData from '@/data/questions.json';

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
  let missingTableCount = 0;

  for (const [subject, table] of Object.entries(SUBJECT_TABLES)) {
    // Use an explicit id-count query to get a reliable row count from Supabase/Postgres.
    const result = await supabase.from(table).select('id', { count: 'exact' });
    if (result.error) {
      // If table doesn't exist, skip it instead of failing the entire request.
      const notFound = /Could not find the table/i.test(result.error.message) || /relation " .* " does not exist/i.test(result.error.message) || /relation ".*" does not exist/i.test(result.error.message);
      if (notFound) {
        missingTableCount += 1;
        counts[subject] = 0;
        continue;
      }

      return NextResponse.json(
        { error: `Unable to load counts for ${subject}: ${result.error.message}` },
        { status: 500 }
      );
    }

    // Supabase returns `count` when count: 'exact' is requested. Fall back to data length if absent.
    counts[subject] = typeof result.count === 'number' ? result.count : (result.data?.length ?? 0);
  }

  if (missingTableCount === Object.keys(SUBJECT_TABLES).length) {
    const fallbackCounts: Record<string, number> = {};
    for (const question of questionsData) {
      const subject = String(question.subject || '').trim().toLowerCase();
      if (!subject) continue;
      fallbackCounts[subject] = (fallbackCounts[subject] ?? 0) + 1;
    }
    return NextResponse.json(fallbackCounts, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }

  return NextResponse.json(counts, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
