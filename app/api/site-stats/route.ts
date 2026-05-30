import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
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

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let totalQuestions = 0;
    let totalSubjects = 0;
    let missingTableCount = 0;
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
          missingTableCount += 1;
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

    if (missingTableCount === Object.keys(SUBJECT_TABLES).length) {
      const fallbackSubjects = new Set<string>();
      for (const question of questionsData) {
        totalQuestions += 1;
        fallbackSubjects.add(String(question.subject || '').trim().toLowerCase());

        const topicValue = question.topic as any;
        const topicEn = String(
          typeof topicValue === 'object' && topicValue !== null
            ? topicValue.en ?? question.topic ?? ''
            : topicValue ?? ''
        ).trim();
        const topicHi = String(
          typeof topicValue === 'object' && topicValue !== null
            ? topicValue.hi ?? ''
            : ''
        ).trim();
        const canonicalTopic = normalizeTopic(topicEn || topicHi);
        if (canonicalTopic) {
          uniqueTopics.add(canonicalTopic);
        }
      }
      totalSubjects = fallbackSubjects.size;
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
