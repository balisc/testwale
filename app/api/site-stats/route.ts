import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

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

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let totalQuestions = 0;
    let totalSubjects = 0;
    const uniqueTopics = new Set<string>();

    const normalizeTopic = (value: string) =>
      value
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();

    for (const [subject, table] of Object.entries(SUBJECT_TABLES)) {
      const { data, error } = await supabase.from(table).select('topic');

      if (error) {
        const notFound = /Could not find the table/i.test(error.message) || /relation ".*" does not exist/i.test(error.message);
        if (notFound) {
          console.warn(`Site stats skipped missing table: ${table}`);
          continue;
        }
        throw new Error(`Failed to query ${table}: ${error.message}`);
      }

      if ((data?.length ?? 0) > 0) {
        totalSubjects += 1;
      }

      totalQuestions += data?.length ?? 0;

      for (const row of data ?? []) {
        const topicValue = row.topic;
        const topicEn = typeof topicValue === 'string' ? topicValue : topicValue?.en ?? '';
        const topicHi = typeof topicValue === 'string' ? '' : topicValue?.hi ?? '';

        const canonicalTopic = normalizeTopic(topicEn || topicHi);
        if (canonicalTopic) {
          uniqueTopics.add(canonicalTopic);
        }
      }
    }

    return NextResponse.json(
      {
        questions: totalQuestions,
        subjects: totalSubjects,
        topics: uniqueTopics.size,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Site stats API error:', error);
    return NextResponse.json(
      {
        error: 'Unable to load site stats from the database.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
