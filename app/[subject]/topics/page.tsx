import { redirect } from 'next/navigation';
import SubjectTopicsClient from '@/app/subjects/[subject]/SubjectTopicsClient';
import supabase from '@/lib/supabase';
import { slugifySubject } from '@/lib/slugGenerator';
import { buildTopicCountKey, fetchExactTopicCounts } from '@/lib/topicCounts';
import { buildSubjectMetadata } from '@/lib/seo';

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

const VALID_SUB_CATEGORIES = new Set(['ancient', 'medieval', 'modern']);

type SearchParams = {
  sub_category?: string | string[];
  topic?: string | string[];
};

type TopicItem = {
  en: string;
  hi: string;
  count: number;
};

function parseSearchValue(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.en === 'string' && parsed.en.trim().length > 0) {
        return parsed.en.trim();
      }
      if (typeof parsed.hi === 'string' && parsed.hi.trim().length > 0) {
        return parsed.hi.trim();
      }
    }
  } catch {
    // not JSON, fall back to raw string
  }

  return trimmed;
}

function normalizeCategory(value: string) {
  return value.trim().toLowerCase();
}

function extractTopicValues(row: any) {
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

  const topicEn = String(row.topic_en ?? row.topic?.en ?? en ?? '').trim();
  const topicHi = String(row.topic_hi ?? row.topic?.hi ?? hi ?? '').trim();

  return {
    topicEn,
    topicHi,
    topicRaw: String(row.topic ?? row.topic_en ?? row.topic_hi ?? raw ?? '').trim(),
  };
}

async function fetchTopics(tableName: string, subCategory?: string) {
  let query = supabase
    .from(tableName)
    .select('id, topic, topic_en, topic_hi, sub_category')
    .not('topic', 'is', null)
    .order('id', { ascending: true })
    .limit('all');
  let data: any = null;
  let error: any = null;

  if (subCategory) {
    const result = await query.or(`sub_category->>en.eq.${subCategory},sub_category.eq.${subCategory}`);
    data = result.data;
    error = result.error;

    if (error) {
      console.warn('Subcategory JSONB filter failed, falling back to client-side filtering:', error.message);
      const fallbackResult = await supabase.from(tableName).select('*').not('topic', 'is', null).order('id', { ascending: true }).limit('all');
      data = fallbackResult.data;
      error = fallbackResult.error;

      if (!error && Array.isArray(data)) {
        data = (data as any[]).filter((row) => {
          const rawSubCategory = row.sub_category;
          let subCategoryValue = '';

          if (rawSubCategory && typeof rawSubCategory === 'object') {
            subCategoryValue = String(rawSubCategory.en ?? rawSubCategory.hi ?? '').trim();
          } else if (typeof rawSubCategory === 'string') {
            subCategoryValue = rawSubCategory.trim();
            try {
              const parsed = JSON.parse(subCategoryValue);
              if (parsed && typeof parsed === 'object') {
                subCategoryValue = String(parsed.en ?? parsed.hi ?? subCategoryValue).trim();
              }
            } catch {
              // keep original string value
            }
          }

          return subCategoryValue.toLowerCase() === subCategory.toLowerCase();
        });
      }
    }
  } else {
    const result = await query;
    data = result.data;
    error = result.error;
  }

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

export async function generateMetadata({ params, searchParams }: { params: { subject: string }; searchParams: SearchParams }) {
  const subjectKey = String(params.subject).toLowerCase();
  const subjectConfig = SUBJECT_TABLES[subjectKey];

  if (!subjectConfig) {
    return { title: 'Topic not found | Questionwale' };
  }

  const rawSubCategory = Array.isArray(searchParams.sub_category)
    ? searchParams.sub_category[0]
    : searchParams.sub_category;
  const subCategory = rawSubCategory ? normalizeCategory(parseSearchValue(rawSubCategory)) : '';

  return {
    title: subCategory
      ? `${subjectConfig.label} - ${subCategory.charAt(0).toUpperCase() + subCategory.slice(1)} Topics`
      : `${subjectConfig.label} Topics`,
    description: subCategory
      ? `Browse ${subCategory} ${subjectConfig.label} topics and practice questions.`
      : `Browse ${subjectConfig.label} topics and practice questions.`,
  };
}

export default async function TopicPage({
  params,
  searchParams,
}: {
  params: { subject: string };
  searchParams: SearchParams;
}) {
  const subjectKey = String(params.subject).toLowerCase();
  const subjectConfig = SUBJECT_TABLES[subjectKey];

  if (!subjectConfig) {
    return redirect('/subjects');
  }

  const rawSubCategory = Array.isArray(searchParams.sub_category)
    ? searchParams.sub_category[0]
    : searchParams.sub_category;
  const rawTopic = Array.isArray(searchParams.topic) ? searchParams.topic[0] : searchParams.topic;

  const subCategory = rawSubCategory ? normalizeCategory(parseSearchValue(rawSubCategory)) : '';
  const topicValue = rawTopic ? parseSearchValue(rawTopic) : '';

  if (topicValue && !subCategory) {
    const normalizedSlug = slugifySubject(topicValue);
    return redirect(`/${subjectKey}/topics/${encodeURIComponent(normalizedSlug)}`);
  }

  const validSubCategory = VALID_SUB_CATEGORIES.has(subCategory) ? subCategory : undefined;
  const topics = await fetchTopics(subjectConfig.table, validSubCategory);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 pt-8 sm:px-6 lg:px-8 space-y-8">
        <SubjectTopicsClient subjectKey={subjectKey} topics={topics} subCategory={validSubCategory} />
      </div>
    </div>
  );
}
