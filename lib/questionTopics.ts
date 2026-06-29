import supabase, { SUPABASE_AVAILABLE } from './supabase';
import { buildTopicCountKey, fetchExactTopicCounts } from './topicCounts';
import { subCategoryMatches } from './topicMatching';

export type TopicItem = {
  en: string;
  hi: string;
  count: number;
};

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

const SUPABASE_FETCH_LIMIT = 10000;
const SUPABASE_PAGE_SIZE = 1000;

function sanitizeTopicText(value: string): string {
  return String(value)
    .replace(/[\u0000-\u001F\u007F-\u009F]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

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

  return {
    topicEn: sanitizeTopicText(topicEn),
    topicHi: sanitizeTopicText(topicHi),
  };
}

function extractSubCategoryValue(rawSubCategory: unknown) {
  if (rawSubCategory === null || rawSubCategory === undefined) {
    return '';
  }

  let value = '';
  if (typeof rawSubCategory === 'string') {
    value = rawSubCategory.trim();
  } else if (typeof rawSubCategory === 'object') {
    if (Array.isArray(rawSubCategory)) {
      value = rawSubCategory.map((item) => String(item).trim()).join(' ');
    } else {
      value = String((rawSubCategory as any).en ?? (rawSubCategory as any).hi ?? Object.values(rawSubCategory).join(' ')).trim();
    }
  } else {
    value = String(rawSubCategory).trim();
  }

  if (!value) {
    return '';
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object') {
      return String((parsed as any).en ?? (parsed as any).hi ?? Object.values(parsed).join(' ')).trim();
    }
  } catch {
    // ignore invalid JSON
  }

  return value;
}

function normalizeCategorySearchValue(value: string) {
  return value
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTextValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        return extractTextValue(parsed);
      }
    } catch {
      // ignore invalid JSON and fall back to the plain string
    }

    return trimmed;
  }

  if (Array.isArray(value)) {
    return value.map((item) => extractTextValue(item)).filter(Boolean).join(' ');
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const directText = [record.en, record.hi, record.label, record.name, record.title]
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .find(Boolean);

    if (directText) {
      return directText;
    }

    return Object.values(record).map((entry) => extractTextValue(entry)).filter(Boolean).join(' ');
  }

  return String(value).trim();
}

function doesSubCategoryMatch(row: any, subCategory: string) {
  const target = normalizeCategorySearchValue(subCategory);
  if (!target) {
    return false;
  }

  const explicitValue = extractTextValue(row?.sub_category);
  if (subCategoryMatches(explicitValue, target)) {
    return true;
  }

  const candidateValues = [row?.topic, row?.topic_en, row?.topic_hi, row?.sub_category, row?.sub_category_en, row?.sub_category_hi];

  for (const candidate of candidateValues) {
    if (subCategoryMatches(candidate, target)) {
      return true;
    }
  }

  return false;
}

