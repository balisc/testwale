import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
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

type TopicItem = {
  en: string;
  hi: string;
};

async function fetchTopics(tableName: string, subjectKey: string) {
  const normalizedSubjectKey = String(subjectKey).trim().toLowerCase();
  console.log('--- TERMINAL DEBUG: Fetching topics for subject ---', normalizedSubjectKey);

  let data: any = null;
  let error: any = null;

  // Fetch all columns and normalize topic/subject fields in JS to support multiple table schemas.
  ({ data, error } = await supabase
    .from(tableName)
    .select('*')
    .not('topic', 'is', null));

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

  // Filter by subject if columns exist, otherwise trust the table data
  let filteredRows = rows;
  if (rows.length > 0 && rows[0].subject_en !== undefined) {
    // Bilingual table format
    filteredRows = rows.filter((row) => {
      const subjectEn = String(row.subject_en ?? '').trim().toLowerCase();
      return subjectEn === normalizedSubjectKey;
    });
  } else if (rows.length > 0 && rows[0].subject !== undefined) {
    // JSON object format or plain string subject field
    filteredRows = rows.filter((row) => {
      const subjectValue = row.subject;
      const subjectEn =
        typeof subjectValue === 'string'
          ? String(subjectValue).trim().toLowerCase()
          : String(subjectValue?.en ?? '').trim().toLowerCase();
      return subjectEn === normalizedSubjectKey;
    });
  }

  const uniqueTopics: TopicItem[] = [];
  const seen = new Set<string>();

  for (const row of filteredRows) {
    // Handle both JSON object format (history) and separate columns format (others)
    const topicEn = String(row.topic?.en ?? row.topic_en ?? row.topic ?? '').trim();
    const topicHi = String(row.topic?.hi ?? row.topic_hi ?? '').trim();
    const key = `${topicEn}||${topicHi}`;

    if (!topicEn && !topicHi) continue;
    if (seen.has(key)) continue;

    seen.add(key);
    uniqueTopics.push({ en: topicEn, hi: topicHi });
  }

  uniqueTopics.sort((a, b) => a.en.localeCompare(b.en, 'en', { sensitivity: 'base' }));
  console.log('--- TERMINAL DEBUG: Unique topics count ---', uniqueTopics.length);
  return uniqueTopics;
}

export async function generateMetadata({ params }: { params: { subject: string } }) {
  const subjectKey = String(params.subject).toLowerCase();
  const subject = SUBJECT_TABLES[subjectKey];

  if (!subject) {
    return {
      title: 'Subject Not Found | Testwale',
      description: 'The requested subject does not exist.',
    };
  }

  return {
    title: `${subject.label} Topics | Testwale`,
    description: `Browse ${subject.label} topics and start practicing on Testwale.`,
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
        <Footer />
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
        <Footer />
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
        <Footer />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <SubjectTopicsClient subjectKey={subjectKey} topics={topics} />
      <Footer />
    </div>
  );
}
