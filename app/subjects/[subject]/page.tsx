import { permanentRedirect } from 'next/navigation';
import { slugifySubject } from '@/lib/slugGenerator';
import { fetchTopicsFromQuestions } from '@/lib/questionTopics';

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

type SearchParams = {
  topic?: string | string[];
  topicKey?: string | string[];
  slug?: string | string[];
  v?: string | string[];
};

function slugifyTopic(topic: string) {
  return encodeURIComponent(slugifySubject(topic));
}

async function fetchTopics(subjectKey: string) {
  return fetchTopicsFromQuestions(subjectKey);
}

export default async function LegacySubjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ subject: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { subject } = await params;
  const resolvedSearchParams = await searchParams;
  const subjectKey = String(subject).toLowerCase();
  const subjectConfig = SUBJECT_TABLES[subjectKey];

  if (!subjectConfig) {
    return permanentRedirect('/subjects');
  }

  const topicKeyParam = Array.isArray(resolvedSearchParams.topicKey)
    ? resolvedSearchParams.topicKey[0]
    : resolvedSearchParams.topicKey;
  const topicParam = Array.isArray(resolvedSearchParams.topic) ? resolvedSearchParams.topic[0] : resolvedSearchParams.topic;
  const topicValue = String(topicParam ?? '').trim();

  if (topicKeyParam) {
    const idx = Number.parseInt(String(topicKeyParam), 10);
    if (!Number.isFinite(idx) || idx < 0) {
      return permanentRedirect(`/${subjectKey}`);
    }

    let topicsList: Array<{ en: string; hi: string }> = [];
    try {
      topicsList = await fetchTopics(subjectKey);
    } catch (err) {
      return permanentRedirect(`/${subjectKey}`);
    }

    const topicItem = topicsList[idx];
    const decodedTopic = topicItem ? (topicItem.en || topicItem.hi || '').trim() : '';
    if (decodedTopic) {
      return permanentRedirect(`/${subjectKey}/topics/${slugifyTopic(decodedTopic)}`);
    }

    return permanentRedirect(`/${subjectKey}`);
  }

  if (topicValue) {
    const slugParam = Array.isArray(resolvedSearchParams.slug) ? resolvedSearchParams.slug[0] : resolvedSearchParams.slug;
    const slugValue = slugParam ? String(slugParam).trim() : '';
    if (slugValue) {
      return permanentRedirect(`/${subjectKey}/topics/${slugifyTopic(slugValue)}`);
    }

    return permanentRedirect(`/${subjectKey}/topics/${slugifyTopic(topicValue)}`);
  }

  return permanentRedirect(`/${subjectKey}`);
}