function normalizeSubjectSearchValue(value: string) {
  return value
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function subjectMatches(rawSubject: unknown, subjectKey: string) {
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

  const normalizedValue = normalizeSubjectSearchValue(value);
  const normalizedKey = normalizeSubjectSearchValue(subjectKey);

  return normalizedValue.includes(normalizedKey);
}

function escapeForLike(value: string) {
  return value.replace(/([%_\\])/g, '\\$1');
}

function isJsonSyntaxError(error: any) {
  const message = String(error?.message ?? '').toLowerCase();
  return message.includes('invalid input syntax for type json');
}

function addSubjectFilter(query: any, subjectKey: string) {
  const escaped = escapeForLike(subjectKey);
  const escapedWithSpaces = escapeForLike(normalizeSubjectSearchValue(subjectKey));
  return query.or(
    `subject->>en.ilike.%${escaped}%,subject->>hi.ilike.%${escaped}%,subject->>en.ilike.%${escapedWithSpaces}%,subject->>hi.ilike.%${escapedWithSpaces}%`
  );
}

function getSubjectTable(subjectKey: string): string | undefined {
  return SUBJECT_TABLES[subjectKey];
}

// The preferred fast path uses a Supabase RPC to GROUP BY the JSONB topic field.
// Create the RPC in your database using `scripts/create_topic_group_counts_function.sql`.
// Then call it like:
//   supabase.rpc('topic_group_counts', { table_name: 'polity_questions', category: 'ancient' })
// This avoids unsupported `.group()` and keeps the aggregation on the DB.
// The RPC groups by topic->>'en' and topic->>'hi', returns a count for all rows,
// and orders topics by the first occurrence of the topic row via MIN(id).
function extractTopicListRow(row: any): TopicItem {
  const { topicEn, topicHi } = parseTopicFields(row);
  const countValue = Number(row.count ?? row['count'] ?? row.count_id ?? row['count_id'] ?? 0);
  return {
    en: topicEn,
    hi: topicHi,
    count: Number.isFinite(countValue) ? countValue : 0,
  };
}

function dedupeTopics(rows: any[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = JSON.stringify({
      topic: row.topic,
    });
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function fetchTopicsFromSubjectTable(tableName: string, subCategory?: string): Promise<TopicItem[]> {
  try {
    const rpcResult: any = await supabase.rpc('topic_group_counts', {
      category: subCategory ?? null,
      table_name: tableName,
    });

    if (rpcResult.error) {
      throw rpcResult.error;
    }

    const rows = (rpcResult.data ?? []) as any[];
    if (subCategory && rows.length === 0) {
      throw new Error('No RPC rows returned for filtered subject category.');
    }

    return rows.map((row: any) => extractTopicListRow(row));
  } catch (error: any) {
    console.warn('Subject table RPC failed or returned empty for category filter, falling back to client-side aggregation:', error?.message ?? error);

    let rows: any[] = [];
    for (let offset = 0; offset < SUPABASE_FETCH_LIMIT; offset += SUPABASE_PAGE_SIZE) {
      const fallback = await supabase
        .from(tableName)
        .select('id, topic, sub_category', { head: false })
        .not('topic', 'is', null)
        .order('id', { ascending: true })
        .range(offset, offset + SUPABASE_PAGE_SIZE - 1);

      if (fallback.error) {
        throw fallback.error;
      }

      const batch = (fallback.data ?? []) as any[];
      rows.push(...batch);

      if (batch.length < SUPABASE_PAGE_SIZE) {
        break;
      }
    }

    if (subCategory) {
      rows = rows.filter((row) => doesSubCategoryMatch(row, subCategory));
    }

    const grouped = new Map<string, { count: number; firstId: number }>();
    for (const row of rows) {
      const key = JSON.stringify(row.topic);
      const record = grouped.get(key);
      const idValue = Number(row.id ?? 0);
      if (record) {
        record.count += 1;
        record.firstId = Math.min(record.firstId, idValue);
      } else {
        grouped.set(key, { count: 1, firstId: idValue });
      }
    }

    return Array.from(grouped.entries())
      .map(([topicRaw, meta]) => {
        const row = { topic: JSON.parse(topicRaw) };
        const { topicEn, topicHi } = parseTopicFields(row);
        return { en: topicEn, hi: topicHi, count: meta.count, firstId: meta.firstId };
      })
      .sort((a, b) => a.firstId - b.firstId)
      .map(({ firstId, ...topic }) => topic);
  }
}

export async function fetchTopicsFromQuestions(subjectKey: string, subCategory?: string) {
  if (!SUPABASE_AVAILABLE) {
    console.warn('Supabase is not configured; skipping local topic fallback so only database-backed topics are shown.');
    return [];
  }

  const subjectTable = getSubjectTable(subjectKey);
  if (subjectTable) {
    try {
      const supabaseTopics = await fetchTopicsFromSubjectTable(subjectTable, subCategory);
      if (supabaseTopics.length > 0) {
        return supabaseTopics;
      }

      console.warn('No Supabase topic rows found for', subjectKey, 'with subCategory', subCategory, '- falling back to local JSON');
    } catch (error: any) {
      console.warn(
        'Subject-specific table fetch failed for',
        subjectKey,
        '- falling back to generic questions table:',
        error?.message ?? error
      );
    }
  }

  const selectFields = 'topic, subject, sub_category';
  let query = supabase
    .from('questions')
    .select(selectFields)
    .not('topic', 'is', null)
    .range(0, SUPABASE_FETCH_LIMIT - 1);

  query = addSubjectFilter(query, subjectKey);

  let result: any;
  let rows: any[] = [];

  try {
    result = await query;
  } catch (error) {
    result = { data: null, error: error as any };
  }

  const shouldFallback = result.error || (Array.isArray(result.data) && result.data.length === 0);

  if (shouldFallback) {
    if (result.error && !isJsonSyntaxError(result.error)) {
      console.warn('⚠️ Subject topic query failed, returning no topics:', result.error.message ?? result.error);
    }

    return [];
  }

  rows = (result.data ?? []) as any[];

  if (subCategory) {
    rows = rows.filter((row) => doesSubCategoryMatch(row, subCategory));
  }

  rows = dedupeTopics(rows);

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

  if (topicItems.length === 0) {
    return [];
  }

  const countsTable = subjectTable ?? 'questions';
  const exactCounts = await fetchExactTopicCounts(countsTable, topicItems, subjectKey);

  return topicItems.map((topic) => ({
    ...topic,
    count: exactCounts.get(buildTopicCountKey(topic)) ?? 0,
  }));
}
