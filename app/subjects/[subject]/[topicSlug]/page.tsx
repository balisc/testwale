import Link from 'next/link';
import supabase from '../../../../lib/supabase';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import ClientQuiz from './ClientQuiz';
import { buildTopicMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const formatSubjectLabel = (subjectKey: string) => {
  return String(subjectKey)
    .trim()
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

type Question = Record<string, any>;

const SUBJECT_TABLES: Record<string, string> = {
  history: 'history_questions',
  science: 'science_questions',
  polity: 'polity_questions',
  economics: 'economics_questions',
  geography: 'geography_questions',
  'general-knowledge': 'general_knowledge_questions',
  math: 'math_questions',
  'current-affairs': 'current_affairs_questions',
  reasoning: 'reasoning_questions',
};

const decodeTopicSlug = (slug: string) => {
  try {
    return decodeURIComponent(slug);
  } catch (err) {
    console.error('--- TERMINAL DEBUG: decodeURIComponent failed ---', err);
    return slug;
  }
};

export async function generateMetadata({ params }: { params: { subject: string; topicSlug: string } }) {
  const subjectKey = String(params.subject ?? '').trim().toLowerCase();
  const subjectName = formatSubjectLabel(subjectKey);
  const topicName = decodeTopicSlug(String(params.topicSlug ?? ''));

  if (!SUBJECT_TABLES[subjectKey]) {
    return {
      title: 'Quiz Not Found | Questionwale',
      description: 'The requested quiz page does not exist.',
    };
  }

  return buildTopicMetadata(subjectName, topicName);
}

export default async function QuizPage({ params }: { params: { subject: string; topicSlug: string } }) {
  console.log('--- TERMINAL DEBUG: Raw params received ---', params);

  const subject = String(params.subject ?? '').trim().toLowerCase();
  const decodedTopic = decodeTopicSlug(String(params.topicSlug ?? '').trim());
  console.log('--- TERMINAL DEBUG: Decoded target topic ---', decodedTopic);

  const quizTable = SUBJECT_TABLES[subject];
  if (!quizTable) {
    console.error('❌ SUPABASE ERROR: Invalid subject for quiz table lookup.', { subject });
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />
        <section className="mx-auto max-w-4xl px-5 py-28 text-center lg:px-10">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Subject not found</p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-900">Invalid subject</h1>
          <p className="mt-4 text-slate-600">The requested subject does not map to a valid quiz table.</p>
          <div className="mt-8">
            <Link href="/subjects" className="inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">
              Back to Subjects
            </Link>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  let questions: Question[] | null = null;
  let fetchError: string | null = null;

  try {
    // Prepare safe token formats
    const escapedTopic = decodedTopic.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const jsonToken = `"${decodedTopic}"`; // a JSON string literal, e.g. "Buddhism and Jainism"

    console.log('--- TERMINAL DEBUG: Escaped topic ---', escapedTopic);
    console.log('--- TERMINAL DEBUG: JSON token for json/jsonb ---', jsonToken);

    let data: any = null;
    let error: any = null;

    if (subject === 'history') {
      const normalizedTopic = decodedTopic.trim();
      const candidateQueries = [
        { label: 'topic->>en', filter: () => supabase.from(quizTable).select('*').filter('topic->>en', 'eq', normalizedTopic) },
        { label: 'topic->>hi', filter: () => supabase.from(quizTable).select('*').filter('topic->>hi', 'eq', normalizedTopic) },
        { label: 'topic equals raw string', filter: () => supabase.from(quizTable).select('*').eq('topic', normalizedTopic) },
        { label: 'topic JSON equals', filter: () => supabase.from(quizTable).select('*').eq('topic', jsonToken) },
      ];

      for (const query of candidateQueries) {
        console.log(`--- TERMINAL DEBUG: history: trying ${query.label} ---`);
        const res = await query.filter();
        data = res.data;
        error = res.error;

        if (error) {
          console.error(`❌ SUPABASE ERROR (history ${query.label}):`, error.message ?? error);
          console.error('Full Error Object:', error);
          fetchError = error.message ?? String(error);
          continue;
        }

        if (data && data.length > 0) {
          break;
        }
      }

      if (!error && (!data || data.length === 0)) {
        console.log('--- TERMINAL DEBUG: history: fallback to client-side topic comparison ---');
        const res4 = await supabase.from(quizTable).select('*');
        data = res4.data;
        error = res4.error;
        if (!error && data) {
          data = (data as any[]).filter((row) => {
            const topicValue = row.topic;
            const topicEn = String(topicValue?.en ?? '').trim();
            const topicHi = String(topicValue?.hi ?? '').trim();
            const topicRaw = String(topicValue ?? '').trim();
            return [topicEn, topicHi, topicRaw].includes(normalizedTopic);
          });
        }
        if (error) {
          console.error('❌ SUPABASE ERROR (history fallback all):', error.message ?? error);
          console.error('Full Error Object:', error);
          fetchError = error.message ?? String(error);
        }
      }
    } else {
      const result = await supabase.from(quizTable).select('*');
      data = result.data;
      error = result.error;
      if (!error && data) {
        data = (data as any[]).filter((row) => {
          const rowTopicEn = String(row.topic_en ?? row.topic?.en ?? row.topic ?? '').trim();
          const rowTopicHi = String(row.topic_hi ?? row.topic?.hi ?? '').trim();
          return rowTopicEn === decodedTopic || rowTopicHi === decodedTopic;
        });
      }
      if (error) {
        console.error('❌ SUPABASE ERROR:', error.message ?? error);
        console.error('Full Error Object:', error);
        fetchError = error.message ?? String(error);
      }
    }

    if (!error) {
      console.log('✅ TERMINAL DEBUG: Fetch success. Total questions:', data?.length);
      try {
        const sampleIds = (data ?? []).slice(0, 5).map((r: any) => r.id ?? r._id ?? r.pk ?? null);
        console.log('✅ TERMINAL DEBUG: Sample question ids:', sampleIds);
      } catch (e) {
        console.log('✅ TERMINAL DEBUG: Failed to read sample ids', e);
      }
      questions = (data ?? []) as Question[];
      if (!questions.length) {
        console.error('❌ SUPABASE ERROR: No questions found for exact topic match.');
        fetchError = `No questions found for ${decodedTopic}. Please check if the topic name matches exactly in your Supabase table column.`;
      }
    }
  } catch (err) {
    console.error('❌ TERMINAL DEBUG: Fetch exception:', err);
    fetchError = 'An unexpected error occurred while fetching quiz questions.';
  }

  // Render a client component that safely handles object fields and language state
  return (
    <ClientQuiz questions={questions ?? []} decodedTopic={decodedTopic} subject={subject} fetchError={fetchError} />
  );
}
