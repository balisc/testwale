import { redirect } from 'next/navigation';
import ClientQuiz from '@/app/subjects/[subject]/[topicSlug]/ClientQuiz';
import supabase from '../../../../lib/supabase';
import { buildSubjectMetadata } from '@/lib/seo';
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

type TopicItem = {
  en: string;
  hi: string;
  count: number;
};

type SearchParams = {
  q?: string | string[];
};

const decodeTopicSlug = (slug: string) => {
  try {
    return decodeURIComponent(slug);
  } catch (err) {
    console.error('--- TERMINAL DEBUG: decodeURIComponent failed ---', err);
    return slug;
  }
};

const normalizeText = (value: unknown) => {
  if (value === null || value === undefined) return '';
  let text = typeof value === 'string' ? value : String(value);

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed)) {
        text = parsed.join(' ');
      } else {
        text = String(parsed.en ?? parsed.hi ?? Object.values(parsed).join(' '));
      }
    }
  } catch {
    // ignore invalid JSON
  }

  return String(text)
    .replace(/[^a-zA-Z0-9\s]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
};

const escapeForLike = (value: string) => value.replace(/([%_\\])/g, '\\$1');

const extractTopicValues = (row: any) => {
  const rawTopic = row.topic;
  let en = '';
  let hi = '';
  let raw = '';

  if (rawTopic && typeof rawTopic === 'object') {
    en = String(rawTopic.en ?? rawTopic.hi ?? '').trim();
    hi = String(rawTopic.hi ?? rawTopic.en ?? '').trim();
    raw = JSON.stringify(rawTopic);
  } else if (typeof rawTopic === 'string') {
    raw = rawTopic.trim();
    en = raw;
    hi = raw;
    try {
      const parsed = JSON.parse(rawTopic);
      if (parsed && typeof parsed === 'object') {
        en = String(parsed.en ?? parsed.hi ?? rawTopic).trim();
        hi = String(parsed.hi ?? parsed.en ?? rawTopic).trim();
      }
    } catch {
      // Keep raw string values.
    }
  }

  const parsedTopicEn = String(row.topic_en ?? row.topic?.en ?? en ?? '').trim();
  const parsedTopicHi = String(row.topic_hi ?? row.topic?.hi ?? hi ?? '').trim();

  return {
    topicEn: parsedTopicEn,
    topicHi: parsedTopicHi,
    topicRaw: String(row.topic ?? row.topic_en ?? row.topic_hi ?? raw ?? '').trim(),
  };
};

const topicMatches = (topicText: string, targetText: string) => {
  const normalizedTopic = normalizeText(topicText);
  const normalizedTarget = normalizeText(targetText);
  if (!normalizedTopic || !normalizedTarget) return false;
  if (normalizedTopic === normalizedTarget) return true;
  if (normalizedTopic.includes(normalizedTarget) || normalizedTarget.includes(normalizedTopic)) return true;

  const targetWords = normalizedTarget.split(' ').filter(Boolean);
  const topicWords = new Set(normalizedTopic.split(' ').filter(Boolean));
  if (!targetWords.length || !topicWords.size) return false;

  const matchedWords = targetWords.filter((word) => topicWords.has(word)).length;
  const overlapRatio = matchedWords / Math.min(targetWords.length, topicWords.size);

  return overlapRatio >= 0.6;
};

