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

function extractTopicText(row: any) {
  if (!row) return { topicEn: '', topicHi: '' };

  if (typeof row.topic === 'string' && row.topic.trim()) {
    return { topicEn: row.topic.trim(), topicHi: '' };
  }

  if (row.topic && typeof row.topic === 'object') {
    return {
      topicEn: String(row.topic.en ?? '').trim(),
      topicHi: String(row.topic.hi ?? '').trim(),
    };
  }

  return {
    topicEn: String(row.topic_en ?? '').trim(),
    topicHi: String(row.topic_hi ?? '').trim(),
  };
}

function isActiveRow(row: any) {
  if (row?.status == null) return true;
  return String(row.status).trim().toLowerCase() === 'active';
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('subject, topic, status', { head: false })
      .eq('status', 'active')
      .limit(20);

    if (error) {
      throw error;
    }

    if (!Array.isArray(data) || data.length === 0) {
      console.log('no data found');
      return NextResponse.json({ suggestions: [] }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const suggestions: Array<{ subjectKey: string; topicEn: string; topicHi: string }> = [];
    const seenTopicKeys = new Set<string>();

    for (const row of data as any[]) {
      if (!isActiveRow(row)) continue;

      const subjectKey = normalizeSubjectKey(row.subject);
      if (!subjectKey) continue;

      const { topicEn, topicHi } = extractTopicText(row);
      if (!topicEn && !topicHi) continue;

      const key = `${subjectKey}||${topicEn.toLowerCase()}||${topicHi.toLowerCase()}`;
      if (seenTopicKeys.has(key)) continue;
      seenTopicKeys.add(key);

      suggestions.push({ subjectKey, topicEn, topicHi });
    }

    return NextResponse.json({ suggestions }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    console.error('Search suggestions API error:', error?.message ?? error);

    const suggestions: Array<{ subjectKey: string; topicEn: string; topicHi: string }> = [];
    const seenTopicKeys = new Set<string>();

    for (const row of questionsData as any[]) {
      if (!isActiveRow(row)) continue;
      const subjectKey = normalizeSubjectKey(row.subject);
      if (!subjectKey) continue;

      const topicText = extractTopicText(row);
      const topicEn = topicText.topicEn;
      const topicHi = topicText.topicHi;
      if (!topicEn && !topicHi) continue;

      const key = `${subjectKey}||${topicEn.toLowerCase()}||${topicHi.toLowerCase()}`;
      if (seenTopicKeys.has(key)) continue;
      seenTopicKeys.add(key);

      suggestions.push({ subjectKey, topicEn, topicHi });
      if (suggestions.length >= 10) break;
    }

    return NextResponse.json({ suggestions }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
