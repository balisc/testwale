import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';
import questionsData from '@/data/questions.json';
import ClientQuiz from '@/app/subjects/[subject]/[topicSlug]/ClientQuiz';
import { SUPABASE_AVAILABLE } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { subCategoryMatches, topicMatches } from '@/lib/topicMatching';
import { BASE_URL, buildQuizMetadata } from '@/lib/seo';
import JsonLd from '@/components/JsonLd';
import { buildBreadcrumbListSchema } from '@/lib/breadcrumbSchema';
import { slugifySubject } from '@/lib/slugGenerator';
import { legacyColumnsForTable } from '@/lib/questionColumns';
import { MAX_QUIZ_CANDIDATE_ROWS } from '@/lib/supabaseQueryLimits';
import { stripLegacyAnswerFields } from '@/lib/legacyQuiz';
import { findLegacyTopicReplacement } from '@/lib/legacyRoutePolicy';
import { isPermanentlyRemovedLegacyTopicPath } from '@/lib/legacyRouteTombstones';

const HISTORY_SUBCATEGORY_HI: Record<string, string> = {
  ancient: 'प्राचीन',
  medieval: 'मध्यकालीन',
  modern: 'आधुनिक',
};

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
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
};

function escapeForLike(value: string) {
  return value.replace(/([%_\\,()])/g, '\\$1');
}

function getTopicSearchTokens(topic: string) {
  const normalized = normalizeText(topic);
  if (!normalized) return [];
  const words = normalized.split(/\s+/).filter(Boolean);
  const unique = Array.from(new Set(words));
  return unique.filter((word) => word.length >= 3).slice(0, 5);
}

function getHistorySubCategoryKey(topic: string) {
  const normalized = normalizeText(topic);
  if (!normalized) return '';
  if (normalized.includes('modern')) return 'modern';
  if (normalized.includes('medieval')) return 'medieval';
  if (normalized.includes('ancient')) return 'ancient';
  return '';
}

async function fetchCandidateQuestionsFromSupabase(tableName: string, subject: string, normalizedTopic: string) {
  // Unified catalog `questions` uses subject_id/topic_id — never filter on subject/topic text columns.
  if (tableName === 'questions') {
    return [];
  }

  const columns = legacyColumnsForTable(tableName);
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('service_role_required');
  let query: any = admin.from(tableName).select(columns).order('id', { ascending: true });

  const historySubCategoryKey = subject === 'history' ? getHistorySubCategoryKey(normalizedTopic) : '';
  if (historySubCategoryKey) {
    const hiValue = HISTORY_SUBCATEGORY_HI[historySubCategoryKey];
    const escapedEn = escapeForLike(historySubCategoryKey);
    const escapedHi = escapeForLike(hiValue);
    query = query.or(
      `sub_category->>en.eq.${historySubCategoryKey},sub_category->>en.ilike.%${escapedEn}%,sub_category->>hi.ilike.%${escapedHi}%`
    );
  } else {
    const terms = [normalizedTopic, ...getTopicSearchTokens(normalizedTopic)];
    const escapedTerms = Array.from(new Set(terms.map((term) => escapeForLike(term.trim())).filter(Boolean)));
    if (!escapedTerms.length) {
      return [];
    }

    const filters: string[] = [];
    for (const term of escapedTerms) {
      filters.push(`topic->>en.ilike.%${term}%`);
      filters.push(`topic->>hi.ilike.%${term}%`);
    }
    query = query.or(filters.join(','));
  }

  const result: any = await query.range(0, MAX_QUIZ_CANDIDATE_ROWS - 1);
  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []) as any[];
}

const subjectMatches = (rawSubject: unknown, subjectKey: string) => {
  if (rawSubject === null || rawSubject === undefined) {
    return false;
  }

  let value = '';
  if (typeof rawSubject === 'string') {
    value = rawSubject.trim();
  } else if (typeof rawSubject === 'object') {
    if (Array.isArray(rawSubject)) {
      value = rawSubject.map((item) => String(item).trim()).join(' ');
    } else {
      value = String((rawSubject as any).en ?? (rawSubject as any).hi ?? Object.values(rawSubject).join(' ')).trim();
    }
  } else {
    value = String(rawSubject).trim();
  }

  if (!value) {
    return false;
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object') {
      value = String((parsed as any).en ?? (parsed as any).hi ?? Object.values(parsed).join(' ')).trim();
    }
  } catch {
    // ignore invalid JSON
  }

  const normalizedValue = normalizeText(value);
  const normalizedKey = normalizeText(subjectKey);

  if (normalizedValue.includes(normalizedKey)) {
    return true;
  }

  const aliasMap: Record<string, string[]> = {
    history: ['history', 'indian history', 'history questions'],
    science: ['science', 'general science'],
    polity: ['polity', 'indian polity'],
    economics: ['economics'],
    geography: ['geography', 'indian geography'],
    math: ['math', 'mathematics'],
    'general-knowledge': ['general knowledge', 'gk'],
    'current-affairs': ['current affairs', 'current affairs'],
    reasoning: ['reasoning', 'logical reasoning'],
  };

  return (aliasMap[subjectKey] ?? []).some((alias) => normalizedValue.includes(alias));
};

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

function isQuestionVisible(row: any) {
  const status = typeof row?.status === 'string' ? row.status.trim().toLowerCase() : '';
  return !status || status === 'active' || status === 'published';
}