async function fetchTopics(tableName: string) {
  const { data, error } = await supabase.from(tableName).select('*').limit('all');
  if (error) {
    console.error('❌ SUPABASE ERROR:', error.message);
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<{
    id: string;
    topic?: { en?: string; hi?: string } | null;
    topic_en?: string | null;
    topic_hi?: string | null;
  }>;

  const seen = new Set<string>();
  const topicItems: TopicItem[] = [];

  for (const row of rows) {
    const { topicEn, topicHi } = extractTopicValues(row);
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

async function fetchQuizQuestions(subject: string, decodedTopic: string) {
  const quizTable = SUBJECT_TABLES[subject]?.table;
  if (!quizTable) {
    throw new Error(`Invalid subject table for ${subject}`);
  }

  let data: any = null;
  let lastError: any = null;
  let questions: any[] = [];
  let fetchError: string | null = null;

  try {
    const normalizedTopic = decodedTopic.trim();
    const escapedTopic = escapeForLike(normalizedTopic);
    const queryBuilders = [
      supabase.from(quizTable).select('*').filter('sub_category->>en', 'eq', normalizedTopic).limit('all'),
      supabase.from(quizTable).select('*').ilike('topic_en', `%${escapedTopic}%`).limit('all'),
      supabase.from(quizTable).select('*').ilike('topic_hi', `%${escapedTopic}%`).limit('all'),
      supabase.from(quizTable).select('*').filter('topic->>en', 'ilike', `%${escapedTopic}%`).limit('all'),
      supabase.from(quizTable).select('*').filter('topic->>hi', 'ilike', `%${escapedTopic}%`).limit('all'),
    ];

    for (const query of queryBuilders) {
      const result = await query;
      if (result.error) {
        lastError = result.error;
        continue;
      }

      if (Array.isArray(result.data) && result.data.length > 0) {
        data = result.data;
        lastError = null;
        break;
      }
    }

    if ((!data || data.length === 0)) {
      const result = await supabase.from(quizTable).select('*').order('id', { ascending: true }).limit('all');
      if (result.error) {
        lastError = result.error;
      } else {
        data = (result.data as any[]) ?? [];
        data = data.filter((row: any) => {
          const { topicEn, topicHi, topicRaw } = extractTopicValues(row);
          return [topicEn, topicHi, topicRaw].some((text) => topicMatches(text, normalizedTopic));
        });
      }
    }

    if (lastError) {
      console.error('❌ SUPABASE ERROR:', lastError.message ?? lastError);
      fetchError = String(lastError.message ?? lastError);
    } else {
      questions = (data ?? []) as any[];
      if (!questions.length) {
        fetchError = `No questions found for ${decodedTopic}.`;
      }
    }
  } catch (err) {
    console.error('❌ QUIZ FETCH ERROR:', err);
    fetchError = 'An unexpected error occurred while fetching quiz questions.';
  }

  return { questions, fetchError };
}

export async function generateMetadata({ params }: { params: { subject: string; topicSlug: string } }) {
  const subjectKey = String(params.subject).toLowerCase();
  const subjectConfig = SUBJECT_TABLES[subjectKey];

  if (!subjectConfig) {
    return { title: 'Topic not found | Questionwale' };
  }

  const topicSlug = decodeTopicSlug(params.topicSlug);
  const topic = topicSlug.replace(/-/g, ' ');

  return {
    title: `${subjectConfig.label}: ${topic} Quiz`,
    description: `Practice ${topic} questions for ${subjectConfig.label}.`,
  };
}

export default async function TopicPage({ params }: { params: { subject: string; topicSlug: string } }) {
  const subjectKey = String(params.subject).toLowerCase();
  const subjectConfig = SUBJECT_TABLES[subjectKey];

  if (!subjectConfig) {
    return redirect('/subjects');
  }

  const topicSlug = decodeTopicSlug(String(params.topicSlug ?? '').trim());
  const normalizedTopicSlug = slugifySubject(topicSlug);

  let topics: TopicItem[] = [];
  try {
    topics = await fetchTopics(subjectConfig.table);
  } catch (error) {
    console.error('Error fetching topics for', subjectKey, error);
    return redirect(`/${subjectKey}`);
  }

  const findTopicBySlug = (slug: string) => {
    const exact = topics.find((topic) => slugifySubject(topic.en || topic.hi) === slug);
    if (exact) return exact;

    const fuzzy = topics.find((topic) => {
      const topicSlugs = [topic.en, topic.hi]
        .filter(Boolean)
        .map((value) => slugifySubject(value));

      return topicSlugs.some((topicSlugValue) =>
        topicSlugValue === slug || slug.includes(topicSlugValue) || topicSlugValue.includes(slug)
      );
    });
    if (fuzzy) return fuzzy;

    const slugWords = slug.split('-').filter(Boolean);
    return topics.find((topic) => {
      const combined = `${topic.en} ${topic.hi}`.toLowerCase();
      const matchedWords = slugWords.filter((word) => combined.includes(word));
      return matchedWords.length >= Math.max(3, Math.floor(slugWords.length * 0.6));
    });
  };

  const topicItem = findTopicBySlug(normalizedTopicSlug);
  const decodedTopic = topicItem?.en || topicItem?.hi || topicSlug.replace(/-/g, ' ');

  if (!decodedTopic) {
    return redirect(`/${subjectKey}`);
  }

  const { questions, fetchError } = await fetchQuizQuestions(subjectKey, decodedTopic);

  return (
    <ClientQuiz
      questions={questions ?? []}
      decodedTopic={decodedTopic}
      subject={subjectKey}
      fetchError={fetchError}
    />
  );
}
