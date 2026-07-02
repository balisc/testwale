import Link from 'next/link';
import { notFound } from 'next/navigation';
import SubjectPageClient from './SubjectPageClient';
import GeographyClient from '../geography/GeographyClient';
import EconomicsClient from '../economics/EconomicsClient';
import MathClient from '../math/MathClient';
import ScienceClient from '../science/ScienceClient';
import HistoryClient from '../history/HistoryClient';
import { buildSubjectMetadata } from '@/lib/seo';
import { fetchTopicsFromQuestions, TopicItem } from '@/lib/questionTopics';

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

export const revalidate = 3600;

async function fetchTopics(subjectKey: string) {
  return fetchTopicsFromQuestions(subjectKey);
}

export async function generateMetadata({ params }: { params: Promise<{ subject: string }> }) {
  const { subject: subjectParam } = await params;
  const subjectKey = String(subjectParam).toLowerCase();
  const subjectConfig = SUBJECT_TABLES[subjectKey];

  if (!subjectConfig) {
    return {
      title: 'Subject not found',
      description: 'The requested subject does not exist.',
      robots: { index: false, follow: true },
    };
  }

  return buildSubjectMetadata(subjectConfig.label, `/${subjectKey}`);
}

export default async function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  const subjectKey = String(subject).toLowerCase();
  const subjectConfig = SUBJECT_TABLES[subjectKey];

  if (!subjectConfig) {
    notFound();
  }

  if (subjectKey === 'geography') {
    return <GeographyClient />;
  }

  if (subjectKey === 'economics') {
    return <EconomicsClient />;
  }

  if (subjectKey === 'math') {
    return <MathClient />;
  }

  if (subjectKey === 'science') {
    return <ScienceClient />;
  }

  if (subjectKey === 'history') {
    return <HistoryClient />;
  }

  let topics: TopicItem[] = [];
  try {
    topics = await fetchTopics(subjectKey);
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
