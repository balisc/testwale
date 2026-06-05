import { NextResponse } from 'next/server';
import questionsData from '@/data/questions.json';
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
    const suggestions: Array<{ subjectKey: string; topicEn: string; topicHi: string }> = [];
    const seenTopicKeys = new Set<string>();

    for (const [subjectKey, table] of Object.entries(SUBJECT_TABLES)) {
      const { data, error } = await supabase.from(table).select('topic');
      if (error) {
        console.warn(`Search suggestions fallback for ${table}:`, error.message);
        continue;
      }

      for (const row of data ?? []) {
        const topicValue = (row as any).topic;
        const topicEn = String(
          typeof topicValue === 'string'
            ? topicValue
            : topicValue?.en ?? (row as any).topic ?? ''
        ).trim();
        const topicHi = String(
          typeof topicValue === 'string'
            ? ''
            : topicValue?.hi ?? ''
        ).trim();

        if (!topicEn && !topicHi) continue;

        const topicKey = `${subjectKey}||${topicEn.toLowerCase()}||${topicHi.toLowerCase()}`;
        if (seenTopicKeys.has(topicKey)) continue;
        seenTopicKeys.add(topicKey);

        suggestions.push({ subjectKey, topicEn, topicHi });
      }
    }

    if (suggestions.length === 0) {
      const fallbackSubjects = new Set<string>();
      for (const question of questionsData) {
        const subjectKey = String((question as any).subject || '').trim().toLowerCase();
        if (!subjectKey) continue;

        const topicValue = (question as any).topic;
        const topicEn = String(
          typeof topicValue === 'string' ? topicValue : topicValue?.en ?? (question as any).topic ?? ''
        ).trim();
        const topicHi = String(
          typeof topicValue === 'string' ? '' : topicValue?.hi ?? ''
        ).trim();
        if (!topicEn && !topicHi) continue;

        const topicKey = `${subjectKey}||${topicEn.toLowerCase()}||${topicHi.toLowerCase()}`;
        if (fallbackSubjects.has(topicKey)) continue;
        fallbackSubjects.add(topicKey);
        suggestions.push({ subjectKey, topicEn, topicHi });
      }
    }

    return NextResponse.json({ suggestions }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Search suggestions API error:', error);
    return NextResponse.json({ error: 'Unable to load search suggestions' }, { status: 500 });
  }
}
