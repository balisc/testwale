import { NextResponse } from 'next/server';
import questionsData from '@/data/questions.json';
import { getCatalogSiteStats } from '@/lib/catalogStats';
import { slugifySubject } from '@/lib/slugGenerator';

export const revalidate = 300;
const PUBLIC_CACHE = 'public, s-maxage=300, stale-while-revalidate=600';

function getSubjectText(subject: unknown) {
  if (!subject) return '';
  if (typeof subject === 'string') return subject.trim();
  if (typeof subject === 'object') {
    return String((subject as { en?: string; hi?: string }).en ?? (subject as { hi?: string }).hi ?? '').trim();
  }
  return '';
}

function normalizeSubjectKey(subject: unknown) {
  const raw = slugifySubject(getSubjectText(subject));
  if (!raw) return '';
  return raw.startsWith('indian-') ? raw.replace(/^indian-/, '') : raw;
}

function extractTopicText(row: {
  topic?: unknown;
  topic_en?: unknown;
  topic_hi?: unknown;
}) {
  if (!row) return '';
  if (typeof row.topic === 'string' && row.topic.trim()) return row.topic.trim();
  if (row.topic && typeof row.topic === 'object') {
    const topic = row.topic as { en?: string; hi?: string };
    return String(topic.en ?? topic.hi ?? '').trim();
  }
  if (typeof row.topic_en === 'string' && row.topic_en.trim()) return row.topic_en.trim();
  if (typeof row.topic_hi === 'string' && row.topic_hi.trim()) return row.topic_hi.trim();
  return '';
}

function isActiveRow(row: { status?: unknown }) {
  if (row?.status == null) return true;
  return String(row.status).trim().toLowerCase() === 'active';
}

function fallbackStats() {
  const activeRows = (questionsData as Array<{
    subject?: unknown;
    topic?: unknown;
    topic_en?: unknown;
    topic_hi?: unknown;
    status?: unknown;
  }>).filter(isActiveRow);

  const subjects = new Set<string>();
  const topics = new Set<string>();

  for (const row of activeRows) {
    const subjectKey = normalizeSubjectKey(row.subject);
    if (subjectKey) subjects.add(subjectKey);

    const topicText = extractTopicText(row);
    if (topicText) topics.add(topicText.toLowerCase());
  }

  return {
    questions: activeRows.length,
    subjects: subjects.size,
    topics: topics.size,
  };
}

export async function GET() {
  const catalogStats = await getCatalogSiteStats();
  if (catalogStats) {
    return NextResponse.json(catalogStats, { headers: { 'Cache-Control': PUBLIC_CACHE } });
  }

  return NextResponse.json(fallbackStats(), { headers: { 'Cache-Control': PUBLIC_CACHE } });
}
