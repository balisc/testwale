import { NextResponse } from 'next/server';
import questionsData from '@/data/questions.json';
import { SUBJECT_TABLES, getActiveQuestionCount, fetchActiveTopicCandidates } from '@/lib/questionCounts';

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
      let tableCount = 0;
      let topicData: any[] = [];

      try {
        tableCount = await getActiveQuestionCount(table);
      } catch (error: any) {
        const message = String(error?.message ?? '');
        const notFound = /Could not find the table/i.test(message) || /relation ".*" does not exist/i.test(message);
        if (notFound) {
          missingTableCount += 1;
          continue;
        }
        throw error;
      }

      if (tableCount > 0) {
        totalSubjects += 1;
      }
      totalQuestions += tableCount;

      try {
        topicData = await fetchActiveTopicCandidates(table);
      } catch (error) {
        topicData = [];
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

    let totalQuestions = 0;
    const fallbackSubjects = new Set<string>();
    const uniqueTopics = new Set<string>();

    const normalizeTopic = (value: string) =>
      value
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();

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

    return NextResponse.json(
      {
        questions: totalQuestions,
        subjects: fallbackSubjects.size,
        topics: uniqueTopics.size,
        fallback: true,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
