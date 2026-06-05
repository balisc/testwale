import { NextResponse } from 'next/server';
import questionsData from '@/data/questions.json';
import { SUBJECT_TABLES, getActiveQuestionCount } from '@/lib/questionCounts';

export const dynamic = 'force-dynamic';

export async function GET() {
  const counts: Record<string, number> = {};
  let missingTableCount = 0;

  for (const [subject, table] of Object.entries(SUBJECT_TABLES)) {
    try {
      counts[subject] = await getActiveQuestionCount(table);
    } catch (error: any) {
      const message = String(error?.message ?? '');
      const notFound = /Could not find the table/i.test(message) || /relation ".*" does not exist/i.test(message);
      if (notFound) {
        missingTableCount += 1;
        counts[subject] = 0;
        continue;
      }

      console.warn(`Subject counts fallback for ${table}:`, message);
      missingTableCount += 1;
      counts[subject] = 0;
      continue;
    }
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
