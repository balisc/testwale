import { NextResponse } from 'next/server';
import questionsData from '@/data/questions.json';
import supabase from '@/lib/supabase';
import { slugifySubject } from '@/lib/slugGenerator';

export const dynamic = 'force-dynamic';

const SUBJECT_KEYS = [
  'history',
  'science',
  'polity',
  'economics',
  'geography',
  'general-knowledge',
  'math',
  'current-affairs',
  'reasoning',
];

const SUBJECT_LABELS: Record<string, string> = {
  history: 'Indian History',
  science: 'Indian Science',
  polity: 'Indian Polity',
  economics: 'Indian Economics',
  geography: 'Indian Geography',
  'general-knowledge': 'General Knowledge',
  math: 'Math',
  'current-affairs': 'Current Affairs',
  reasoning: 'Reasoning',
};

function getSubjectText(subject: unknown) {
  if (!subject) return '';
  if (typeof subject === 'string') return subject.trim();
  if (typeof subject === 'object') {
    return String((subject as any).en ?? (subject as any).hi ?? '').trim();
  }
  return '';
}

function normalizeSubjectKey(subject: unknown) {
  const raw = slugifySubject(getSubjectText(subject));
  if (!raw) return '';
  return raw.startsWith('indian-') ? raw.replace(/^indian-/, '') : raw;
}

function isActiveRow(row: any) {
  if (row?.status == null) return true;
  return String(row.status).trim().toLowerCase() === 'active';
}

export async function GET() {
  const counts: Record<string, number> = Object.fromEntries(SUBJECT_KEYS.map((subjectKey) => [subjectKey, 0]));

  try {
    const countResults = await Promise.all(
      SUBJECT_KEYS.map(async (subjectKey) => {
        const subjectLabel = SUBJECT_LABELS[subjectKey];
        if (!subjectLabel) return 0;

        const result = await supabase
          .from('questions')
          .select('id', { head: false, count: 'exact' })
          .filter('subject->>en', 'eq', subjectLabel)
          .eq('status', 'active');

        if (result.error) {
          console.warn('Subject count query failed for', subjectKey, result.error.message);
          return 0;
        }

        return typeof result.count === 'number' ? result.count : 0;
      })
    );

    countResults.forEach((value, index) => {
      counts[SUBJECT_KEYS[index]] = value;
    });

    return NextResponse.json(counts, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Subject counts API error:', error?.message ?? error);

    const fallbackCounts: Record<string, number> = Object.fromEntries(SUBJECT_KEYS.map((subjectKey) => [subjectKey, 0]));

    for (const question of questionsData as any[]) {
      if (!isActiveRow(question)) continue;
      const subjectKey = normalizeSubjectKey(question.subject);
      if (subjectKey && subjectKey in fallbackCounts) {
        fallbackCounts[subjectKey] += 1;
      }
    }

    return NextResponse.json(fallbackCounts, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
}
