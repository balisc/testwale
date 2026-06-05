import { NextResponse } from 'next/server';
import questionsData from '@/data/questions.json';
import supabase from '@/lib/supabase';
import { slugifySubject } from '@/lib/slugGenerator';

export const dynamic = 'force-dynamic';

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

function isUnknownColumnError(error: any) {
  const message = String(error?.message ?? '').replace(/\s+/g, ' ');
  return /column .* does not exist|invalid input syntax for type boolean|operator does not exist|Could not find the table/i.test(message);
}

function extractTopicText(row: any) {
  if (!row) return '';
  if (typeof row.topic === 'string' && row.topic.trim()) return row.topic.trim();
  if (row.topic && typeof row.topic === 'object') {
    return String(row.topic.en ?? row.topic.hi ?? '').trim();
  }
  if (typeof row.topic_en === 'string' && row.topic_en.trim()) return row.topic_en.trim();
  if (typeof row.topic_hi === 'string' && row.topic_hi.trim()) return row.topic_hi.trim();
  return '';
}

function isActiveRow(row: any) {
  if (row?.status == null) return true;
  return String(row.status).trim().toLowerCase() === 'active';
}

export async function GET() {
  const subjects = new Set<string>();
  const topics = new Set<string>();
  let questions = 0;

  try {
    const candidateColumns = [
      'subject, topic, status',
      'subject, topic_en, topic_hi, status',
      'subject, topic, topic_en, topic_hi, status',
      'subject, topic',
      'subject, topic_en, topic_hi',
      'subject, topic, topic_en, topic_hi',
    ];

    let rows: any[] = [];
    let result: any = null;

    for (const selectColumns of candidateColumns) {
      result = await supabase
        .from('questions')
        .select(selectColumns, { head: false, count: 'exact' })
        .eq('status', 'active')
        .range(0, 1999);

      if (result.error) {
        if (isUnknownColumnError(result.error)) {
          continue;
        }

        console.warn('Site stats query active filter failed for columns', selectColumns, result.error.message);
        result = await supabase.from('questions').select(selectColumns, { head: false, count: 'exact' }).range(0, 1999);
        if (result.error) {
          if (isUnknownColumnError(result.error)) {
            continue;
          }

          throw result.error;
        }
      }

      rows = Array.isArray(result.data) ? result.data : [];
      questions = typeof result.count === 'number' ? result.count : 0;
      break;
    }

    if (!rows.length && result?.error) {
      throw result.error;
    }

    for (const row of rows as any[]) {
      if (!isActiveRow(row)) continue;

      const subjectKey = normalizeSubjectKey(row.subject);
      if (subjectKey) {
        subjects.add(subjectKey);
      }

      const topicText = extractTopicText(row);
      if (topicText) {
        topics.add(topicText.toLowerCase());
      }
    }

    return NextResponse.json(
      {
        questions,
        subjects: subjects.size,
        topics: topics.size,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error: any) {
    console.error('Site stats API error:', error?.message ?? error);

    const activeRows = (questionsData as any[]).filter(isActiveRow);
    const fallbackSubjects = new Set<string>();
    const fallbackTopics = new Set<string>();

    for (const row of activeRows) {
      const subjectKey = normalizeSubjectKey(row.subject);
      if (subjectKey) {
        fallbackSubjects.add(subjectKey);
      }

      const topicText = extractTopicText(row);
      if (topicText) {
        fallbackTopics.add(topicText.toLowerCase());
      }
    }

    return NextResponse.json(
      {
        questions: activeRows.length,
        subjects: fallbackSubjects.size,
        topics: fallbackTopics.size,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