function questionMatchesTopic(row: any, subject: string, normalizedTopic: string) {
  if (!subjectMatches(row.subject, subject)) {
    return false;
  }

  const { topicEn, topicHi, topicRaw } = extractTopicValues(row);
  const candidateTexts = [topicEn, topicHi, topicRaw, row.sub_category, row.sub_category?.en, row.sub_category?.hi]
    .map((value) => (typeof value === 'string' ? value : extractTopicValues({ topic: value }).topicRaw))
    .filter(Boolean);

  if (candidateTexts.some((text) => topicMatches(text, normalizedTopic))) {
    return true;
  }

  const subCategoryValue = row.sub_category ?? row.sub_category_en ?? row.sub_category_hi;
  return subCategoryMatches(subCategoryValue, normalizedTopic);
}

async function fetchQuestionsFromSupabaseTable(tableName: string, subject: string, normalizedTopic: string) {
  const fastCandidates = await fetchCandidateQuestionsFromSupabase(tableName, subject, normalizedTopic);
  return fastCandidates
    .filter(isQuestionVisible)
    .filter((row: any) => questionMatchesTopic(row, subject, normalizedTopic));
}

async function fetchQuizQuestions(subject: string, decodedTopic: string) {
  const quizTable = SUBJECT_TABLES[subject]?.table;
  if (!quizTable) {
    throw new Error(`Invalid subject table for ${subject}`);
  }

  let data: any[] = [];
  let fetchError: string | null = null;
  let unavailable = false;

  try {
    const normalizedTopic = decodedTopic.trim();

    if (!SUPABASE_AVAILABLE && process.env.NODE_ENV === 'production') {
      throw new Error('question_store_unavailable');
    }

    if (!SUPABASE_AVAILABLE) {
      data = (questionsData as any[]).filter((row: any) => questionMatchesTopic(row, subject, normalizedTopic));
    } else {
      data = await fetchQuestionsFromSupabaseTable(quizTable, subject, normalizedTopic);
    }

    if (!data.length) {
      fetchError = `No questions found for ${decodedTopic}.`;
    }
  } catch (err) {
    console.error('Legacy quiz fetch failed:', err instanceof Error ? err.message : 'unknown_error');
    fetchError = 'Quiz questions are temporarily unavailable.';
    unavailable = true;
  }

  return { questions: data, fetchError, unavailable };
}

const resolveLegacyTopicRoute = cache(async (subjectKey: string, normalizedTopicSlug: string) => {
  const decodedTopic = normalizedTopicSlug.replace(/-/g, ' ').trim();
  const replacement = await findLegacyTopicReplacement(subjectKey, normalizedTopicSlug);
  if (replacement) {
    return { kind: 'redirect' as const, destination: replacement.destination, decodedTopic };
  }
  const quiz = await fetchQuizQuestions(subjectKey, decodedTopic);
  return { kind: 'quiz' as const, decodedTopic, ...quiz };
});

export async function generateMetadata({ params }: { params: Promise<{ subject: string; topicSlug: string }> }) {
  const { subject, topicSlug: rawTopicSlug } = await params;
  const subjectKey = String(subject).toLowerCase();
  const subjectConfig = SUBJECT_TABLES[subjectKey];

  if (!subjectConfig) {
    return {
      title: 'Topic not found',
      robots: { index: false, follow: true },
    };
  }

  const topicSlug = decodeTopicSlug(rawTopicSlug);
  const normalizedTopicSlug = slugifySubject(topicSlug);
  if (!normalizedTopicSlug) permanentRedirect(`/${subjectKey}`);
  if (isPermanentlyRemovedLegacyTopicPath(`/${subjectKey}/topics/${normalizedTopicSlug}`)) {
    notFound();
  }
  const resolved = await resolveLegacyTopicRoute(subjectKey, normalizedTopicSlug);
  if (resolved.kind === 'redirect') permanentRedirect(resolved.destination);
  if (resolved.unavailable) throw new Error('Legacy quiz data is temporarily unavailable');
  if (!resolved.questions.length) notFound();

  return buildQuizMetadata(
    subjectConfig.label,
    resolved.decodedTopic,
    `/${subjectKey}/topics/${normalizedTopicSlug}`,
  );
}

export default async function TopicPage({ params }: { params: Promise<{ subject: string; topicSlug: string }> }) {
  const { subject, topicSlug: rawTopicSlug } = await params;
  const subjectKey = String(subject).toLowerCase();
  const subjectConfig = SUBJECT_TABLES[subjectKey];

  if (!subjectConfig) {
    notFound();
  }

  const topicSlug = decodeTopicSlug(String(rawTopicSlug ?? '').trim());
  const normalizedTopicSlug = slugifySubject(topicSlug);
  if (!normalizedTopicSlug) {
    return permanentRedirect(`/${subjectKey}`);
  }
  if (isPermanentlyRemovedLegacyTopicPath(`/${subjectKey}/topics/${normalizedTopicSlug}`)) {
    notFound();
  }

  const resolved = await resolveLegacyTopicRoute(subjectKey, normalizedTopicSlug);
  if (resolved.kind === 'redirect') permanentRedirect(resolved.destination);
  const { questions, fetchError, unavailable, decodedTopic } = resolved;
  if (unavailable) {
    throw new Error('Legacy quiz data is temporarily unavailable');
  }
  if (!questions.length) notFound();
  const topicPath = `/${subjectKey}/topics/${slugifySubject(decodedTopic)}`;
  const breadcrumbJsonLd = buildBreadcrumbListSchema([
    { name: 'Home', href: '/' },
    { name: subjectConfig.label, href: `/${subjectKey}` },
    { name: decodedTopic, href: topicPath },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <ClientQuiz
        questions={(questions ?? []).map((row) => stripLegacyAnswerFields(row))}
        decodedTopic={decodedTopic}
        subject={subjectKey}
        fetchError={fetchError}
      />
    </>
  );
}
