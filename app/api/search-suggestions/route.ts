import { NextResponse } from 'next/server';
import questionsData from '@/data/questions.json';
import { getCatalogSearchSuggestions } from '@/lib/catalogStats';
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
  if (!row) return { topicEn: '', topicHi: '' };

  if (typeof row.topic === 'string' && row.topic.trim()) {
    return { topicEn: row.topic.trim(), topicHi: '' };
  }

  if (row.topic && typeof row.topic === 'object') {
    const topic = row.topic as { en?: string; hi?: string };
    return {
      topicEn: String(topic.en ?? '').trim(),
      topicHi: String(topic.hi ?? '').trim(),
    };
  }

  return {
    topicEn: String(row.topic_en ?? '').trim(),
    topicHi: String(row.topic_hi ?? '').trim(),
  };
}

function isActiveRow(row: { status?: unknown }) {
  if (row?.status == null) return true;
  return String(row.status).trim().toLowerCase() === 'active';
}

function fallbackSuggestionsFromJson() {
  const suggestions: Array<{ subjectKey: string; topicEn: string; topicHi: string }> = [];
  const seenTopicKeys = new Set<string>();

  for (const row of questionsData as Array<{
    subject?: unknown;
    topic?: unknown;
    topic_en?: unknown;
    topic_hi?: unknown;
    status?: unknown;
  }>) {
    if (!isActiveRow(row)) continue;
    const subjectKey = normalizeSubjectKey(row.subject);
    if (!subjectKey) continue;

    const { topicEn, topicHi } = extractTopicText(row);
    if (!topicEn && !topicHi) continue;

    const key = `${subjectKey}||${topicEn.toLowerCase()}||${topicHi.toLowerCase()}`;
    if (seenTopicKeys.has(key)) continue;
    seenTopicKeys.add(key);

    suggestions.push({ subjectKey, topicEn, topicHi });
    if (suggestions.length >= 40) break;
  }

  return suggestions;
}

export async function GET() {
  const catalogSuggestions = await getCatalogSearchSuggestions(40);
  if (catalogSuggestions.length > 0) {
    return NextResponse.json(
      { suggestions: catalogSuggestions },
      { headers: { 'Cache-Control': PUBLIC_CACHE } },
    );
  }

  const suggestions = fallbackSuggestionsFromJson();
  return NextResponse.json({ suggestions }, { headers: { 'Cache-Control': PUBLIC_CACHE } });
}
