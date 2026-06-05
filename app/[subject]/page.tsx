import Link from 'next/link';
import SubjectPageClient from './SubjectPageClient';
import supabase from '../../lib/supabase';
import { buildSubjectMetadata } from '@/lib/seo';
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

type TopicItem = {
  en: string;
  hi: string;
  count: number;
};

function parseTopicFields(row: any) {
  const rawTopic = row.topic;
  let topicEn = '';
  let topicHi = '';

  if (rawTopic) {
    if (typeof rawTopic === 'string') {
      const trimmed = rawTopic.trim();
      if (trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          topicEn = String(parsed.en ?? parsed.hi ?? '').trim();
          topicHi = String(parsed.hi ?? parsed.en ?? '').trim();
        } catch {
          topicEn = trimmed;
          topicHi = trimmed;
        }
      } else {
        topicEn = trimmed;
        topicHi = trimmed;
      }
    } else if (typeof rawTopic === 'object') {
      topicEn = String(rawTopic.en ?? rawTopic.hi ?? '').trim();
      topicHi = String(rawTopic.hi ?? rawTopic.en ?? '').trim();
    }
  }

  if (!topicEn && !topicHi) {
    topicEn = String(row.topic_en ?? '').trim();
    topicHi = String(row.topic_hi ?? '').trim();
  }

  return { topicEn, topicHi };
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
  const topicItems: TopicItem[] = [];

  for (const row of rows) {
    const { topicEn, topicHi } = parseTopicFields(row);
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

export async function generateMetadata({ params }: { params: { subject: string } }) {
  const subjectKey = String(params.subject).toLowerCase();
  const subject = SUBJECT_TABLES[subjectKey];

  if (!subject) {
    return {
      title: 'Subject Not Found | Questionwale',
      description: 'The requested subject does not exist.',
    };
  }

  return buildSubjectMetadata(subject.label);
}

export default async function SubjectPage({ params }: { params: { subject: string } }) {
  const subjectKey = String(params.subject).toLowerCase();
  const subjectConfig = SUBJECT_TABLES[subjectKey];

  if (!subjectConfig) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <section className="mx-auto max-w-4xl px-5 pt-12 pb-20 text-center lg:px-10">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Subject not found</p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-900">We could not find that subject</h1>
          <p className="mt-4 text-slate-600">Please return to the subjects list and choose a valid subject.</p>
          <div className="mt-8">
            <Link href="/subjects" className="inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Back to Subjects
            </Link>
          </div>
        </section>
      </main>
    );
  }

  let topics: TopicItem[] = [];
  try {
    topics = await fetchTopics(subjectConfig.table);
  } catch (error: any) {
    console.error('Error fetching topics for', subjectKey, error?.message ?? error);
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <section className="mx-auto max-w-4xl px-5 pt-12 pb-20 text-center lg:px-10">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Coming soon</p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-900">{subjectConfig.label} — Coming Soon</h1>
          <p className="mt-4 text-slate-600">We don’t have content for this subject yet. Please check back later.</p>
          <div className="mt-8">
            <Link href="/subjects" className="inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Back to Subjects
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!topics || topics.length === 0) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <section className="mx-auto max-w-4xl px-5 pt-12 pb-20 text-center lg:px-10">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Coming soon</p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-900">{subjectConfig.label} — Coming Soon</h1>
          <p className="mt-4 text-slate-600">We don’t have content for this subject yet. Please check back later.</p>
          <div className="mt-8">
            <Link href="/subjects" className="inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Back to Subjects
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return <SubjectPageClient subjectKey={subjectKey} topics={topics} />;
}
