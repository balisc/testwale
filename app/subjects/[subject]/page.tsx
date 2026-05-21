import Link from 'next/link';
import Navbar from '../../components/Navbar';
import SubjectTopicsClient from './SubjectTopicsClient';
import supabase from '../../../lib/supabase';

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

async function fetchTopics(tableName: string, subjectKey: string) {
  const normalizedSubjectKey = String(subjectKey).trim().toLowerCase();
  console.log('--- TERMINAL DEBUG: Fetching topics for subject ---', normalizedSubjectKey, 'from table:', tableName);

  let data: any = null;
  let error: any = null;

  // Fetch all columns and normalize topic/subject fields in JS to support multiple table schemas.
  ({ data, error } = await supabase
    .from(tableName)
    .select('*')
    .not('topic', 'is', null)
    .order('id', { ascending: true }));

  if (error) {
    console.error('❌ SUPABASE ERROR:', error.message);
    console.error('Full Error Object:', error);
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<{
    id: string;
    topic?: { en?: string; hi?: string } | null;
    topic_en?: string | null;
    topic_hi?: string | null;
    subject?: { en?: string; hi?: string } | null;
    subject_en?: string | null;
    subject_hi?: string | null;
  }>;

  console.log('--- TERMINAL DEBUG: Fetched rows count ---', rows.length);
  if (rows.length > 0) {
    console.log('--- TERMINAL DEBUG: First row sample ---', JSON.stringify(rows[0], null, 2).slice(0, 200));
  }

  // Each table is already subject-specific (e.g., polity_questions contains only polity data)
  // So we use all rows without filtering by subject
  const filteredRows = rows;
  console.log('--- TERMINAL DEBUG: Using all rows from subject-specific table ---', filteredRows.length);

  const seen = new Set<string>();
  const topicCounts = new Map<string, number>();
  const topicItems: TopicItem[] = [];

  for (const row of filteredRows) {
    const topicEn = String(row.topic?.en ?? row.topic_en ?? row.topic ?? '').trim();
    const topicHi = String(row.topic?.hi ?? row.topic_hi ?? '').trim();
    const key = `${topicEn}||${topicHi}`;

    if (!topicEn && !topicHi) continue;

    topicCounts.set(key, (topicCounts.get(key) ?? 0) + 1);

    if (seen.has(key)) continue;
    seen.add(key);

    topicItems.push({ en: topicEn, hi: topicHi, count: 0 });
  }

  const uniqueTopics = topicItems.map((topic) => {
    const key = `${topic.en}||${topic.hi}`;
    return {
      ...topic,
      count: topicCounts.get(key) ?? 0,
    };
  });

  console.log('--- TERMINAL DEBUG: Unique topics count ---', uniqueTopics.length);
  return uniqueTopics;
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

  return {
    title: `${subject.label} Topics | Questionwale`,
    description: `Browse ${subject.label} topics and start practicing on Questionwale.`,
  };
}

export default async function SubjectTopicPage({ params }: { params: { subject: string } }) {
  const subjectKey = String(params.subject).toLowerCase();
  const subjectConfig = SUBJECT_TABLES[subjectKey];

  if (!subjectConfig) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />
        <section className="mx-auto max-w-4xl px-5 py-28 text-center lg:px-10">
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
    topics = await fetchTopics(subjectConfig.table, subjectKey);
  } catch (error: any) {
    console.error('Error fetching topics for', subjectKey, error?.message ?? error);
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <Navbar />
        <section className="mx-auto max-w-4xl px-5 py-28 text-center lg:px-10">
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
        <Navbar />
        <section className="mx-auto max-w-4xl px-5 py-28 text-center lg:px-10">
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <SubjectTopicsClient subjectKey={subjectKey} topics={topics} />
    </div>
  );
}
