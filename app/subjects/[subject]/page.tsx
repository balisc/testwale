import { redirect } from 'next/navigation';
import supabase from '../../../lib/supabase';
import { slugifySubject } from '@/lib/slugGenerator';
import { buildTopicCountKey, fetchExactTopicCounts } from '@/lib/topicCounts';

const SUBJECT_TABLES: Record<string, { table: string; label: string }> = {
  history: { table: 'history_questions', label: 'History' },
  science: { table: 'science_questions', label: 'Science' },
  polity: { table: 'polity_questions', label: 'Polity' },
  economics: { table: 'economics_questions', label: 'Economics' },
  geography: { table: 'geography_questions', label: 'Geography' },
  'general-knowledge': { table: 'general_knowledge_questions', label: 'General Knowledge' },
  math: { table: 'math_questions', label: 'Math' },
  'current-affairs': { table: 'current_affairs_questions', label: 'Current Affairs' },
  reasoning: { table: 'reasoning_questions', label: 'Reasoning' },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SearchParams = {
  topic?: string | string[];
  topicKey?: string | string[];
  slug?: string | string[];
  v?: string | string[];
};

function slugifyTopic(topic: string) {
  return encodeURIComponent(slugifySubject(topic));
}

async function fetchTopics(tableName: string) {
  const { data, error } = await supabase.from(tableName).select('*').limit('all');
  if (error) {
    console.error('❌ SUPABASE ERROR:', error.message);
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<{
    topic?: { en?: string; hi?: string } | null;
    topic_en?: string | null;
    topic_hi?: string | null;
  }>;

  const seen = new Set<string>();
  const topicItems: Array<{ en: string; hi: string; count: number }> = [];

  for (const row of rows) {
    const topicEn = String(row.topic?.en ?? row.topic_en ?? '').trim();
    const topicHi = String(row.topic?.hi ?? row.topic_hi ?? '').trim();
    const key = `${topicEn}||${topicHi}`;
    if (!topicEn && !topicHi) continue;
    if (seen.has(key)) continue;

    seen.add(key);
    topicItems.push({ en: topicEn, hi: topicHi, count: 0 });
  }

  const exactCounts = await fetchExactTopicCounts(tableName, topicItems);

  return topicItems.map((topic) => ({
    ...topic,
    count: exactCounts.get(buildTopicCountKey(topic)) ?? 0,
  }));
}

export default async function LegacySubjectPage({ params, searchParams }: { params: { subject: string }; searchParams: SearchParams }) {
  const subjectKey = String(params.subject).toLowerCase();
  const subjectConfig = SUBJECT_TABLES[subjectKey];

  if (!subjectConfig) {
    return redirect('/subjects');
  }

  const topicKeyParam = Array.isArray(searchParams.topicKey) ? searchParams.topicKey[0] : searchParams.topicKey;
  const topicParam = Array.isArray(searchParams.topic) ? searchParams.topic[0] : searchParams.topic;
  const topicValue = String(topicParam ?? '').trim();

  if (topicKeyParam) {
    const idx = Number.parseInt(String(topicKeyParam), 10);
    if (!Number.isFinite(idx) || idx < 0) {
      return redirect(`/${subjectKey}`);
    }

    let topicsList: Array<{ en: string; hi: string }> = [];
    try {
      topicsList = await fetchTopics(subjectConfig.table);
    } catch (err) {
      return redirect(`/${subjectKey}`);
    }

    const topicItem = topicsList[idx];
    const decodedTopic = topicItem ? (topicItem.en || topicItem.hi || '').trim() : '';
    if (decodedTopic) {
      return redirect(`/${subjectKey}/topics/${slugifyTopic(decodedTopic)}`);
    }

    return redirect(`/${subjectKey}`);
  }

  if (topicValue) {
    const slugParam = Array.isArray(searchParams.slug) ? searchParams.slug[0] : searchParams.slug;
    const slugValue = slugParam ? String(slugParam).trim() : '';
    if (slugValue) {
      return redirect(`/${subjectKey}/${encodeURIComponent(slugValue)}`);
    }

    return redirect(`/${subjectKey}/topics/${slugifyTopic(topicValue)}`);
  }

  return redirect(`/${subjectKey}`);
}
