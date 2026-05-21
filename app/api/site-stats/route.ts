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
      // First get an exact row count using id-count so we don't rely on potentially-truncated data arrays.
      const countResult = await supabase.from(table).select('id', { count: 'exact' });

      if (countResult.error) {
        const notFound = /Could not find the table/i.test(countResult.error.message) || /relation ".*" does not exist/i.test(countResult.error.message);
        if (notFound) {
          console.warn(`Site stats skipped missing table: ${table}`);
          continue;
        }
        throw new Error(`Failed to count rows for ${table}: ${countResult.error.message}`);
      }

      const tableCount = typeof countResult.count === 'number' ? countResult.count : (countResult.data?.length ?? 0);
      if (tableCount > 0) {
        totalSubjects += 1;
      }
      totalQuestions += tableCount;

      // Now fetch topics for unique topic calculation (select possible topic fields).
      const { data: topicData, error: topicError } = await supabase
        .from(table)
        .select('*');
      if (topicError) {
        console.warn(`Site stats topic fetch skipped for ${table}: ${topicError.message}`);
        continue;
      }

      for (const row of topicData ?? []) {
        const topicValue = row.topic;
        const topicEn = String(topicValue?.en ?? row.topic_en ?? topicValue ?? '').trim();
        const topicHi = String(topicValue?.hi ?? row.topic_hi ?? '').trim();

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
